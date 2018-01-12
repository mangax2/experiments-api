import log4js from 'log4js'
import _ from 'lodash'
import db from '../db/DbManager'
import AppUtil from './utility/AppUtil'
import AppError from './utility/AppError'
import ExperimentalUnitValidator from '../validations/ExperimentalUnitValidator'
import TreatmentService from './TreatmentService'
import ExperimentsService from './ExperimentsService'
import GroupService from './GroupService'
import Transactional from '../decorators/transactional'
import setErrorDecorator from '../decorators/setErrorDecorator'

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

        throw AppError.badRequest(`No treatments found for set id: ${setId}.`, undefined, getFullErrorCode('17C001'))
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
  @Transactional('batchDeleteExperimentalUnits')
  batchDeleteExperimentalUnits = (ids, context, tx) => db.unit.batchRemove(ids, tx)
    .then((data) => {
      if (_.filter(data, element => element !== null).length !== ids.length) {
        logger.error(`[[${context.requestId}]] Not all experimental units requested for delete were found`)
        throw AppError.notFound('Not all experimental units requested for delete were found', undefined, getFullErrorCode('17F001'))
      } else {
        return data
      }
    })
}

module.exports = ExperimentalUnitService
