import log4js from 'log4js'
import _ from 'lodash'
import db from '../db/DbManager'
import AppUtil from './utility/AppUtil'
import AppError from './utility/AppError'
import ExperimentsService from './ExperimentsService'
import SecurityService from './SecurityService'
import DesignSpecificationDetailValidator from '../validations/DesignSpecificationDetailValidator'
import RefDesignSpecificationService from './RefDesignSpecificationService'
import Transactional from '../decorators/transactional'
import setErrorDecorator from '../decorators/setErrorDecorator'

const { getFullErrorCode, setErrorCode } = setErrorDecorator()

const logger = log4js.getLogger('DesignSpecificationDetailService')

function createDesignSpecificationDetailObject(id, refDesignSpecId, value, experimentId) {
  const designSpecificationDetail = {
    refDesignSpecId,
    value,
    experimentId,
  }

  if (id) {
    designSpecificationDetail.id = id
  }

  return designSpecificationDetail
}

function handleDesignSpecificationDetailSyncValue(
  currentDesignSpecificationDetail,
  syncDesignSpecificationDetailValue,
  refDesignSpecId,
  experimentId) {
  if (currentDesignSpecificationDetail) {
    if (syncDesignSpecificationDetailValue.toString() !== currentDesignSpecificationDetail.value) {
      return createDesignSpecificationDetailObject(
        currentDesignSpecificationDetail.id,
        refDesignSpecId,
        syncDesignSpecificationDetailValue.toString(),
        experimentId,
      )
    }
  } else {
    return createDesignSpecificationDetailObject(
      undefined,
      refDesignSpecId,
      syncDesignSpecificationDetailValue.toString(),
      experimentId,
    )
  }

  return undefined
}


// Error Codes 13XXXX
class DesignSpecificationDetailService {
  constructor() {
    this.validator = new DesignSpecificationDetailValidator()
    this.experimentService = new ExperimentsService()
    this.refDesignSpecificationService = new RefDesignSpecificationService()
    this.securityService = new SecurityService()
  }

  @setErrorCode('131000')
  @Transactional('getDesignSpecificationDetailsByExperimentId')
  getDesignSpecificationDetailsByExperimentId(id, isTemplate, context, tx) {
    return this.experimentService.getExperimentById(id, isTemplate, context, tx)
      .then(() => db.designSpecificationDetail.findAllByExperimentId(id, tx))
  }

  @setErrorCode('132000')
  @Transactional('getDesignSpecificationDetailById')
  getDesignSpecificationDetailById = (id, context, tx) => db.designSpecificationDetail.find(id, tx)
    .then((data) => {
      if (!data) {
        logger.error(`[[${context.requestId}]] Design Specification Detail Not Found for requested id = ${id}`)
        throw AppError.notFound('Design Specification Detail Not Found for requested id', undefined, getFullErrorCode('132001'))
      } else {
        return data
      }
    })

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

  @setErrorCode('136000')
  @Transactional('manageAllDesignSpecificationDetails')
  manageAllDesignSpecificationDetails(designSpecificationDetailsObj, experimentId, context,
    isTemplate, tx) {
    return this.securityService.permissionsCheck(experimentId, context, isTemplate, tx).then(() => {
      if (designSpecificationDetailsObj) {
        const { adds, updates, deletes } = designSpecificationDetailsObj
        this.populateExperimentId(updates, experimentId)
        this.populateExperimentId(adds, experimentId)

        return this.deleteDesignSpecificationDetails(deletes, context, tx)
          .then(() =>
            this.updateDesignSpecificationDetails(updates, context, tx)
              .then(() =>
                this.createDesignSpecificationDetails(adds, context, tx)
                  .then(() => AppUtil.createCompositePostResponse())))
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
  syncDesignSpecificationDetails(designSpecificationDetails, experimentId, context, tx) {
    return this.getDesignSpecificationDetailsByExperimentId(experimentId, false, context, tx)
      .then(currentDesignSpecDetails =>
        this.refDesignSpecificationService.getAllRefDesignSpecs().then((designSpecs) => {
          const designSpecificationDetailChanges = { adds: [], updates: [], deletes: [] }

          // handle locations
          if (designSpecificationDetails.locations) {
            const refLocationId = _.find(designSpecs, dS => dS.name === 'Locations').id
            const currentLocations = _.find(
              currentDesignSpecDetails, dSD => dSD.ref_design_spec_id === refLocationId,
            )

            const syncDesignSpecificationDetail = handleDesignSpecificationDetailSyncValue(
              currentLocations,
              designSpecificationDetails.locations,
              refLocationId,
              experimentId,
            )

            if (syncDesignSpecificationDetail) {
              if (syncDesignSpecificationDetail.id) {
                designSpecificationDetailChanges.updates.push(syncDesignSpecificationDetail)
              } else {
                designSpecificationDetailChanges.adds.push(syncDesignSpecificationDetail)
              }
            }
          }

          // handle reps
          if (designSpecificationDetails.reps) {
            const refMinRepsId = _.find(designSpecs, dS => dS.name === 'Min Rep').id
            const currentMinReps = _.find(
              currentDesignSpecDetails, dSD => dSD.ref_design_spec_id === refMinRepsId,
            )

            if (!currentMinReps) {
              const refRepId = _.find(designSpecs, dS => dS.name === 'Reps').id
              const currentReps = _.find(
                currentDesignSpecDetails, dSD => dSD.ref_design_spec_id === refRepId,
              )

              const syncDesignSpecificationDetail = handleDesignSpecificationDetailSyncValue(
                currentReps,
                designSpecificationDetails.reps,
                refRepId,
                experimentId,
              )

              if (syncDesignSpecificationDetail) {
                if (syncDesignSpecificationDetail.id) {
                  designSpecificationDetailChanges.updates.push(syncDesignSpecificationDetail)
                } else {
                  designSpecificationDetailChanges.adds.push(syncDesignSpecificationDetail)
                }
              }
            }
          }

          if (
            designSpecificationDetailChanges.adds.length > 0 ||
            designSpecificationDetailChanges.updates.length > 0
          ) {
            return this.manageAllDesignSpecificationDetails(
              designSpecificationDetailChanges,
              experimentId,
              context,
              false,
              tx,
            )
          }

          return Promise.resolve()
        }))
  }
}

module.exports = DesignSpecificationDetailService
