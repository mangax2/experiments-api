import log4js from 'log4js'
import _ from 'lodash'
import Transactional from '@monsantoit/pg-transactional'
import db from '../db/DbManager'
import cfServices from './utility/ServiceConfig'
import AppUtil from './utility/AppUtil'
import AppError from './utility/AppError'
import ExperimentsService from './ExperimentsService'
import SecurityService from './SecurityService'
import DesignSpecificationDetailValidator from '../validations/DesignSpecificationDetailValidator'
import RefDesignSpecificationService from './RefDesignSpecificationService'
import FactorService from './FactorService'
import PingUtil from './utility/PingUtil'
import HttpUtil from './utility/HttpUtil'
import { notifyChanges } from '../decorators/notifyChanges'

const { getFullErrorCode, setErrorCode } = require('@monsantoit/error-decorator')()

const logger = log4js.getLogger('DesignSpecificationDetailService')

// Error Codes 13XXXX
class DesignSpecificationDetailService {
  constructor() {
    this.validator = new DesignSpecificationDetailValidator()
    this.experimentService = new ExperimentsService()
    this.refDesignSpecificationService = new RefDesignSpecificationService()
    this.securityService = new SecurityService()
    this.factorService = new FactorService()
  }

  @setErrorCode('131000')
  @Transactional('getDesignSpecificationDetailsByExperimentId')
  getDesignSpecificationDetailsByExperimentId(id, isTemplate, context, tx) {
    return this.experimentService.getExperimentById(id, isTemplate, context, tx)
      .then(() => db.designSpecificationDetail.findAllByExperimentId(id, tx))
  }

  @setErrorCode('133000')
  @Transactional('batchCreateDesignSpecificationDetails')
  batchCreateDesignSpecificationDetails(specificationDetails, context, tx) {
    return this.validator.validate(specificationDetails, 'POST', tx)
      .then(() => db.designSpecificationDetail.batchCreate(specificationDetails, context, tx)
        .then(data => AppUtil.createPostResponse(data)))
  }

  @setErrorCode('134000')
  @Transactional('batchUpdateDesignSpecificationDetails')
  batchUpdateDesignSpecificationDetails(designSpecificationDetails, context, tx) {
    return this.validator.validate(designSpecificationDetails, 'PUT', tx)
      .then(() => db.designSpecificationDetail.batchUpdate(designSpecificationDetails, context, tx)
        .then(data => AppUtil.createPutResponse(data)))
  }

  @setErrorCode('135000')
  populateExperimentId = (designSpecs, experimentId) => {
    _.forEach(designSpecs, (ds) => {
      ds.experimentId = Number(experimentId)
    })
  }

  @notifyChanges('update', 1)
  @setErrorCode('136000')
  @Transactional('manageAllDesignSpecificationDetails')
  manageAllDesignSpecificationDetails(designSpecificationDetailsObj, experimentId, context,
    isTemplate, tx) {
    return this.securityService.permissionsCheck(experimentId, context, isTemplate, tx).then(() => {
      if (designSpecificationDetailsObj) {
        const { adds, updates, deletes } = designSpecificationDetailsObj
        this.populateExperimentId(updates, experimentId)
        this.populateExperimentId(adds, experimentId)

        const updatedRefDesignSpecIds = _.map(updates, 'refDesignSpecId')
        const createdRefDesignSpecIds = _.map(adds, 'refDesignSpecId')
        const refDesignSpecIds = updatedRefDesignSpecIds.concat(createdRefDesignSpecIds)
        return this.refDesignSpecificationService.getAllRefDesignSpecs()
          .then(refSpecs =>
            this.deleteDesignSpecificationDetails(deletes, context, tx)
              .then(() =>
                this.updateDesignSpecificationDetails(updates, context, tx)
                  .then(() =>
                    this.createDesignSpecificationDetails(adds, context, tx)
                      .then(() => {
                        const randomizationRefSpecId = _.find(refSpecs, refSpec => refSpec.name === 'Randomization Strategy ID').id

                        if (refDesignSpecIds.includes(randomizationRefSpecId)) {
                          const designSpecs = updates.concat(adds)
                          const randomizationStrategySpec = _.find(designSpecs, update =>
                            update.refDesignSpecId === randomizationRefSpecId)

                          return PingUtil.getMonsantoHeader().then((headers) => {
                            const { randomizationAPIUrl } =
                              cfServices.experimentsExternalAPIUrls.value

                            return HttpUtil.get(`${randomizationAPIUrl}/strategies`, headers)
                              .then((strategies) => {
                                const randStrategy = _.find(strategies.body, strategy =>
                                  strategy.id.toString() === randomizationStrategySpec.value)

                                return this.factorService
                                  .updateFactorsForDesign(experimentId, randStrategy, tx)
                                  .then(() => db.experiments.updateStrategyCode(experimentId,
                                    randStrategy, context, tx))
                                  .then(() => AppUtil.createCompositePostResponse())
                              })
                          })
                        }
                        return AppUtil.createCompositePostResponse()
                      }),
                  ),
              ),
          )
      }

      return Promise.resolve()
    })
  }

