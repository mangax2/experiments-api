import log4js from 'log4js'
import _ from 'lodash'
import inflector from 'json-inflector'
import db from '../db/DbManager'
import AppUtil from './utility/AppUtil'
import PingUtil from './utility/PingUtil'
import HttpUtil from './utility/HttpUtil'
import AppError from './utility/AppError'
import cfServices from './utility/ServiceConfig'
import ExperimentalUnitValidator from '../validations/ExperimentalUnitValidator'
import TreatmentService from './TreatmentService'
import ExperimentsService from './ExperimentsService'
import GroupService from './GroupService'
import Transactional from '../decorators/transactional'
import setErrorDecorator from '../decorators/setErrorDecorator'
import { notifyChanges } from '../decorators/notifyChanges'

const { getFullErrorCode, setErrorCode } = setErrorDecorator()

const logger = log4js.getLogger('ExperimentalUnitService')

// Error Codes 17XXXX
class ExperimentalUnitService {
  constructor() {
    this.validator = new ExperimentalUnitValidator()
    this.treatmentService = new TreatmentService()
    this.experimentService = new ExperimentsService()
    this.groupService = new GroupService()
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

  @setErrorCode('174000')
  @Transactional('getExperimentalUnitsByTreatmentId')
  getExperimentalUnitsByTreatmentId(id, context, tx) {
    return this.treatmentService.getTreatmentById(id, context, tx)
      .then(() => db.unit.findAllByTreatmentId(id, tx))
  }

  @setErrorCode('175000')
  @Transactional('batchGetExperimentalUnitByGroupIdsNoValidate')
  batchGetExperimentalUnitsByGroupIdsNoValidate = (ids, tx) =>
    db.unit.batchFindAllByGroupIds(ids, tx)

  @setErrorCode('176000')
  @Transactional('getExperimentalUnitById')
  getExperimentalUnitById = (id, context, tx) => db.unit.find(id, tx)
    .then((data) => {
      if (!data) {
        logger.error(`[[${context.requestId}]] Experimental Unit Not Found for requested id = ${id}`)
        throw AppError.notFound('Experimental Unit Not Found for requested id', undefined, getFullErrorCode('176001'))
      } else {
        return data
      }
    })

  @setErrorCode('177000')
  @Transactional('getExperimentalUnitsByExperimentId')
  getExperimentalUnitsByExperimentId(id, isTemplate, context, tx) {
    return this.experimentService.getExperimentById(id, isTemplate, context, tx)
      .then(() => db.unit.findAllByExperimentId(id, tx))
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
      const randomizationPromise = PingUtil.getMonsantoHeader().then(header =>
        HttpUtil.getWithRetry(`${cfServices.experimentsExternalAPIUrls.value.randomizationAPIUrl}/strategies`, header))
        .then(data => data.body)
        .catch((err) => {
          logger.error(`[[${context.requestId}]] An error occurred while communicating with the randomization service`, err)
          throw AppError.internalServerError('An error occurred while communicating with the randomization service.', undefined, getFullErrorCode('17F003'))
        })
      return Promise.all([
        db.combinationElement.findAllByExperimentIdIncludingControls(setInfo.experiment_id, tx),
        db.designSpecificationDetail.getRandomizationStrategyIdByExperimentId(setInfo.experiment_id,
          tx),
        randomizationPromise,
      ]).then(([combinationElements, selectedRandomizationStrategy, randomizationStrategies]) => {
        const customStrategy = _.find(randomizationStrategies, rs => rs.name === 'Custom')
        if (!customStrategy || !selectedRandomizationStrategy ||
          selectedRandomizationStrategy.value !== customStrategy.id.toString()) {
          throw AppError.badRequest('This endpoint only supports sets/experiments with a "Custom" randomization strategy.', undefined, getFullErrorCode('17F004'))
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
          const factorLevelKey = unit.factorLevelIds.sort().join(',')
          newUnit.treatmentId = factorLevelIdsToTreatmentIdMapper[factorLevelKey]
          return newUnit
        })
        if (_.find(units, unit => !unit.treatmentId)) {
          throw AppError.badRequest('One or more entries had an invalid set of factor level ids.', undefined, getFullErrorCode('17F002'))
        }
        return this.mergeSetEntriesToUnits(setInfo.experiment_id, units, setInfo.location,
          context, tx)
      })
    })

  @notifyChanges('update', 0)
  @setErrorCode('17G000')
  @Transactional('mergeSetEntriesToUnits')
  mergeSetEntriesToUnits = (experimentId, unitsToSave, location, context, tx) =>
    db.unit.batchFindAllByExperimentIdAndLocation(experimentId, location, tx)
      .then((unitsFromDB) => {
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
    const unitsFromDbSlim = _.map(unitsFromDbCamelizeLower, unit => _.pick(unit, 'rep', 'treatmentId', 'setEntryId', 'location'))
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
    return Promise.all(promises)
      .then(() => {
        if (unitsToBeDeleted.length > 0) {
          return db.unit.batchRemove(unitsToBeDeleted, tx)
        }
        return Promise.resolve()
      })
  }
}

module.exports = ExperimentalUnitService
