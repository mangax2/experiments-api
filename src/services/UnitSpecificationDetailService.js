import _ from 'lodash'
import Transactional from '@monsantoit/pg-transactional'
import { dbRead, dbWrite } from '../db/DbManager'
import AppUtil from './utility/AppUtil'
import AppError from './utility/AppError'
import ExperimentsService from './ExperimentsService'
import SecurityService from './SecurityService'
import UnitSpecificationService from './UnitSpecificationService'
import UnitSpecificationDetailValidator from '../validations/UnitSpecificationDetailValidator'
import { notifyChanges } from '../decorators/notifyChanges'

const { getFullErrorCode, setErrorCode } = require('@monsantoit/error-decorator')()

const backfillMapper = {
  ft: 1,
  in: 2,
  m: 3,
  cm: 4,
}

// Error Codes 1SXXXX
class UnitSpecificationDetailService {
  constructor() {
    this.validator = new UnitSpecificationDetailValidator()
    this.experimentService = new ExperimentsService()
    this.securityService = new SecurityService()
    this.unitSpecificationService = new UnitSpecificationService()
  }

  @setErrorCode('1S1000')
  getUnitSpecificationDetailsByExperimentId(id, isTemplate, context) {
    return this.experimentService.getExperimentById(id, isTemplate, context)
      .then(() => dbRead.unitSpecificationDetail.findAllByExperimentId(id))
  }

  @setErrorCode('1S3000')
  @Transactional('batchCreateUnitSpecificationDetails')
  batchCreateUnitSpecificationDetails(specificationDetails, context, tx) {
    this.backfillUnitSpecificationRecord(specificationDetails)
    return this.validator.validate(specificationDetails, 'POST')
      .then(() => dbWrite.unitSpecificationDetail.batchCreate(specificationDetails, context, tx)
        .then(data => AppUtil.createPostResponse(data)))
  }

  @setErrorCode('1S4000')
  @Transactional('batchUpdateUnitSpecificationDetails')
  batchUpdateUnitSpecificationDetails(unitSpecificationDetails, context, tx) {
    this.backfillUnitSpecificationRecord(unitSpecificationDetails)
    return this.validator.validate(unitSpecificationDetails, 'PUT')
      .then(() => dbWrite.unitSpecificationDetail.batchUpdate(unitSpecificationDetails, context, tx)
        .then(data => AppUtil.createPutResponse(data)))
  }

  @notifyChanges('update', 0)
  @setErrorCode('1S5000')
  @Transactional('manageAllUnitSpecificationDetails')
  manageAllUnitSpecificationDetails(experimentId, unitSpecificationDetailsObj, context,
    isTemplate, tx) {
    return this.securityService.permissionsCheck(experimentId, context, isTemplate).then(() => {
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

  // The below function should go away after v2 is retired, along with the backfillMapper and the
  // uom_id column in the database
  backfillUnitSpecificationRecord = (specificationDetails) => {
    _.forEach(specificationDetails, (spec) => {
      spec.uomId = backfillMapper[spec.uomCode]
    })
  }

  @setErrorCode('1S6000')
  @Transactional('deleteUnitSpecificationDetails')
  deleteUnitSpecificationDetails = (idsToDelete, context, tx) => {
    if (_.compact(idsToDelete).length === 0) {
      return Promise.resolve()
    }
    return dbWrite.unitSpecificationDetail.batchRemove(idsToDelete, tx)
      .then((data) => {
        if (_.compact(data).length !== idsToDelete.length) {
          console.error(`[[${context.requestId}]] Not all unit specification detail ids requested for delete were found`)
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
    this.getUnitSpecificationDetailsByExperimentId(experimentId, false, context)
      .then(unitSpecificationDetails => this.unitSpecificationService.getAllUnitSpecifications()
        .then((refUnitSpecs) => {
          const unitSpecUpsertValues = []
          if (capacitySyncUnitSpecDetails['number of rows']) {
            const refRowsPerPlotId = _.find(refUnitSpecs, uS => uS.name === 'Number of Rows').id
            unitSpecUpsertValues.push({
              refUnitSpecId: refRowsPerPlotId,
              value: capacitySyncUnitSpecDetails['number of rows'],
              experimentId,
            })
          }
          if (capacitySyncUnitSpecDetails['row length']) {
            const refPlotRowLengthId = _.find(refUnitSpecs, uS => uS.name === 'Row Length').id
            unitSpecUpsertValues.push({
              refUnitSpecId: refPlotRowLengthId,
              value: capacitySyncUnitSpecDetails['row length'],
              uomCode: capacitySyncUnitSpecDetails['plot row length uom'],
              experimentId,
            })
          }

          if (capacitySyncUnitSpecDetails['row spacing']) {
            const refRowSpacingId = _.find(refUnitSpecs, uS => uS.name === 'Row Spacing').id
            unitSpecUpsertValues.push({
              refUnitSpecId: refRowSpacingId,
              value: capacitySyncUnitSpecDetails['row spacing'],
              uomCode: capacitySyncUnitSpecDetails['row spacing uom'],
              experimentId,

            })
          }

          if (unitSpecUpsertValues.length > 0) {
            return dbWrite.unitSpecificationDetail.batchRemove(_.map(unitSpecificationDetails, 'id'), tx)
              .then(() =>
                dbWrite.unitSpecificationDetail.batchCreate(unitSpecUpsertValues, context, tx))
          }
          return Promise.resolve()
        }))
}

module.exports = UnitSpecificationDetailService
