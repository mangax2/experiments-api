import _ from 'lodash'
import uniq from 'lodash/uniq'
import inflector from 'json-inflector'
import Transactional from '@monsantoit/pg-transactional'
import { dbRead, dbWrite } from '../db/DbManager'
import configurator from '../configs/configurator'
import AppUtil from './utility/AppUtil'
import AppError from './utility/AppError'
import QuestionsUtil from './utility/QuestionsUtil'
import ExperimentalUnitValidator from '../validations/ExperimentalUnitValidator'
import TreatmentService from './TreatmentService'
import ExperimentsService from './ExperimentsService'
import SecurityService from './SecurityService'
import TreatmentBlockService from './TreatmentBlockService'
import { notifyChanges, sendKafkaNotification } from '../decorators/notifyChanges'
import LocationAssociationService from './LocationAssociationService'
import KafkaProducer from './kafka/KafkaProducer'
import validateSetEntryIdPairs from '../validations/SetEntryIdPairsValidator'

const { getFullErrorCode, setErrorCode } = require('@monsantoit/error-decorator')()

const experimentalUnitDeactivationSchema = {
  type: 'record',
  fields: [
    {
      name: 'experimentalUnitId',
      type: 'int',
    },
    {
      name: 'deactivationReason',
      type: [
        'null',
        'string',
      ],
      default: null,
    },
    {
      name: 'setEntryId',
      type: 'int',
    },
  ],
}

// Error Codes 17XXXX
class ExperimentalUnitService {
  constructor() {
    this.validator = new ExperimentalUnitValidator()
    this.treatmentService = new TreatmentService()
    this.experimentService = new ExperimentsService()
    this.locationAssociationService = new LocationAssociationService()
    this.securityService = new SecurityService()
    this.treatmentBlockService = new TreatmentBlockService()
  }

  @setErrorCode('172000')
  @Transactional('partialUpdateExperimentalUnitsTx')
  batchPartialUpdateExperimentalUnits(experimentalUnits, context, tx) {
    return this.validator.validate(experimentalUnits, 'PATCH')
      .then(() => {
        ExperimentalUnitService.uniqueIdsCheck(experimentalUnits, 'id')
        ExperimentalUnitService.uniqueIdsCheck(experimentalUnits, 'setEntryId')

        return dbWrite.unit.batchPartialUpdate(experimentalUnits, context, tx)
          .then(data => AppUtil.createPutResponse(data))
      })
  }

  @setErrorCode('173000')
  static uniqueIdsCheck(experimentalUnits, idKey) {
    const ids = _.map(experimentalUnits, idKey)
    if (ids.length !== _.uniq(ids).length) {
      throw AppError.badRequest(`Duplicate ${idKey}(s) in request payload`, undefined, getFullErrorCode('173001'))
    }
  }

  @setErrorCode('174000')
  getUnitsFromTemplateByExperimentId(id, context) {
    return this.experimentService.findExperimentWithTemplateCheck(id, true, context)
      .then(() => this.getExperimentalUnitsByExperimentIdNoValidate(id))
  }

  @setErrorCode('175000')
  getUnitsFromExperimentByExperimentId(id, context) {
    return this.experimentService.findExperimentWithTemplateCheck(id, false, context)
      .then(() => this.getExperimentalUnitsByExperimentIdNoValidate(id))
  }

  @setErrorCode('178000')
  getExperimentalUnitsByExperimentIdNoValidate = id =>
    dbRead.unit.findAllByExperimentId(id)

  @setErrorCode('179000')
  getExperimentalUnitInfoBySetId = (setId) => {
    if (setId) {
      return dbRead.unit.batchFindAllBySetId(setId).then((units) => {
        if (units.length === 0) {
          throw AppError.notFound('Either the set was not found or no set entries are associated with the set.', undefined, getFullErrorCode('179001'))
        }
        return this.mapUnitsToSetEntryFormat(units)
      })
    }

    throw AppError.badRequest('A setId is required')
  }

