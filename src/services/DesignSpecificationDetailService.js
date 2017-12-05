import log4js from 'log4js'
import _ from 'lodash'
import db from '../db/DbManager'
import AppUtil from './utility/AppUtil'
import AppError from './utility/AppError'
import ExperimentsService from './ExperimentsService'
import SecurityService from './SecurityService'
import DesignSpecificationDetailValidator from '../validations/DesignSpecificationDetailValidator'
import Transactional from '../decorators/transactional'

const logger = log4js.getLogger('DesignSpecificationDetailService')

class DesignSpecificationDetailService {
  constructor() {
    this.validator = new DesignSpecificationDetailValidator()
    this.experimentService = new ExperimentsService()
    this.securityService = new SecurityService()
  }

  @Transactional('getDesignSpecificationDetailsByExperimentId')
  getDesignSpecificationDetailsByExperimentId(id, isTemplate, tx) {
    return this.experimentService.getExperimentById(id, isTemplate, tx)
      .then(() => db.designSpecificationDetail.findAllByExperimentId(id, tx))
  }

  @Transactional('getDesignSpecificationDetailById')
  getDesignSpecificationDetailById = (id, context, tx) => db.designSpecificationDetail.find(id, tx)
    .then((data) => {
      if (!data) {
        logger.error(`[[${context.transactionId}]] Design Specification Detail Not Found for requested id = ${id}`)
        throw AppError.notFound('Design Specification Detail Not Found for requested id')
      } else {
        return data
      }
    })

  @Transactional('batchGetDesignSpecificationDetailsByIds')
  batchGetDesignSpecificationDetailsByIds = (ids, tx) =>
    db.designSpecificationDetail.batchFind(ids, tx)
      .then((data) => {
        if (data.length !== ids.length) {
          logger.error(`[[${context.transactionId}]] Design Specification Detail not found for all requested ids.`)
          throw AppError.notFound('Design Specification Detail not found for all requested ids.')
        } else {
          return data
        }
      })

  @Transactional('batchCreateDesignSpecificationDetails')
  batchCreateDesignSpecificationDetails(specificationDetails, context, tx) {
    return this.validator.validate(specificationDetails, 'POST', tx)
      .then(() => db.designSpecificationDetail.batchCreate(specificationDetails, context, tx)
        .then(data => AppUtil.createPostResponse(data)))
  }

  @Transactional('batchUpdateDesignSpecificationDetails')
  batchUpdateDesignSpecificationDetails(designSpecificationDetails, context, tx) {
    return this.validator.validate(designSpecificationDetails, 'PUT', tx)
      .then(() => db.designSpecificationDetail.batchUpdate(designSpecificationDetails, context, tx)
        .then(data => AppUtil.createPutResponse(data)))
  }

  populateExperimentId = (designSpecs, experimentId) => {
    _.forEach(designSpecs, (ds) => {
      ds.experimentId = Number(experimentId)
    })
  }

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

  @Transactional('deleteDesignSpecificationDetails')
  deleteDesignSpecificationDetails = (idsToDelete, context, tx) => {
    if (_.compact(idsToDelete).length === 0) {
      return Promise.resolve()
    }
    return db.designSpecificationDetail.batchRemove(idsToDelete, tx)
      .then((data) => {
        if (data.length !== idsToDelete.length) {
          logger.error(`[[${context.transactionId}]] Not all design specification detail ids requested for delete were found`)
          throw AppError.notFound(
            'Not all design specification detail ids requested for delete were found')
        } else {
          return data
        }
      })
  }

  updateDesignSpecificationDetails(designSpecificationDetails, context, tx) {
    if (_.compact(designSpecificationDetails).length === 0) {
      return Promise.resolve()
    }
    return this.batchUpdateDesignSpecificationDetails(designSpecificationDetails, context, tx)
  }

  createDesignSpecificationDetails(designSpecificationDetails, context, tx) {
    if (_.compact(designSpecificationDetails).length === 0) {
      return Promise.resolve()
    }
    return this.batchCreateDesignSpecificationDetails(designSpecificationDetails, context, tx)
  }

  @Transactional('getAdvancedParameters')
  getAdvancedParameters(experimentId, isTemplate, tx) {
    return this.experimentService.getExperimentById(experimentId, isTemplate, tx)
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
}

module.exports = DesignSpecificationDetailService
