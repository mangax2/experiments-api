import log4js from 'log4js'
import _ from 'lodash'
import db from '../db/DbManager'
import AppUtil from './utility/AppUtil'
import AppError from './utility/AppError'
import ExperimentsService from './ExperimentsService'
import UnitSpecificationDetailValidator from '../validations/UnitSpecificationDetailValidator'
import Transactional from '../decorators/transactional'

const logger = log4js.getLogger('UnitSpecificationDetailService')

class UnitSpecificationDetailService {

  constructor() {
    this.validator = new UnitSpecificationDetailValidator()
    this.experimentService = new ExperimentsService()
  }

  @Transactional('getUnitSpecificationDetailsByExperimentId')
  getUnitSpecificationDetailsByExperimentId(id, tx) {
    return this.experimentService.getExperimentById(id, tx)
      .then(() => db.unitSpecificationDetail.findAllByExperimentId(id, tx))
  }

  @Transactional('getUnitSpecificationDetailById')
  getUnitSpecificationDetailById = (id, tx) => db.unitSpecificationDetail.find(id, tx)
    .then((data) => {
      if (!data) {
        logger.error(`Unit Specification Detail Not Found for requested id = ${id}`)
        throw AppError.notFound('Unit Specification Detail Not Found for requested id')
      } else {
        return data
      }
    })

  @Transactional('getUnitSpecificationDetailsByIds')
  batchGetUnitSpecificationDetailsByIds = (ids, tx) => db.unitSpecificationDetail.batchFind(ids, tx)
    .then((data) => {
      if (_.filter(data, element => element !== null).length !== ids.length) {
        logger.error('Unit Specification Detail not found for all requested ids.')
        throw AppError.notFound('Unit Specification Detail not found for all requested ids.')
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
  manageAllUnitSpecificationDetails(unitSpecificationDetailsObj, context, tx) {
    return this.deleteUnitSpecificationDetails(unitSpecificationDetailsObj.deletes, tx)
      .then(() =>
        this.updateUnitSpecificationDetails(unitSpecificationDetailsObj.updates, context, tx)
          .then(() =>
            this.createUnitSpecificationDetails(unitSpecificationDetailsObj.adds, context, tx)
              .then(() => AppUtil.createCompositePostResponse())))
  }

  @Transactional('deleteUnitSpecificationDetails')
  deleteUnitSpecificationDetails = (idsToDelete, tx) => {
    if (_.compact(idsToDelete).length === 0) {
      return Promise.resolve()
    }
    return db.unitSpecificationDetail.batchRemove(idsToDelete, tx)
      .then((data) => {
        if (_.filter(data, element => element !== null).length !== idsToDelete.length) {
          logger.error('Not all unit specification detail ids requested for delete were found')
          throw AppError.notFound('Not all unit specification detail ids requested for delete were found')
        } else {
          return data
        }
      })
  }

  updateUnitSpecificationDetails(unitSpecificationDetails, tx) {
    if (_.compact(unitSpecificationDetails).length === 0) {
      return Promise.resolve()
    }
    return this.batchUpdateUnitSpecificationDetails(unitSpecificationDetails, tx)
  }

  createUnitSpecificationDetails(unitSpecificationDetails, tx) {
    if (_.compact(unitSpecificationDetails).length === 0) {
      return Promise.resolve()
    }
    return this.batchCreateUnitSpecificationDetails(unitSpecificationDetails, tx)
  }
}

module.exports = UnitSpecificationDetailService