  @setErrorCode('17A000')
  getExperimentalUnitInfoBySetEntryId = (setEntryIds) => {
    if (setEntryIds) {
      return dbRead.unit.batchFindAllBySetEntryIds(setEntryIds)
        .then(this.mapUnitsToSetEntryFormat)
    }

    throw AppError.badRequest('Body must contain at least one set entry id', undefined, getFullErrorCode('17A001'))
  }

  @setErrorCode('17B000')
  mapUnitsToSetEntryFormat = (units) => {
    const setEntryUnitMap = {}
    _.forEach(units, (u) => {
      setEntryUnitMap[u.set_entry_id] = {
        treatmentId: u.treatment_id,
        treatmentNumber: u.treatment_number,
        rep: u.rep,
      }
    })
    return setEntryUnitMap
  }

  @setErrorCode('17C000')
  getExperimentalUnitsBySetIds = ids => dbRead.unit.batchFindAllBySetIds(ids)

  @setErrorCode('17F000')
  @Transactional('updateUnitsForSet')
  updateUnitsForSet = (setId, experimentalUnits, context, tx) =>
    this.locationAssociationService.getBySetId(setId).then((setInfo) => {
      if (!setInfo) {
        throw AppError.notFound(`No experiment found for Set Id ${setId}`, undefined, getFullErrorCode('17F001'))
      }
      return Promise.all([
        dbRead.combinationElement.findAllByExperimentIdIncludingControls(setInfo.experiment_id),
        dbRead.experiments.find(setInfo.experiment_id, false),
      ]).then(([combinationElements, experiment]) => {
        if (experiment.randomization_strategy_code !== 'custom-build-on-map') {
          throw AppError.badRequest('This endpoint only supports sets/experiments with a "Custom - Build on Map" randomization strategy.', undefined, getFullErrorCode('17F004'))
        }
        const elementsByTreatmentId = _.groupBy(combinationElements, 'treatment_id')
        const factorLevelIdsToTreatmentIdMapper = {}
        _.forEach(elementsByTreatmentId, (ces, treatmentId) => {
          const factorLevelIds = _.map(ces, 'factor_level_id')
          const key = factorLevelIds.sort().join(',')
          factorLevelIdsToTreatmentIdMapper[key] = Number(treatmentId)
        })
        const units = _.map(experimentalUnits, (unit) => {
          const newUnit = _.pick(unit, 'rep', 'setEntryId', 'location')
          const factorLevelIds = unit.factorLevelIds || []
          newUnit.factorLevelKey = factorLevelIds.sort().join(',')
          newUnit.treatmentId = factorLevelIdsToTreatmentIdMapper[newUnit.factorLevelKey]
          return newUnit
        })
        const unitsWithoutTreatmentId = _.filter(units, unit => !unit.treatmentId)
        if (unitsWithoutTreatmentId.length > 0) {
          const stringifiedCombinations = JSON.stringify(_.map(unitsWithoutTreatmentId, 'factorLevelKey'))
          console.error(`[[${context.requestId}]] Attempted to save the following invalid factor level combinations to Set Id ${setId}: ${stringifiedCombinations}`)
          throw AppError.badRequest(`One or more entries had an invalid combination of factor level ids. The invalid combinations are: ${stringifiedCombinations}`, undefined, getFullErrorCode('17F002'))
        }
        _.forEach(units, (unit) => {
          delete unit.factorLevelKey
        })
        const treatmentIdsUsed = _.uniq(_.map(units, 'treatmentId'))
        return dbRead.treatmentBlock.batchFindByBlockIds(setInfo.block_id)
          .then((treatmentBlocks) => {
            const treatmentWithMismatchedBlock = treatmentIdsUsed.filter(treatmentId =>
              !treatmentBlocks.find(treatmentBlock => treatmentBlock.treatment_id === treatmentId))
            if (treatmentWithMismatchedBlock.length > 0) {
              throw AppError.badRequest('One or more entries used a treatment from a block that does not match the set\'s block.', undefined, getFullErrorCode('17F003'))
            }
            return this.mergeSetEntriesToUnits(setInfo.experiment_id, units, setInfo.location,
              treatmentBlocks, context, tx)
          })
      })
    })

