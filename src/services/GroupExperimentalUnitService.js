import log4js from 'log4js'
import _ from 'lodash'
import inflector from 'json-inflector'
import Transactional from '@monsantoit/pg-transactional'
import DesignSpecificationDetailService from './DesignSpecificationDetailService'
import ExperimentalUnitService from './ExperimentalUnitService'
import SecurityService from './SecurityService'
import FactorService from './FactorService'
import LambdaPerformanceService from './prometheus/LambdaPerformanceService'
import ExperimentalUnitValidator from '../validations/ExperimentalUnitValidator'

import db from '../db/DbManager'
import AppUtil from './utility/AppUtil'
import AppError from './utility/AppError'
import AWSUtil from './utility/AWSUtil'
import HttpUtil from './utility/HttpUtil'
import PingUtil from './utility/PingUtil'
import cfServices from './utility/ServiceConfig'
import { notifyChanges, sendKafkaNotification } from '../decorators/notifyChanges'

const { getFullErrorCode, setErrorCode } = require('@monsantoit/error-decorator')()

const logger = log4js.getLogger('GroupExperimentalUnitService')

// Error Codes 1FXXXX
class GroupExperimentalUnitService {
  constructor() {
    this.experimentalUnitService = new ExperimentalUnitService()
    this.designSpecificationDetailService = new DesignSpecificationDetailService()
    this.securityService = new SecurityService()
    this.factorService = new FactorService()
    this.lambdaPerformanceService = new LambdaPerformanceService()
    this.unitValidator = new ExperimentalUnitValidator()
  }

  @setErrorCode('1F5000')
  batchDeleteExperimentalUnits = (unitDeletes, tx) => (unitDeletes.length > 0
    ? db.unit.batchRemove(_.map(unitDeletes, 'id'), tx)
    : Promise.resolve())

  @setErrorCode('1FA000')
  createExperimentalUnits(experimentId, units, context, tx) {
    if (units.length === 0) {
      return Promise.resolve()
    }
    const treatmentIds = _.uniq(_.map(units, 'treatmentId'))
    return db.treatment.getDistinctExperimentIds(treatmentIds, tx).then((experimentIdsResp) => {
      const experimentIds = _.compact(_.map(experimentIdsResp, 'experiment_id'))
      if (experimentIds.length > 1 || Number(experimentIds[0]) !== Number(experimentId)) {
        throw AppError.badRequest('Treatments not associated with same experiment', undefined, getFullErrorCode('1FA001'))
      } else {
        return this.experimentalUnitService.batchCreateExperimentalUnits(units, context, tx)
      }
    })
  }

  @setErrorCode('1FM000')
  @Transactional('resetSet')
  resetSet = (setId, context, tx) =>
    // get group by setId
    this.verifySetAndGetDetails(setId, context, tx).then((results) => {
      const {
        experimentId, location, numberOfReps, block,
      } = results
      return db.treatment.findAllByExperimentId(experimentId, tx).then((treatments) => {
        const treatmentsForBlock =
          _.isNil(block)
            ? treatments
            : _.filter(treatments, t => t.block === block || t.in_all_blocks)

        const units = this.createUnits(location, treatmentsForBlock, numberOfReps, block)
        return this.saveUnitsBySetId(setId, experimentId, units, context, tx)
          .then(() =>
            this.getSetEntriesFromSet(setId, numberOfReps, treatmentsForBlock.length, context))
          .then(result =>
            db.unit.batchFindAllByExperimentIdLocationAndBlock(experimentId, location, block, tx)
              .then((unitsInDB) => {
                const setEntryIds = _.map(result.body.entries, 'entryId')
                _.forEach(unitsInDB, (unit, index) => {
                  unit.setEntryId = setEntryIds[index]
                })
                const unitsFromDBCamlized = _.map(unitsInDB, u => inflector.transform(u, 'camelizeLower'))
                return this.experimentalUnitService.batchPartialUpdateExperimentalUnits(
                  unitsFromDBCamlized, context, tx)
                  .then(sendKafkaNotification('update', experimentId))
              }))
      })
    })

