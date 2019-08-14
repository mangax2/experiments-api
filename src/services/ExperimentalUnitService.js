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
import LocationAssociationWithBlockService from './LocationAssociationWithBlockService'

const { getFullErrorCode, setErrorCode } = require('@monsantoit/error-decorator')()

const logger = log4js.getLogger('ExperimentalUnitService')

// Error Codes 17XXXX
class ExperimentalUnitService {
  constructor() {
    this.validator = new ExperimentalUnitValidator()
    this.treatmentService = new TreatmentService()
    this.experimentService = new ExperimentsService()
    this.locationAssocWithBlockService = new LocationAssociationWithBlockService()
  }

  @setErrorCode('171000')
  @Transactional('createExperimentalUnitsTx')
  batchCreateExperimentalUnits(experimentalUnits, context, tx) {
    //TODO this validation no longer makes sense and shouldn't work here, is this method still being used?
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

  @setErrorCode('17F000')
  @Transactional('updateUnitsForSet')
  updateUnitsForSet = (setId, experimentalUnits, context, tx) =>
    this.locationAssocWithBlockService.getBySetId(setId, tx).then((setInfo) => {
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
        return db.treatmentBlock.batchFindByBlockIds(setInfo.block_id, tx)
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
    db.unit.batchFindAllByLocationAndTreatmentBlocks(location, _.map(treatmentBlocks, 'id'), tx)
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