  @notifyChanges('update', 0)
  @setErrorCode('17G000')
  @Transactional('mergeSetEntriesToUnits')
  mergeSetEntriesToUnits = (experimentId, unitsToSave, location, treatmentBlocks, context, tx) =>
    dbRead.unit.batchFindAllByLocationAndTreatmentBlocks(location, _.map(treatmentBlocks, 'id'))
      .then((unitsFromDB) => {
        unitsToSave.forEach((unit) => {
          const matchingTreatmentBlock = treatmentBlocks.find(
            treatmentBlock => treatmentBlock.treatment_id === unit.treatmentId)
          unit.treatmentBlockId = _.get(matchingTreatmentBlock, 'id')
          delete unit.treatmentId
        })
        const {
          unitsToBeCreated, unitsToBeDeleted, unitsToBeUpdated,
        } = this.getDbActions(unitsToSave, unitsFromDB, location)

        return this.saveToDb(unitsToBeCreated, unitsToBeUpdated, unitsToBeDeleted, context, tx)
      })

  @setErrorCode('17H000')
  getDbActions = (unitsFromMessage, unitsFromDB, location) => {
    const unitsFromDbCamelizeLower = inflector.transform(unitsFromDB, 'camelizeLower')
    _.forEach(unitsFromMessage, (unitM) => {
      unitM.location = location
    })
    const unitsFromDbSlim = _.map(unitsFromDbCamelizeLower, unit => _.pick(unit, 'rep', 'treatmentBlockId', 'setEntryId', 'location'))
    const unitsToBeCreated = _.differenceBy(unitsFromMessage, unitsFromDbSlim, 'setEntryId')
    const unitsToBeDeleted = _.map(_.differenceBy(unitsFromDbCamelizeLower, unitsFromMessage, 'setEntryId'), 'id')
    const unitsThatAlreadyExist = _.difference(unitsFromMessage, unitsToBeCreated)
    const unitsThatNeedUpdating = _.differenceWith(unitsThatAlreadyExist,
      unitsFromDbSlim, _.isEqual)
    const unitsToBeUpdated = _.map(unitsThatNeedUpdating, (unitToBeUpdated) => {
      unitToBeUpdated.id = _.find(unitsFromDbCamelizeLower, unitFromDb =>
        unitFromDb.setEntryId === unitToBeUpdated.setEntryId).id
      return unitToBeUpdated
    })

    return {
      unitsToBeCreated,
      unitsToBeUpdated,
      unitsToBeDeleted,
    }
  }

  @setErrorCode('17I000')
  saveToDb = (unitsToBeCreated, unitsToBeUpdated, unitsToBeDeleted, context, tx) => Promise.all([
    dbWrite.unit.batchCreate(unitsToBeCreated, context, tx),
    dbWrite.unit.batchUpdate(unitsToBeUpdated, context, tx),
    dbWrite.unit.batchRemove(unitsToBeDeleted, tx),
  ])

  @setErrorCode('17J000')
  @Transactional('deactivateExperimentalUnitsTx')
  deactivateExperimentalUnits = (requestBody, context, tx) =>
    this.validateDeactivations(requestBody).then(() => {
      const [setEntryIdSubset, idSubset] = _.partition(requestBody, 'setEntryId')
      const setEntryIds = _.map(setEntryIdSubset, 'setEntryId')
      const ids = _.map(idSubset, 'id')

      const unitsFromSetEntryIdsPromise = setEntryIds.length > 0
        ? dbRead.unit.batchFindAllBySetEntryIds(setEntryIds)
        : []
      const unitsFromIdsPromise = ids.length > 0
        ? dbRead.unit.batchFindAllByIds(ids)
        : []

      return Promise.all([unitsFromSetEntryIdsPromise, unitsFromIdsPromise])
        .then(([setEntriesFromDb, unitsByIdFromDb]) => {
          const unitsFromDb = [...setEntriesFromDb, ...unitsByIdFromDb]
          const results = _.map(unitsFromDb, (unit) => {
            const correspondingUnit = _.find(requestBody, requestObject =>
              requestObject.id === unit.id || requestObject.setEntryId === unit.set_entry_id)
            return {
              id: unit.id,
              deactivationReason: correspondingUnit.deactivationReason,
              setEntryId: unit.set_entry_id,
            }
          })
          return dbWrite.unit.batchUpdateDeactivationReasons(results, context, tx).then(() => {
            this.sendDeactivationNotifications(results)
            this.sendProd360KafkaNotifications(
              (unitsFromDb || []).map(unit => unit.treatment_block_id),
            )
            return results
          })
        })
    })