  @setErrorCode('1Fd000')
  getSetEntriesFromSet = (setId, numberOfReps, treatmentLength, context) =>
    PingUtil.getMonsantoHeader().then((header) => {
      header.push({
        headerName: 'oauth_resourceownerinfo',
        headerValue: `username=${context.userId},user_id=${context.userId}`,
      })
      return HttpUtil.getWithRetry(`${cfServices.experimentsExternalAPIUrls.value.setsAPIUrl}/sets/${setId}?entries=true`, header)
        .then((originalSet) => {
          const originals = []
          _.forEach(originalSet.body.entries, (entry) => {
            originals.push({ entryId: entry.entryId, deleted: true })
          })

          const originalsDeletePromise = originals.length > 0
            ? HttpUtil.patch(`${cfServices.experimentsExternalAPIUrls.value.setsAPIUrl}/sets/${setId}`, header, { entries: originals })
            : Promise.resolve()

          const entries = []
          while (entries.length < numberOfReps * treatmentLength) {
            entries.push({})
          }
          return originalsDeletePromise
            .then(() => HttpUtil.patch(`${cfServices.experimentsExternalAPIUrls.value.setsAPIUrl}/sets/${setId}`, header, {
              entries,
              layout: [],
            }))
        })
    }).catch((err) => {
      logger.error(`[[${context.requestId}]] An error occurred while communicating with the sets service`, err)
      throw AppError.internalServerError('An error occurred while communicating with the sets service.', undefined, getFullErrorCode('1Fd001'))
    })

  @setErrorCode('1FK000')
  verifySetAndGetDetails = (setId, context, tx) =>
    db.locationAssociation.findBySetId(setId, tx).then((locAssociation) => {
      if (!locAssociation) {
        logger.error(`[[${context.requestId}]] No set found for id ${setId}.`)
        throw AppError.notFound(`No set found for id ${setId}`, undefined, getFullErrorCode('1FK001'))
      }
      const experimentId = locAssociation.experiment_id
      const designSpecPromise = db.designSpecificationDetail.findAllByExperimentId(experimentId, tx)
      const refDesignSpecPromise = db.refDesignSpecification.all()

      return Promise.all([designSpecPromise, refDesignSpecPromise])
        .then(([designSpecs, refDesignSpecs]) => {
          const repsRefDesignSpec = _.find(refDesignSpecs, refDesignSpec => refDesignSpec.name === 'Reps')
          const minRepRefDesignSpec = _.find(refDesignSpecs, refDesignSpec => refDesignSpec.name === 'Min Rep')
          const repDesignSpecDetail =
            _.find(designSpecs, sd => sd.ref_design_spec_id === minRepRefDesignSpec.id)
              || _.find(designSpecs, sd => sd.ref_design_spec_id === repsRefDesignSpec.id)

          if (!repDesignSpecDetail) {
            logger.error(`[[${context.requestId}]] The specified set (id ${setId}) does not have a minimum number of reps and cannot be reset.`)
            throw AppError.badRequest(`The specified set (id ${setId}) does not have a minimum number of reps and cannot be reset.`,
              undefined, getFullErrorCode('1FK002'))
          }

          const numberOfReps = Number(repDesignSpecDetail.value)

          return {
            experimentId,
            location: locAssociation.location,
            numberOfReps,
            block: locAssociation.block,
          }
        })
    })

  @setErrorCode('1FN000')
  createUnits = (location, treatments, numberOfReps, block) =>
    _.flatMap(_.range(numberOfReps), repl =>
      _.map(treatments, treatment => ({
        location,
        rep: repl + 1,
        treatmentId: treatment.id,
        block,
      })))