  @setErrorCode('137000')
  @Transactional('deleteDesignSpecificationDetails')
  deleteDesignSpecificationDetails = (idsToDelete, context, tx) => {
    if (_.compact(idsToDelete).length === 0) {
      return Promise.resolve()
    }
    return db.designSpecificationDetail.batchRemove(idsToDelete, tx)
      .then((data) => {
        if (data.length !== idsToDelete.length) {
          logger.error(`[[${context.requestId}]] Not all design specification detail ids requested for delete were found`)
          throw AppError.notFound(
            'Not all design specification detail ids requested for delete were found', undefined, getFullErrorCode('137001'))
        } else {
          return data
        }
      })
  }

  @setErrorCode('138000')
  updateDesignSpecificationDetails(designSpecificationDetails, context, tx) {
    if (_.compact(designSpecificationDetails).length === 0) {
      return Promise.resolve()
    }
    return this.batchUpdateDesignSpecificationDetails(designSpecificationDetails, context, tx)
  }

  @setErrorCode('139000')
  createDesignSpecificationDetails(designSpecificationDetails, context, tx) {
    if (_.compact(designSpecificationDetails).length === 0) {
      return Promise.resolve()
    }
    return this.batchCreateDesignSpecificationDetails(designSpecificationDetails, context, tx)
  }

  @setErrorCode('13A000')
  @Transactional('getAdvancedParameters')
  getAdvancedParameters(experimentId, isTemplate, context, tx) {
    return this.experimentService.getExperimentById(experimentId, isTemplate, context, tx)
      .then(() => Promise.all([db.refDesignSpecification.all(),
        db.designSpecificationDetail.findAllByExperimentId(experimentId, tx)]))
      .then((results) => {
        const mappedDesignSpecs = {}
        const advancedParameters = {}

        _.forEach(results[0], (ds) => { mappedDesignSpecs[ds.id] = ds.name.replace(/\s/g, '') })
        _.forEach(results[1], (dsd) => {
          advancedParameters[mappedDesignSpecs[dsd.ref_design_spec_id]] = dsd.value
        })

        return advancedParameters
      })
  }

  @setErrorCode('13A000')
  @Transactional('syncDesignSpecificationDetails')
  syncDesignSpecificationDetails(capacitySyncDesignSpecDetails, experimentId, context, tx) {
    return this.getDesignSpecificationDetailsByExperimentId(experimentId, false, context, tx)
      .then(currentDesignSpecDetails =>
        this.refDesignSpecificationService.getAllRefDesignSpecs().then((refDesignSpecs) => {
          const upsertValues = []

          if (capacitySyncDesignSpecDetails.locations) {
            const refLocationId = _.find(refDesignSpecs, dS => dS.name === 'Locations').id

            upsertValues.push({
              refDesignSpecId: refLocationId,
              value: capacitySyncDesignSpecDetails.locations,
            })
          }

          if (capacitySyncDesignSpecDetails.reps) {
            const refMinRepsId = _.find(refDesignSpecs, dS => dS.name === 'Min Rep').id
            const currentMinReps = _.find(
              currentDesignSpecDetails, dSD => dSD.ref_design_spec_id === refMinRepsId,
            )

            if (!currentMinReps) {
              const refRepId = _.find(refDesignSpecs, dS => dS.name === 'Reps').id

              upsertValues.push({
                refDesignSpecId: refRepId,
                value: capacitySyncDesignSpecDetails.reps,
              })
            }
          }

          if (upsertValues.length > 0) {
            return db.designSpecificationDetail.syncDesignSpecificationDetails(
              experimentId, upsertValues, context, tx,
            )
          }

          return Promise.resolve()
        }),
      )
  }
}

module.exports = DesignSpecificationDetailService
