import log4js from 'log4js'
import _ from 'lodash'
import db from '../db/DbManager'
import AppUtil from './utility/AppUtil'
import AppError from './utility/AppError'
import ExperimentsService from './ExperimentsService'
import SecurityService from './SecurityService'
import UnitSpecificationDetailValidator from '../validations/UnitSpecificationDetailValidator'
import Transactional from '../decorators/transactional'

const logger = log4js.getLogger('UnitSpecificationDetailService')

class UnitSpecificationDetailService {
  constructor() {
    this.validator = new UnitSpecificationDetailValidator()
    this.experimentService = new ExperimentsService()
    this.securityService = new SecurityService()
  }

  @Transactional('getUnitSpecificationDetailsByExperimentId')
  getUnitSpecificationDetailsByExperimentId(id, isTemplate, context, tx) {
    return this.experimentService.getExperimentById(id, isTemplate, context, tx)
      .then(() => db.unitSpecificationDetail.findAllByExperimentId(id, tx))
  }

  @Transactional('getUnitSpecificationDetailById')
  getUnitSpecificationDetailById = (id, context, tx) => db.unitSpecificationDetail.find(id, tx)
    .then((data) => {
      if (!data) {
        logger.error(`[[${context.transactionId}]] Unit Specification Detail Not Found for requested id = ${id}`)
        throw AppError.notFound('Unit Specification Detail Not Found for requested id')
      } else {
        return data
      }
    })

  @Transactional('batchCreateUnitSpecificationDetails')
  batchCreateUnitSpecificationDetails(specificationDetails, context, tx) {
    return this.validator.validate(specificationDetails, 'POST', tx)
      .then(() => db.unitSpecificationDetail.batchCreate(specificationDetails, context, tx)
        .then(data => AppUtil.createPostResponse(data)))
  }

  @Transactional('batchUpdateUnitSpecificationDetails')
  batchUpdateUnitSpecificationDetails(unitSpecificationDetails, context, tx) {
    return this.validator.validate(unitSpecificationDetails, 'PUT', tx)
      .then(() => db.unitSpecificationDetail.batchUpdate(unitSpecificationDetails, context, tx)
        .then(data => AppUtil.createPutResponse(data)))
  }

  @Transactional('manageAllUnitSpecificationDetails')
  manageAllUnitSpecificationDetails(experimentId, unitSpecificationDetailsObj, context,
    isTemplate, tx) {
    return this.securityService.permissionsCheck(experimentId, context, isTemplate, tx).then(() => {
      UnitSpecificationDetailService.populateExperimentId(unitSpecificationDetailsObj
        .updates, experimentId)
      UnitSpecificationDetailService.populateExperimentId(unitSpecificationDetailsObj
        .adds, experimentId)
      return this.deleteUnitSpecificationDetails(unitSpecificationDetailsObj.deletes, context, tx)
        .then(() =>
          this.updateUnitSpecificationDetails(unitSpecificationDetailsObj.updates, context, tx)
            .then(() =>
              this.createUnitSpecificationDetails(unitSpecificationDetailsObj.adds, context, tx)
                .then(() => AppUtil.createCompositePostResponse())))
    })
  }

  @Transactional('deleteUnitSpecificationDetails')
  deleteUnitSpecificationDetails = (idsToDelete, context, tx) => {
    if (_.compact(idsToDelete).length === 0) {
      return Promise.resolve()
    }
    return db.unitSpecificationDetail.batchRemove(idsToDelete, tx)
      .then((data) => {
        if (_.compact(data).length !== idsToDelete.length) {
          logger.error(`[[${context.transactionId}]] Not all unit specification detail ids requested for delete were found`)
          throw AppError.notFound(
            'Not all unit specification detail ids requested for delete were found')
        } else {
          return data
        }
      })
  }

  static populateExperimentId(unitSpecificationDetailsObj, experimentId) {
    _.forEach(unitSpecificationDetailsObj, (u) => {
      u.experimentId = Number(experimentId)
    })
  }

  updateUnitSpecificationDetails(unitSpecificationDetails, context, tx) {
    if (_.compact(unitSpecificationDetails).length === 0) {
      return Promise.resolve()
    }
    return this.batchUpdateUnitSpecificationDetails(unitSpecificationDetails, context, tx)
  }

  createUnitSpecificationDetails(unitSpecificationDetails, context, tx) {
    if (_.compact(unitSpecificationDetails).length === 0) {
      return Promise.resolve()
    }
    return this.batchCreateUnitSpecificationDetails(unitSpecificationDetails, context, tx)
  }
}

module.exports = UnitSpecificationDetailService