  @setErrorCode('1FO000')
  @Transactional('getGroupsAndUnits')
  getGroupsAndUnits = (experimentId, tx) =>
    Promise.all([
      db.factor.findByExperimentId(experimentId, tx),
      db.factorLevel.findByExperimentId(experimentId, tx),
      db.designSpecificationDetail.findAllByExperimentId(experimentId, tx),
      db.refDesignSpecification.all(tx),
      db.treatment.findAllByExperimentId(experimentId, tx),
      db.combinationElement.findAllByExperimentId(experimentId, tx),
      db.unit.findAllByExperimentId(experimentId, tx),
      db.locationAssociation.findByExperimentId(experimentId, tx),
      db.experiments.find(experimentId, false, tx),
    ]).then(([
      variables,
      variableLevels,
      designSpecs,
      refDesignSpecs,
      treatments,
      combinationElements,
      units,
      setLocAssociations,
      experiment,
    ]) => {
      const trimmedVariables = _.map(variables, variable => _.omit(variable, ['created_user_id', 'created_date', 'modified_user_id', 'modified_date']))
      const trimmedVariableLevels = _.map(variableLevels, variableLevel => _.omit(variableLevel, ['created_user_id', 'created_date', 'modified_user_id', 'modified_date']))
      const trimmedTreatments = _.map(treatments, treatment => _.omit(treatment, ['created_user_id', 'created_date', 'modified_user_id', 'modified_date', 'notes', 'treatment_number']))
      const trimmedCombinations = _.map(combinationElements, comb => _.omit(comb, ['created_user_id', 'created_date', 'modified_user_id', 'modified_date', 'id']))
      const trimmedUnits = _.map(units, unit => _.omit(unit, ['created_user_id', 'created_date', 'modified_user_id', 'modified_date', 'group_id']))

      const variableLevelsMap = _.groupBy(trimmedVariableLevels, 'factor_id')
      const combinationElementsMap = _.groupBy(trimmedCombinations, 'treatment_id')

      _.forEach(trimmedVariables, (variable) => {
        variable.levels = variableLevelsMap[variable.id]
        _.forEach(variable.levels, (level) => {
          level.factorName = variable.name
        })
      })

      _.forEach(trimmedTreatments, (treatment) => {
        treatment.combinationElements = combinationElementsMap[treatment.id]
      })

      _.forEach(trimmedVariableLevels, (level) => {
        const levelItems = _.get(level, 'value.items') || []
        level.items = levelItems.length === 1 ? levelItems[0] : levelItems
        delete level.value
        delete level.factorName
      })

      const body = JSON.stringify(inflector.transform({
        experimentId,
        randomizationStrategyCode: experiment.randomization_strategy_code,
        variables: trimmedVariables,
        designSpecs,
        refDesignSpecs,
        treatments: trimmedTreatments,
        units: trimmedUnits,
        setLocAssociations,
      }, 'camelizeLower'))

      const startTime = new Date()
      return AWSUtil.callLambda(cfServices.aws.lambdaName, body)
        .then(data => this.lambdaPerformanceService.savePerformanceStats(body.length,
          data.Payload.length, new Date() - startTime)
          .then(() => JSON.parse(data.Payload)))
        .catch((err) => {
          console.error(err)
          return Promise.reject(AppError.internalServerError('An error occurred while generating groups.', undefined, getFullErrorCode('1FO001')))
        })
    })

  @setErrorCode('1FP000')
  getGroupsAndUnitsByExperimentIds = (experimentIds, tx) => Promise.all(_.map(experimentIds,
    experimentId => this.getGroupsAndUnits(experimentId, tx).catch(() => [])))

  @setErrorCode('1FQ000')
  @Transactional('getGroupAndUnitsBySetId')
  getGroupAndUnitsBySetId = (setId, tx) => db.locationAssociation.findBySetId(setId, tx)
    .then((setAssocation) => {
      if (!setAssocation) return {}
      return this.getGroupAndUnitsBySetIdAndExperimentId(setAssocation.set_id,
        setAssocation.experiment_id, tx)
    })
    .catch(() => ({}))

  @setErrorCode('1FR000')
  getGroupAndUnitsBySetIdAndExperimentId = (setId, experimentId, tx) =>
    this.getGroupsAndUnits(experimentId, tx)
      .then((groups) => {
        const group = _.find(groups, g => g.setId === setId)
        if (_.isNil(group)) return {}
        group.setEntries = this.getUnitsFromGroupsBySetId(groups, setId)
        return group
      })
      .catch(() => ({}))

  @setErrorCode('1FS000')
  getUnitsFromGroupsBySetId = (groups, setId) => {
    const group = _.find(groups, g => g.setId === setId)
    if (_.isNil(group)) return []
    return _.compact(_.concat(group.units, this.getChildGroupUnits(group)))
  }

  @setErrorCode('1FT000')
  getChildGroupUnits = (group) => {
    const children = group.childGroups
    const childGroupUnits = _.flatMap(children, childGroup => this.getChildGroupUnits(childGroup))

    return _.compact(_.concat(group.units, childGroupUnits))
  }