  @setErrorCode('17N000')
  sendProd360KafkaNotifications = async (treatmentBlockIds) => {
    const experiments =
      await dbWrite.unit.batchFindExperimentIdsByTreatmentBlockIds(treatmentBlockIds)
    const experimentIds = uniq(experiments.map(exp => exp.experiment_id))
    Promise.all(experimentIds.map(id => sendKafkaNotification('update', id)))
  }

  @setErrorCode('17K000')
  sendDeactivationNotifications = (deactivations) => {
    if (configurator.get('kafka.enableKafka')) {
      _.forEach(deactivations, (deactivation) => {
        try {
          const message = {
            experimentalUnitId: deactivation.id,
            deactivationReason: deactivation.deactivationReason,
            setEntryId: deactivation.setEntryId,
          }
          KafkaProducer.publish({
            topic: configurator.get('kafka.topics.unitDeactivation'),
            message,
            schemaId: configurator.get('kafka.schema.unitDeactivation'),
            schema: experimentalUnitDeactivationSchema,
          })
        } catch (err) {
          console.warn(`An error was caught when publishing a deactivation reason for unit id ${deactivation.id}`, err)
        }
      })
    }
  }

  @setErrorCode('17L000')
  validateDeactivations = requestBody =>
    QuestionsUtil.getAnswerKeys('ADEACTR', 'TEXT').then((deactivationKeys) => {
      const eachHasDeactivationReason = _.every(requestBody, requestObject => _.has(requestObject, 'deactivationReason'))
      if (!eachHasDeactivationReason) {
        throw AppError.badRequest('Please provide a deactivation reason for each experimental unit to be deactivated.', undefined, getFullErrorCode('17L001'))
      }

      const deactivationsFromRequest = _.uniq(_.compact(_.map(requestBody, 'deactivationReason')))
      const invalidDeactivationKeys = _.difference(deactivationsFromRequest, deactivationKeys)

      if (invalidDeactivationKeys.length > 0) {
        throw AppError.badRequest(`Invalid deactivation reasons provided: ${JSON.stringify(invalidDeactivationKeys)}`, undefined, getFullErrorCode('17L002'))
      }
    })

  @setErrorCode('17M000')
  @Transactional('partialUpdateSetEntryIdsTx')
  batchUpdateSetEntryIds = async (setEntryPairs, context, tx) => {
    await validateSetEntryIdPairs(setEntryPairs)

    const existingSetEntryIds = setEntryPairs.map(pair => pair.existingSetEntryId)
    const incomingSetEntryIds = setEntryPairs.map(pair => pair.incomingSetEntryId)

    const allSetEntryIds = [...existingSetEntryIds, ...incomingSetEntryIds]
    if (allSetEntryIds.length !== _.uniq(allSetEntryIds).length) {
      throw AppError.badRequest('All set entry IDs in request payload must be unique', undefined, getFullErrorCode('17M001'))
    }

    const foundSetEntryIds = await dbRead.unit.batchFindSetEntryIds(existingSetEntryIds)
    if (existingSetEntryIds.length !== foundSetEntryIds.length) {
      throw AppError.badRequest('One or more of the existing set entry IDs in request payload were not found', undefined, getFullErrorCode('17M002'))
    }

    return dbWrite.unit.batchUpdateSetEntryIds(setEntryPairs, context, tx)
  }

