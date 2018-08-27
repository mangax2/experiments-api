import log4js from 'log4js'
import _ from 'lodash'
import db from '../db/DbManager'
import AppUtil from './utility/AppUtil'
import AppError from './utility/AppError'
import ExperimentsService from './ExperimentsService'
import SecurityService from './SecurityService'
import UnitSpecificationService from './UnitSpecificationService'
import UnitSpecificationDetailValidator from '../validations/UnitSpecificationDetailValidator'
import { notifyChanges } from '../decorators/notifyChanges'
import Transactional from '../decorators/transactional'
import setErrorDecorator from '../decorators/setErrorDecorator'

const { getFullErrorCode, setErrorCode } = setErrorDecorator()

const logger = log4js.getLogger('UnitSpecificationDetailService')

// Error Codes 1SXXXX
class UnitSpecificationDetailService {
  constructor() {
    this.validator = new UnitSpecificationDetailValidator()
    this.experimentService = new ExperimentsService()
    this.securityService = new SecurityService()
    this.unitSpecificationService = new UnitSpecificationService()
  }

  @setErrorCode('1S1000')
  @Transactional('getUnitSpecificationDetailsByExperimentId')
  getUnitSpecificationDetailsByExperimentId(id, isTemplate, context, tx) {
    return this.experimentService.getExperimentById(id, isTemplate, context, tx)
      .then(() => db.unitSpecificationDetail.findAllByExperimentId(id, tx))
  }

  @setErrorCode('1S2000')
  @Transactional('getUnitSpecificationDetailById')
  getUnitSpecificationDetailById = (id, context, tx) => db.unitSpecificationDetail.find(id, tx)
    .then((data) => {
      if (!data) {
        logger.error(`[[${context.requestId}]] Unit Specification Detail Not Found for requested id = ${id}`)
        throw AppError.notFound('Unit Specification Detail Not Found for requested id', undefined, getFullErrorCode('1S2001'))
      } else {
        return data
      }
    })

  @setErrorCode('1S3000')
  @Transactional('batchCreateUnitSpecificationDetails')
  batchCreateUnitSpecificationDetails(specificationDetails, context, tx) {
    return this.validator.validate(specificationDetails, 'POST', tx)
      .then(() => db.unitSpecificationDetail.batchCreate(specificationDetails, context, tx)
        .then(data => AppUtil.createPostResponse(data)))
  }

  @setErrorCode('1S4000')
  @Transactional('batchUpdateUnitSpecificationDetails')
  batchUpdateUnitSpecificationDetails(unitSpecificationDetails, context, tx) {
    return this.validator.validate(unitSpecificationDetails, 'PUT', tx)
      .then(() => db.unitSpecificationDetail.batchUpdate(unitSpecificationDetails, context, tx)
        .then(data => AppUtil.createPutResponse(data)))
  }

  @notifyChanges('update', 0)
  @setErrorCode('1S5000')
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

  @setErrorCode('1S6000')
  @Transactional('deleteUnitSpecificationDetails')
  deleteUnitSpecificationDetails = (idsToDelete, context, tx) => {
    if (_.compact(idsToDelete).length === 0) {
      return Promise.resolve()
    }
    return db.unitSpecificationDetail.batchRemove(idsToDelete, tx)
      .then((data) => {
        if (_.compact(data).length !== idsToDelete.length) {
          logger.error(`[[${context.requestId}]] Not all unit specification detail ids requested for delete were found`)
          throw AppError.notFound(
            'Not all unit specification detail ids requested for delete were found', undefined, getFullErrorCode('1S6001'))
        } else {
          return data
        }
      })
  }

  @setErrorCode('1S7000')
  static populateExperimentId(unitSpecificationDetailsObj, experimentId) {
    _.forEach(unitSpecificationDetailsObj, (u) => {
      u.experimentId = Number(experimentId)
    })
  }

  @setErrorCode('1S8000')
  updateUnitSpecificationDetails(unitSpecificationDetails, context, tx) {
    if (_.compact(unitSpecificationDetails).length === 0) {
      return Promise.resolve()
    }
    return this.batchUpdateUnitSpecificationDetails(unitSpecificationDetails, context, tx)
  }

  @setErrorCode('1S9000')
  createUnitSpecificationDetails(unitSpecificationDetails, context, tx) {
    if (_.compact(unitSpecificationDetails).length === 0) {
      return Promise.resolve()
    }
    return this.batchCreateUnitSpecificationDetails(unitSpecificationDetails, context, tx)
  }

@setErrorCode('1SA000')
@Transactional('syncUnitSpecificationDetails')
 syncUnitSpecificationDetails=(capacitySyncUnitSpecDetails, experimentId, context, tx) =>
   this.getUnitSpecificationDetailsByExperimentId(experimentId, false, context, tx)
     .then(() => {
       this.unitSpecificationService.getAllUnitSpecifications()
         .then((refUnitSpecs) => {
           const unitSpecUpsertValues = []
           if (capacitySyncUnitSpecDetails['number of rows']) {
             const refRowsPerPlotId = _.find(refUnitSpecs, uS => uS.name === 'Number of Rows').id

             unitSpecUpsertValues.push({
               refUnitSpecId: refRowsPerPlotId,
               value: capacitySyncUnitSpecDetails['number of rows'],
             })
           }
           if (capacitySyncUnitSpecDetails['row length']) {
             const refPlotRowLength = _.find(refUnitSpecs, uS => uS.name === 'Row Length')
             const refPlotRowLengthId = refPlotRowLength.id
             unitSpecUpsertValues.push({
               refUnitSpecId: refPlotRowLengthId,
               value: capacitySyncUnitSpecDetails['row length'],
               uomId: capacitySyncUnitSpecDetails['plot row length uom'],
             })
           }

           if (capacitySyncUnitSpecDetails['row spacing']) {
             const refRowSpacing = _.find(refUnitSpecs, uS => uS.name === 'Row Spacing')
             const refRowSpacingId = refRowSpacing.id
             unitSpecUpsertValues.push({
               refUnitSpecId: refRowSpacingId,
               value: capacitySyncUnitSpecDetails['row spacing'],
               uomId: capacitySyncUnitSpecDetails['row spacing uom'],

             })
           }

           if (unitSpecUpsertValues.length > 0) {
             return db.unitSpecificationDetail.syncUnitSpecificationDetails(
               experimentId, unitSpecUpsertValues, context, tx,
             )
           }
           return Promise.resolve()
         })
     })
}

module.exports = UnitSpecificationDetailService
