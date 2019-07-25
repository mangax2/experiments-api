import log4js from 'log4js'
import _ from 'lodash'
import inflector from 'json-inflector'
import Transactional from '@monsantoit/pg-transactional'
import db from '../db/DbManager'
import AppUtil from './utility/AppUtil'
import AppError from './utility/AppError'
import ExperimentalUnitValidator from '../validations/ExperimentalUnitValidator'
import TreatmentService from './TreatmentService'
import ExperimentsService from './ExperimentsService'
import { notifyChanges } from '../decorators/notifyChanges'
import SetEntryRemovalService from './prometheus/SetEntryRemovalService'
import TreatmentBlockService from './TreatmentBlockService'

const { getFullErrorCode, setErrorCode } = require('@monsantoit/error-decorator')()

const logger = log4js.getLogger('ExperimentalUnitService')

// Error Codes 17XXXX
class ExperimentalUnitService {
  constructor() {
    this.validator = new ExperimentalUnitValidator()
    this.treatmentService = new TreatmentService()
    this.experimentService = new ExperimentsService()
    this.treatmentBlockService = new TreatmentBlockService()
  }

  @setErrorCode('171000')
  @Transactional('createExperimentalUnitsTx')
  batchCreateExperimentalUnits(experimentalUnits, context, tx) {
    return this.validator.validate(experimentalUnits, 'POST', tx)
      .then(() => db.unit.batchCreate(experimentalUnits, context, tx)
        .then(data => AppUtil.createPostResponse(data)))
  }