  @notifyChanges('update', 0)
  @setErrorCode('1FV000')
  @Transactional('saveDesignSpecsAndUnitDetails')
  saveDesignSpecsAndUnits = (experimentId, designSpecsAndUnits, context, isTemplate, tx) => {
    if (designSpecsAndUnits) {
      const { designSpecifications, units } = designSpecsAndUnits
      const numberOfLocations = _.max(_.map(units, 'location'))
      return this.unitValidator.validate(units, 'POST', tx)
        .then(() => Promise.all([
          db.locationAssociation.findNumberOfLocationsAssociatedWithSets(experimentId, tx),
          db.treatment.findAllByExperimentId(experimentId, tx),
        ]))
        .then(([locations, treatments]) => {
          if (units && (numberOfLocations < locations.max)) {
            throw AppError.badRequest('Cannot remove locations from an experiment that are' +
                ' linked to sets', undefined, getFullErrorCode('1FV002'))
          }
          const treatmentsMapper = {}
          _.forEach(treatments, (treatment) => {
            treatmentsMapper[treatment.id] = treatment
            treatment.block = treatment.block || null
          })
          _.forEach(units, (unit) => {
            unit.block = unit.block || null
          })

          const unitsWithInvalidBlock = _.filter(units, (unit) => {
            const treatment = treatmentsMapper[unit.treatmentId]
            return (unit.block !== treatment.block && !treatment.in_all_blocks)
              || (treatment.in_all_blocks &&
                !_.find(treatments, t => t.block === unit.block && !t.in_all_blocks))
          })

          if (unitsWithInvalidBlock.length > 0) {
            throw AppError.badRequest(`${unitsWithInvalidBlock.length} units have invalid block values.`, undefined, getFullErrorCode('1FV003'))
          }

          return Promise.all([
            this.saveUnitsByExperimentId(experimentId, units, isTemplate, context, tx),
            this.designSpecificationDetailService.saveDesignSpecifications(
              designSpecifications, experimentId, isTemplate, context, tx,
            ),
          ]).then(() => {
            AppUtil.createCompositePostResponse()
          })
        })
    }

    throw AppError.badRequest('Design Specifications and Units object must be defined', undefined, getFullErrorCode('1FV001'))
  }

  @setErrorCode('1FW000')
  @Transactional('saveUnitsByExperimentId')
  saveUnitsByExperimentId = (experimentId, units, isTemplate, context, tx) =>
    this.securityService.permissionsCheck(experimentId, context, isTemplate, tx)
      .then(() => this.compareWithExistingUnitsByExperiment(experimentId, units, tx)
        .then(comparisonResults =>
          this.saveComparedUnits(experimentId, comparisonResults, context, tx)),
      )

  @setErrorCode('1FX000')
  saveUnitsBySetId = (setId, experimentId, units, context, tx) =>
    this.compareWithExistingUnitsBySetId(setId, units, tx)
      .then(comparisonResults =>
        this.saveComparedUnits(experimentId, comparisonResults, context, tx))

  @setErrorCode('1FY000')
  saveComparedUnits = (experimentId, comparisonUnits, context, tx) => Promise.all([
    this.createExperimentalUnits(experimentId, comparisonUnits.adds, context, tx),
    this.batchDeleteExperimentalUnits(comparisonUnits.deletes, tx)])

  @setErrorCode('1FZ000')
  compareWithExistingUnitsByExperiment = (experimentId, newUnits, tx) =>
    this.experimentalUnitService.getExperimentalUnitsByExperimentIdNoValidate(experimentId, tx)
      .then(existingUnits => this.compareWithExistingUnits(existingUnits, newUnits))

  @setErrorCode('1Fa000')
  compareWithExistingUnitsBySetId = (setId, newUnits, tx) =>
    db.unit.batchFindAllBySetId(setId, tx)
      .then(existingUnits => this.compareWithExistingUnits(existingUnits, newUnits))

  @setErrorCode('1Fa000')
  compareWithExistingUnits = (existingUnits, newUnits) => {
    const unitsToDeletesFromDB = _.compact(_.map(existingUnits, (eu) => {
      const matchingUnit = _.find(newUnits,
        nu => (eu.treatment_id || eu.treatmentId) === nu.treatmentId &&
          eu.rep === nu.rep && eu.location === nu.location && eu.block === nu.block && !nu.matched)
      if (matchingUnit) {
        matchingUnit.matched = true
        return undefined
      }
      return eu
    }))
    const adds = _.filter(newUnits, nu => !nu.matched)
    const deletes = _.map(unitsToDeletesFromDB, u => inflector.transform(u, 'camelizeLower'))
    return {
      adds,
      deletes,
    }
  }
}

module.exports = GroupExperimentalUnitService