  @notifyChanges('update', 0)
  @setErrorCode('17O000')
  @Transactional('saveBlockLocationUnits')
  saveBlockLocationUnits = async (experimentId, blockLocations, context, isTemplate, tx) => {
    if (blockLocations.length > 20) {
      throw AppError.badRequest('No more than 20 blockLocations can be saved in one request.', undefined, getFullErrorCode('17O003'))
    }
    const units = blockLocations.flatMap(blockLocation => blockLocation.units.map(unit => {
      unit.location = blockLocation.location
      unit.blockId = blockLocation.blockId
      return unit
    }))
    if (units.length > 10000) {
      throw AppError.badRequest('No more than 10,000 experimental units can be saved in one request.', undefined, getFullErrorCode('17O004'))
    }
    await this.securityService.permissionsCheck(experimentId, context, isTemplate)
    const [existingBlockLocations, treatmentBlocks] = await Promise.all([
      dbRead.locationAssociation.findByExperimentId(experimentId),
      this.treatmentBlockService.getTreatmentBlocksByExperimentId(experimentId),
    ])

    const matchedBlockLocations = blockLocations.map(blockLocation => existingBlockLocations.find(
      ebl => blockLocation.blockId === ebl.block_id && blockLocation.location === ebl.location))

    units.forEach(unit => {
      const { id } = treatmentBlocks.find(tb =>
        tb.treatment_id === unit.treatmentId && tb.block_id === unit.blockId) || {}
      unit.treatmentBlockId = id
    })

    const unitsWithInvalidTreatmentBlock = units.filter(unit => !unit.treatmentBlockId)
    if (unitsWithInvalidTreatmentBlock.length > 0) {
      throw AppError.badRequest(`${unitsWithInvalidTreatmentBlock.length} experimental units have invalid treatment/block values.`, undefined, getFullErrorCode('17O001'))
    }

    const blockLocationsWithSetId = matchedBlockLocations.filter(bl => bl?.set_id)
    if (blockLocationsWithSetId.length > 0) {
      throw AppError.badRequest('Cannot modify experimental units that have been assigned to a set.', undefined, getFullErrorCode('17O002'))
    }

    const uniqueBlockLocations = blockLocations.map(blockLocation => ({
      location: blockLocation.location,
      blockId: blockLocation.blockId,
    }))
    const existingUnits = await dbRead.unit.findByBlockLocations(uniqueBlockLocations)

    const { adds, deletes } = this.compareWithExistingUnits(existingUnits, units)

    await this.saveToDb(adds, [], deletes, context, tx)
  }

  @setErrorCode('17P000')
  compareWithExistingUnits = (existingUnits, newUnits) => {
    const unitsToDeletesFromDB = _.compact(_.map(existingUnits, (eu) => {
      const matchingUnit = _.find(newUnits,
        nu => (eu.treatment_block_id || eu.treatmentBlockId) === nu.treatmentBlockId &&
          eu.rep === nu.rep && eu.location === nu.location && !nu.matched)
      if (matchingUnit) {
        matchingUnit.matched = true
        return undefined
      }
      return eu
    }))
    const adds = _.filter(newUnits, nu => !nu.matched)
    const deletes = unitsToDeletesFromDB.map(u => u.id)
    return {
      adds,
      deletes,
    }
  }

  @notifyChanges('update', 0)
  @setErrorCode('17Q000')
  @Transactional('deleteByBlockLocation')
  deleteByBlockLocation = async (experimentId, queryParams, context, isTemplate, tx) => {
    const {
      blockId,
      location,
    } = queryParams
    if (!location || !blockId) {
      throw AppError.badRequest('Both location and blockId fields are required.', undefined, getFullErrorCode('1FQ001'))
    }

    await this.securityService.permissionsCheck(experimentId, context, isTemplate)
    const [block, blockLocation] = await Promise.all([
      dbRead.block.findByBlockId(blockId),
      dbRead.locationAssociation.findByLocationAndBlockId(location, blockId),
    ])

    if (!block || block.experiment_id !== Number(experimentId)) {
      throw AppError.badRequest(`Block id '${blockId}' does not belong to experiment '${experimentId}'.`, undefined, getFullErrorCode('1FQ002'))
    }

    if (blockLocation?.set_id) {
      throw AppError.badRequest(`Block id '${blockId}' and location '${location}' is mapped to set '${blockLocation.set_id}'. These units cannot be deleted until the set has been deleted.`, undefined, getFullErrorCode('1FQ003'))
    }

    await dbWrite.unit.deleteByBlockLocation(blockId, location, tx)
  }
}

module.exports = ExperimentalUnitService
