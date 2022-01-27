import _ from 'lodash'
import inflector from 'json-inflector'
import Transactional from '@monsantoit/pg-transactional'
import { dbRead, dbWrite } from '../db/DbManager'
import AppUtil from './utility/AppUtil'
import AppError from './utility/AppError'
import SecurityService from './SecurityService'
import DesignSpecificationDetailValidator from '../validations/DesignSpecificationDetailValidator'
import { notifyChanges } from '../decorators/notifyChanges'

const { getFullErrorCode, setErrorCode } = require('@monsantoit/error-decorator')()

// Error Codes 13XXXX
class DesignSpecificationDetailService {
  constructor() {
    this.validator = new DesignSpecificationDetailValidator()
    this.securityService = new SecurityService()
  }

  @setErrorCode('131000')
  @Transactional('batchCreateDesignSpecificationDetails')
  batchCreateDesignSpecificationDetails = async (designSpecificationDetails, context, tx) => {
    if (_.compact(designSpecificationDetails).length === 0) {
      return Promise.resolve()
    }
    await this.validator.validate(designSpecificationDetails, 'POST')
    const data = await dbWrite.designSpecificationDetail.batchCreate(
      designSpecificationDetails, context, tx)
    return AppUtil.createPostResponse(data)
  }

  @setErrorCode('132000')
  @Transactional('batchUpdateDesignSpecificationDetails')
  batchUpdateDesignSpecificationDetails = async (designSpecificationDetails, context, tx) => {
    if (_.compact(designSpecificationDetails).length === 0) {
      return Promise.resolve()
    }
    await this.validator.validate(designSpecificationDetails, 'PUT')
    const data = await dbWrite.designSpecificationDetail.batchUpdate(
      designSpecificationDetails, context, tx)
    return AppUtil.createPutResponse(data)
  }

  @setErrorCode('133000')
  @Transactional('deleteDesignSpecificationDetails')
  deleteDesignSpecificationDetails = (idsToDelete, context, tx) => {
    if (_.compact(idsToDelete).length === 0) {
      return Promise.resolve()
    }
    return dbWrite.designSpecificationDetail.batchRemove(idsToDelete, tx)
      .then((data) => {
        if (data.length !== idsToDelete.length) {
          console.error(`[[${context.requestId}]] Not all design specification detail ids requested for delete were found`)
          throw AppError.notFound(
            'Not all design specification detail ids requested for delete were found', undefined, getFullErrorCode('137001'))
        } else {
          return data
        }
      })
  }

  @setErrorCode('134000')
  getAdvancedParameters = experimentId =>
    Promise.all([
      dbRead.refDesignSpecification.all(),
      dbRead.designSpecificationDetail.findAllByExperimentId(experimentId),
    ]).then((results) => {
      const mappedDesignSpecs = {}
      const advancedParameters = {}

      _.forEach(results[0], (ds) => { mappedDesignSpecs[ds.id] = ds.name.replace(/\s/g, '') })
      _.forEach(results[1], (dsd) => {
        advancedParameters[mappedDesignSpecs[dsd.ref_design_spec_id]] = dsd.value
      })

      delete advancedParameters.RandomizationStrategyID
      delete advancedParameters.BlockByRep

      return inflector.transform(advancedParameters, 'camelizeLower', true)
    })

  @setErrorCode('135000')
  @notifyChanges('update', 1)
  @Transactional('saveDesignSpecifications')
  saveDesignSpecifications = (designSpecifications, experimentId, isTemplate, context, tx) =>
    this.securityService.permissionsCheck(experimentId, context, isTemplate)
      .then(() => Promise.all([
        dbRead.designSpecificationDetail.findAllByExperimentId(experimentId),
        dbRead.refDesignSpecification.all(),
      ]))
      .then(([existingDesignSpecs, refDesignSpecs]) => {
        const refMapper = {}
        _.forEach(refDesignSpecs, (refSpec) => {
          refMapper[refSpec.name.replace(/\s/g, '').toLowerCase()] = refSpec.id
        })

        const newDesignSpecs = _.filter(_.map(designSpecifications, (value, key) => ({
          value,
          experimentId: Number(experimentId),
          refDesignSpecId: refMapper[key.toLowerCase()],
        })), ds => !(_.isNil(ds.value) || ds.value === ''))

        const adds = _.differenceBy(newDesignSpecs, existingDesignSpecs,
          ds => ds.refDesignSpecId || ds.ref_design_spec_id)

        _.forEach(existingDesignSpecs, (eds) => {
          const match = _.find(newDesignSpecs,
            nds => nds.refDesignSpecId === eds.ref_design_spec_id)
          eds.value = _.get(match, 'value')
          eds.hasMatch = !!match
        })

        const [updates, deletes] = _.partition(existingDesignSpecs, eds => eds.hasMatch)
        const inflectedUpdates = inflector.transform(updates, 'camelizeLower', true)
        const idsToDelete = _.map(_.filter(deletes, d => d.ref_design_spec_id !== refMapper.randomizationstrategyid), 'id')

        return tx.batch([
          this.deleteDesignSpecificationDetails(idsToDelete, context, tx),
          this.batchUpdateDesignSpecificationDetails(inflectedUpdates, context, tx),
          this.batchCreateDesignSpecificationDetails(adds, context, tx),
        ])
      })
      .then(() => AppUtil.createCompositePostResponse())

  @setErrorCode('136000')
  @Transactional('syncDesignSpecificationDetails')
  syncDesignSpecificationDetails(capacitySyncDesignSpecDetails, experimentId, context, tx) {
    return this.getAdvancedParameters(experimentId)
      .then((currentDesignSpecDetails) => {
        let shouldUpdate = false

        if (!_.isNil(capacitySyncDesignSpecDetails.locations)) {
          shouldUpdate = true
          currentDesignSpecDetails.locations = capacitySyncDesignSpecDetails.locations.toString()
        }

        if (!_.isNil(capacitySyncDesignSpecDetails.reps) && !currentDesignSpecDetails.minRep) {
          shouldUpdate = true
          currentDesignSpecDetails.reps = capacitySyncDesignSpecDetails.reps.toString()
        }

        if (shouldUpdate) {
          return this.saveDesignSpecifications(
            currentDesignSpecDetails, experimentId, false, context, tx,
          )
        }

        return Promise.resolve()
      })
  }

  @setErrorCode('137000')
  deleteInvalidSpecsForRandomization = async (experimentId, randomizationStrategy, tx) => {
    const designSpecKeys = await dbRead.refDesignSpecification.all()
    const areBordersAllowed = randomizationStrategy.rules?.buffers?.border
    const areRepBuffersAllowed = randomizationStrategy.rules?.buffers?.rep
    const keyIdsToDelete = []
    if (!areBordersAllowed) {
      const borderSizeId = designSpecKeys.find(key => key.name === 'Border Size').id
      keyIdsToDelete.push(borderSizeId)
    }
    if (!areRepBuffersAllowed) {
      const repBufferSizeId = designSpecKeys.find(key => key.name === 'Rep Buffer Size').id
      keyIdsToDelete.push(repBufferSizeId)
    }

    if (keyIdsToDelete.length > 0) {
      await dbWrite.designSpecificationDetail.deleteByExperimentAndKey(experimentId,
        keyIdsToDelete, tx)
    }
  }
}

module.exports = DesignSpecificationDetailService