  @setErrorCode('172000')
  @Transactional('partialUpdateExperimentalUnitsTx')
  batchPartialUpdateExperimentalUnits(experimentalUnits, context, tx) {
    return this.validator.validate(experimentalUnits, 'PATCH', tx)
      .then(() => {
        ExperimentalUnitService.uniqueIdsCheck(experimentalUnits, 'id')
        ExperimentalUnitService.uniqueIdsCheck(experimentalUnits, 'setEntryId')

        return db.unit.batchPartialUpdate(experimentalUnits, context, tx)
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

  @setErrorCode('177000')
  @Transactional('getUnitsFromTemplateByExperimentId')
  getUnitsFromTemplateByExperimentId(id, context, tx) {
    return this.experimentService.getExperimentById(id, true, context, tx)
      .then(() => this.getExperimentalUnitsByExperimentId(id, tx))
  }

  @setErrorCode('17L000')
  @Transactional('getUnitsFromExperimentByExperimentId')
  getUnitsFromExperimentByExperimentId(id, context, tx) {
    return this.experimentService.getExperimentById(id, false, context, tx)
      .then(() => this.getExperimentalUnitsByExperimentId(id, tx))
  }

  @setErrorCode('17K000')
  @Transactional('getExperimentalUnitsByExperimentId')
  getExperimentalUnitsByExperimentId(id, tx) {
    return Promise.all([db.unit.findAllByExperimentId(id, tx),
      this.treatmentBlockService.getTreatmentBlocksByExperimentId(id, tx)])
      .then(([units, treatmentBlocks]) => this.addBlockInfoToUnit(units, treatmentBlocks))
  }

  @setErrorCode('17M000')
  @Transactional('getExperimentalUnitsBySetId')
  getExperimentalUnitsBySetId(id, tx) {
    return Promise.all([db.unit.batchFindAllBySetIds(id, tx),
      this.treatmentBlockService.getTreatmentBlocksBySetId(id, tx)])
      .then(([units, treatmentBlocks]) => this.addBlockInfoToUnit(units, treatmentBlocks))
  }

  @setErrorCode('17N000')
  addBlockInfoToUnit = (units, treatmentBlocks) => _.map(units, (unit) => {
    const block = _.find(treatmentBlocks, tb => tb.id === unit.treatment_block_id)
    unit.block = _.isNil(block) ? '' : block.name
    return unit
  })

  @setErrorCode('178000')
  @Transactional('getExperimentalUnitsByExperimentIdNoValidate')
  getExperimentalUnitsByExperimentIdNoValidate = (id, tx) =>
    db.unit.findAllByExperimentId(id, tx)

  @setErrorCode('179000')
  getExperimentalUnitInfoBySetId = (setId) => {
    if (setId) {
      return db.unit.batchFindAllBySetId(setId).then((units) => {
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
      return db.unit.batchFindAllBySetEntryIds(setEntryIds)
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
  @Transactional('getTreatmentDetailsBySetId')
  getTreatmentDetailsBySetId = (setId, tx) => {
    if (setId) {
      return db.unit.batchFindAllBySetId(setId, tx).then((units) => {
        const treatmentIds = _.uniq(_.map(units, 'treatment_id'))

        if (treatmentIds && treatmentIds.length > 0) {
          return db.treatment.batchFindAllTreatmentLevelDetails(treatmentIds, tx)
            .then(this.mapTreatmentLevelsToOutputFormat)
        }

        throw AppError.notFound(`No treatments found for set id: ${setId}.`, undefined, getFullErrorCode('17C001'))
      })
    }

    throw AppError.badRequest('A setId is required', undefined, getFullErrorCode('17C002'))
  }

  @setErrorCode('17D000')
  mapTreatmentLevelsToOutputFormat = (response) => {
    const groupedValues = _.groupBy(response, 'treatment_id')

    return _.map(groupedValues, (treatmentDetails, treatmentId) => (
      {
        treatmentId: Number(treatmentId),
        factorLevels: _.map(treatmentDetails, detail => ({
          items: detail.value.items,
          factorName: detail.name,
        })),
      }))
  }

  @setErrorCode('17E000')
  @Transactional('batchUpdateExperimentalUnits')
  batchUpdateExperimentalUnits(experimentalUnits, context, tx) {
    return this.validator.validate(experimentalUnits, 'PUT', tx)
      .then(() => db.unit.batchUpdate(experimentalUnits, context, tx)
        .then(data => AppUtil.createPutResponse(data)))
  }

  @setErrorCode('17F000')
  @Transactional('updateUnitsForSet')
  updateUnitsForSet = (setId, experimentalUnits, context, tx) =>
    db.locationAssociation.findBySetId(setId, tx).then((setInfo) => {
      if (!setInfo) {
        throw AppError.notFound(`No experiment found for Set Id ${setId}`, undefined, getFullErrorCode('17F001'))
      }
      return tx.batch([
        db.combinationElement.findAllByExperimentIdIncludingControls(setInfo.experiment_id, tx),
        db.experiments.find(setInfo.experiment_id, false, tx),
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
          logger.error(`[[${context.requestId}]] Attempted to save the following invalid factor level combinations to Set Id ${setId}: ${stringifiedCombinations}`)
          throw AppError.badRequest(`One or more entries had an invalid combination of factor level ids. The invalid combinations are: ${stringifiedCombinations}`, undefined, getFullErrorCode('17F002'))
        }
        _.forEach(units, (unit) => {
          delete unit.factorLevelKey
        })
        const treatmentIdsUsed = _.uniq(_.map(units, 'treatmentId'))
        return db.treatment.batchFind(treatmentIdsUsed, tx).then((treatments) => {
          const treatmentWithMismatchedBlock = _.find(treatments,
            treatment => treatment.block !== setInfo.block && !treatment.in_all_blocks)
          if (treatmentWithMismatchedBlock) {
            throw AppError.badRequest('One or more entries used a treatment from a block that does not match the set\'s block.', undefined, getFullErrorCode('17F003'))
          }
          return this.mergeSetEntriesToUnits(setInfo.experiment_id, units, setInfo.location,
            setInfo.block, context, tx)
        })
      })
    })

  @notifyChanges('update', 0)
  @setErrorCode('17G000')
  @Transactional('mergeSetEntriesToUnits')
  mergeSetEntriesToUnits = (experimentId, unitsToSave, location, block, context, tx) =>
    db.unit.batchFindAllByExperimentIdLocationAndBlock(experimentId, location, block, tx)
      .then((unitsFromDB) => {
        const {
          unitsToBeCreated, unitsToBeDeleted, unitsToBeUpdated,
        } = this.getDbActions(unitsToSave, unitsFromDB, location, block)

        this.detectWarnableUnitUpdateConditions(unitsToBeCreated, unitsToBeUpdated, unitsFromDB,
          context, experimentId, location, block)

        return this.saveToDb(unitsToBeCreated, unitsToBeUpdated, unitsToBeDeleted, context, tx)
      })

  detectWarnableUnitUpdateConditions =
    (unitsToBeCreated, unitsToBeUpdated, databaseUnits, context, experimentId, location, block) => {
      const unitsHavingSetEntryIdsRemoved = _.filter(_.map(
        _.filter(unitsToBeUpdated, x => !x.setEntryId),
        unit => ({
          id: unit.id,
          setEntryId: _.find(databaseUnits, dbUnit => dbUnit.id === unit.id).setEntryId,
        })), z => !!z.setEntryId)

      if (unitsHavingSetEntryIdsRemoved.length > 0) {
        logger.warn(`[[${context.requestId}]] Set Entry IDs are being overwritten by this change! ExperimentId: ${experimentId}, Location: ${location}, Block: ${block}, Overwritten data: ${JSON.stringify(unitsHavingSetEntryIdsRemoved)}`)
        SetEntryRemovalService.addWarning()
      }

      if (context.isRepPacking) {
        const numberOfUnitsCreatingWithoutSetEntryId =
          _.filter(unitsToBeCreated, unit => !unit.setEntryId).length
        if (numberOfUnitsCreatingWithoutSetEntryId > 0) {
          logger.warn(`Rep packing is creating ${numberOfUnitsCreatingWithoutSetEntryId} unit(s) without set entries! ExperimentId: ${experimentId}, Location: ${location}, Block: ${block}`)
          SetEntryRemovalService.addWarning()
        }
      }
    }

  @setErrorCode('17H000')
  getDbActions = (unitsFromMessage, unitsFromDB, location, block) => {
    const unitsFromDbCamelizeLower = inflector.transform(unitsFromDB, 'camelizeLower')
    _.forEach(unitsFromMessage, (unitM) => {
      unitM.location = location
      unitM.block = block
    })
    const unitsFromDbSlim = _.map(unitsFromDbCamelizeLower, unit => _.pick(unit, 'rep', 'treatmentId', 'setEntryId', 'location', 'block'))
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
  saveToDb = (unitsToBeCreated, unitsToBeUpdated, unitsToBeDeleted, context, tx) => {
    const promises = []
    if (unitsToBeCreated.length > 0) {
      promises.push(db.unit.batchCreate(unitsToBeCreated, context, tx))
    }
    if (unitsToBeUpdated.length > 0) {
      promises.push(db.unit.batchUpdate(unitsToBeUpdated, context, tx))
    }
    return tx.batch(promises)
      .then(() => {
        if (unitsToBeDeleted.length > 0) {
          return db.unit.batchRemove(unitsToBeDeleted, tx)
        }
        return Promise.resolve()
      })
  }

  @setErrorCode('17J000')
  @Transactional('deactivateExperimentalUnitsTx')
  deactivateExperimentalUnits = (requestBody, context, tx) => {
    const eachHasDeactivationReason = _.every(requestBody, requestObject => _.has(requestObject, 'deactivationReason'))
    if (!eachHasDeactivationReason) {
      throw AppError.badRequest('Please provide a deactivation reason for each experimental unit to be deactivated.')
    }
    const [setEntryIdSubset, idSubset] = _.partition(requestBody, 'setEntryId')
    const setEntryIds = _.map(setEntryIdSubset, value => value.setEntryId)

    const unitsFromSetEntryIds = setEntryIds.length > 0
      ? db.unit.batchFindAllBySetEntryIds(setEntryIds)
      : []

    return Promise.resolve(unitsFromSetEntryIds)
      .then((setEntriesFromDb) => {
        const bySetEntryIdWithNewReason = _.map(setEntriesFromDb, (unit) => {
          const correspondingUnit = _.find(requestBody,
            requestObject => requestObject.setEntryId === unit.set_entry_id)
          return { id: unit.id, deactivationReason: correspondingUnit.deactivationReason }
        })

        const byIdWithNewReason = _.map(idSubset, unit => (
          { id: unit.id, deactivationReason: unit.deactivationReason }),
        )
        const results = [...bySetEntryIdWithNewReason, ...byIdWithNewReason]
        db.unit.batchUpdateDeactivationReasons(results, context, tx)
        return results
      })
  }
}

module.exports = ExperimentalUnitService
