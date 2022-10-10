import _ from 'lodash'
import inflector from 'json-inflector'
import Transactional from '@monsantoit/pg-transactional'
import DesignSpecificationDetailService from './DesignSpecificationDetailService'
import ExperimentalUnitService from './ExperimentalUnitService'
import SecurityService from './SecurityService'
import FactorService from './FactorService'
import ExperimentalUnitValidator from '../validations/ExperimentalUnitValidator'
import TreatmentWithBlockService from './TreatmentWithBlockService'
import TreatmentBlockService from './TreatmentBlockService'
import LocationAssociationService from './LocationAssociationService'
import { dbRead, dbWrite } from '../db/DbManager'
import AppUtil from './utility/AppUtil'
import AppError from './utility/AppError'
import AWSUtil from './utility/AWSUtil'
import HttpUtil from './utility/HttpUtil'
import OAuthUtil from './utility/OAuthUtil'
import configurator from '../configs/configurator'
import { notifyChanges, sendKafkaNotification } from '../decorators/notifyChanges'

const apiUrls = configurator.get('urls')
const aws = configurator.get('aws')
const { getFullErrorCode, setErrorCode } = require('@monsantoit/error-decorator')()

const trimGroupGenerationData =
  (variables, variableLevels, treatments, combinationElements, units) => {
    const trimmingResults = {}

    const trimmedVariableLevels = _.map(variableLevels, variableLevel => _.omit(variableLevel, ['created_user_id', 'created_date', 'modified_user_id', 'modified_date']))
    const trimmedCombinations = _.map(combinationElements, comb => _.omit(comb, ['created_user_id', 'created_date', 'modified_user_id', 'modified_date', 'id']))
    trimmingResults.variables = _.map(variables, variable => _.omit(variable, ['created_user_id', 'created_date', 'modified_user_id', 'modified_date','treatmentVariableLevels']))
    trimmingResults.treatments = _.map(treatments, treatment => _.omit(treatment, ['created_user_id', 'created_date', 'modified_user_id', 'modified_date', 'notes', 'treatment_number']))
    trimmingResults.units = _.map(units, unit => _.omit(unit, ['created_user_id', 'created_date', 'modified_user_id', 'modified_date']))

    const variableLevelsMap = _.groupBy(trimmedVariableLevels, 'factor_id')
    const combinationElementsMap = _.groupBy(trimmedCombinations, 'treatment_id')

    _.forEach(trimmingResults.variables, (variable) => {
      variable.levels = variableLevelsMap[variable.id]
      _.forEach(variable.levels, (level) => {
        level.factorName = variable.name
      })
    })

    _.forEach(trimmingResults.treatments, (treatment) => {
      treatment.combinationElements = combinationElementsMap[treatment.id]
    })

    _.forEach(trimmedVariableLevels, (level) => {
      const levelItems = _.get(level, 'value.items') || []
      level.items = levelItems.length === 1 ? levelItems[0] : levelItems
      delete level.value
      delete level.factorName
    })

    return trimmingResults
  }

// Error Codes 1FXXXX
class GroupExperimentalUnitService {
  constructor() {
    this.experimentalUnitService = new ExperimentalUnitService()
    this.treatmentWithBlockService = new TreatmentWithBlockService()
    this.designSpecificationDetailService = new DesignSpecificationDetailService()
    this.securityService = new SecurityService()
    this.factorService = new FactorService()
    this.unitValidator = new ExperimentalUnitValidator()
    this.locationAssociationService = new LocationAssociationService()
    this.treatmentBlockService = new TreatmentBlockService()
  }

  @setErrorCode('1F5000')
  batchDeleteExperimentalUnits = (unitDeletes, tx) => {
    if (unitDeletes.length === 0) {
      return Promise.resolve()
    }
    return dbWrite.unit.batchRemove(_.map(unitDeletes, 'id'), tx)
  }

  @setErrorCode('1FA000')
  createExperimentalUnits = (experimentId, units, context, tx) => {
    if (units.length === 0) {
      return Promise.resolve()
    }
    return dbWrite.unit.batchCreate(units, context, tx)
  }

  @setErrorCode('1FM000')
  @Transactional('resetSet')
  resetSet = (setId, context, tx) =>
    this.verifySetAndGetDetails(setId, context).then(({
      experimentId, location, numberOfReps, blockId,
    }) =>
      dbRead.treatmentBlock.findByBlockId(blockId).then((treatmentBlocks) => {
        const units = this.createUnits(location, treatmentBlocks, numberOfReps)

        return this.saveUnitsBySetId(setId, experimentId, units, context, tx)
          .then(() =>
            this.getSetEntriesFromSet(setId, numberOfReps, treatmentBlocks.length, context))
          .then((result) => {
            const treatmentBlockIds = _.map(treatmentBlocks, 'id')
            return dbRead.unit.batchFindAllByLocationAndTreatmentBlocks(location, treatmentBlockIds)
              .then((unitsInDB) => {
                const setEntryIds = _.map(result.body.entries, 'entryId')
                _.forEach(unitsInDB, (unit, index) => {
                  unit.setEntryId = setEntryIds[index]
                })
                const unitsFromDBCamlized = _.map(unitsInDB, u => inflector.transform(u, 'camelizeLower'))
                return this.experimentalUnitService.batchPartialUpdateExperimentalUnits(
                  unitsFromDBCamlized, context, tx)
                  .then(sendKafkaNotification('update', experimentId))
              })
          })
      }))

  @setErrorCode('1Fd000')
  getSetEntriesFromSet = (setId, numberOfReps, treatmentLength, context) =>
    OAuthUtil.getAuthorizationHeaders().then((header) => {
      header.push({ headerName: 'calling-user', headerValue: context.userId })
      return HttpUtil.getWithRetry(`${apiUrls.setsAPIUrl}/sets/${setId}?entries=true`, header)
        .then((originalSet) => {
          const originals = []
          _.forEach(originalSet.body.entries, (entry) => {
            originals.push({ entryId: entry.entryId, deleted: true })
          })

          const originalsDeletePromise = originals.length > 0
            ? HttpUtil.patch(`${apiUrls.setsAPIUrl}/sets/${setId}`, header, { entries: originals })
            : Promise.resolve()

          const entries = []
          while (entries.length < numberOfReps * treatmentLength) {
            entries.push({})
          }
          return originalsDeletePromise
            .then(() => HttpUtil.patch(`${apiUrls.setsAPIUrl}/sets/${setId}`, header, {
              entries,
              layout: null,
            }))
        })
    }).catch((err) => {
      console.error(`[[${context.requestId}]] An error occurred while communicating with the sets service`, err.response.error)
      throw AppError.internalServerError('An error occurred while communicating with the sets service.', undefined, getFullErrorCode('1Fd001'))
    })

  @setErrorCode('1FK000')
  verifySetAndGetDetails = (setId, context) =>
    this.locationAssociationService.getBySetId(setId).then((locAssociation) => {
      if (!locAssociation) {
        console.error(`[[${context.requestId}]] No set found for id ${setId}.`)
        throw AppError.notFound(`No set found for id ${setId}`, undefined, getFullErrorCode('1FK001'))
      }
      const experimentId = locAssociation.experiment_id
      const designSpecPromise = dbRead.designSpecificationDetail.findAllByExperimentId(experimentId)
      const refDesignSpecPromise = dbRead.refDesignSpecification.all()

      return Promise.all([designSpecPromise, refDesignSpecPromise])
        .then(([designSpecs, refDesignSpecs]) => {
          const repsRefDesignSpec = _.find(refDesignSpecs, refDesignSpec => refDesignSpec.name === 'Reps')
          const minRepRefDesignSpec = _.find(refDesignSpecs, refDesignSpec => refDesignSpec.name === 'Min Rep')
          const repDesignSpecDetail =
            _.find(designSpecs, sd => sd.ref_design_spec_id === minRepRefDesignSpec.id)
              || _.find(designSpecs, sd => sd.ref_design_spec_id === repsRefDesignSpec.id)

          if (!repDesignSpecDetail) {
            console.error(`[[${context.requestId}]] The specified set (id ${setId}) does not have a minimum number of reps and cannot be reset.`)
            throw AppError.badRequest(`The specified set (id ${setId}) does not have a minimum number of reps and cannot be reset.`,
              undefined, getFullErrorCode('1FK002'))
          }

          const numberOfReps = Number(repDesignSpecDetail.value)

          return {
            experimentId,
            location: locAssociation.location,
            numberOfReps,
            blockId: locAssociation.block_id,
          }
        })
    })

  @setErrorCode('1FN000')
  createUnits = (location, treatmentBlocks, numberOfReps) =>
    _.flatMap(_.range(numberOfReps), repl =>
      _.map(treatmentBlocks, treatmentBlock => ({
        location,
        rep: repl + 1,
        treatmentBlockId: treatmentBlock.id,
      })))

  @setErrorCode('1FO000')
  getGroupsAndUnits = experimentId =>
    Promise.all([
      dbRead.factor.findByExperimentId(experimentId),
      dbRead.factorLevel.findByExperimentId(experimentId),
      dbRead.designSpecificationDetail.findAllByExperimentId(experimentId),
      dbRead.refDesignSpecification.all(),
      dbRead.combinationElement.findAllByExperimentId(experimentId),
      dbRead.experiments.findExperimentOrTemplate(experimentId),
      this.treatmentWithBlockService.getTreatmentsByExperimentId(experimentId),
      dbRead.unit.findAllByExperimentId(experimentId),
      this.locationAssociationService.getByExperimentId(experimentId),
    ]).then((
      [
        variables,
        variableLevels,
        designSpecs,
        refDesignSpecs,
        combinationElements,
        experiment,
        treatments,
        units,
        setLocAssociations,
      ],
    ) => {
      const trimmed = trimGroupGenerationData(variables, variableLevels, treatments,
        combinationElements, units)

      const groupPromises = _.flatMap(_.groupBy(trimmed.units, 'location'), locUnit => _.map(_.groupBy(locUnit, 'block'), (u) => {
        const treatmentsByBlock = _.filter(trimmed.treatments,
          t => t.block === u[0].block || t.in_all_blocks)

        const body = JSON.stringify(inflector.transform({
          experimentId,
          randomizationStrategyCode: experiment.randomization_strategy_code,
          variables: trimmed.variables,
          designSpecs,
          refDesignSpecs,
          treatments: treatmentsByBlock,
          units: u,
          setLocAssociations,
        }, 'camelizeLower'))

        // return AWSUtil.callLambdaLocal(body)
        // return AWSUtil.callLambda('cosmos-experiments-test-lambda', body)
        return AWSUtil.callLambda(aws.lambdaName, body)
      }))

      return Promise.all(groupPromises)
        .then(data => _.map(data, (d) => {
          const response = JSON.parse(d.Payload)
          return response.locationGroups[0]
        }))
        .catch((err) => {
          console.error(err)
          return Promise.reject(AppError.internalServerError('An error occurred while generating groups.', undefined, getFullErrorCode('1FO001')))
        })
    })

  @setErrorCode('1FC000')
  getGroupsAndUnitsForSet = setId =>
    Promise.all([
      this.treatmentWithBlockService.getTreatmentsByBySetIds([setId]),
      this.experimentalUnitService.getExperimentalUnitsBySetIds([setId]),
      this.locationAssociationService.getBySetId(setId),
    ]).then(([
      treatments,
      units,
      setLocAssociation,
    ]) => Promise.all([
      dbRead.factor.findByExperimentId(setLocAssociation.experiment_id),
      dbRead.factorLevel.findByExperimentId(setLocAssociation.experiment_id),
      dbRead.designSpecificationDetail.findAllByExperimentId(setLocAssociation.experiment_id),
      dbRead.refDesignSpecification.all(),
      dbRead.combinationElement.batchFindAllByTreatmentIds(_.map(treatments, 'id')),
      dbRead.experiments.findExperimentOrTemplate(setLocAssociation.experiment_id),
    ]).then((
      [
        variables,
        variableLevels,
        designSpecs,
        refDesignSpecs,
        combinationElements,
        experiment,
      ],
    ) => {
      const trimmed = trimGroupGenerationData(variables, variableLevels, treatments,
        _.flatMap(combinationElements), units)

      const body = JSON.stringify(inflector.transform({
        experimentId: setLocAssociation.experiment_id,
        randomizationStrategyCode: experiment.randomization_strategy_code,
        variables: trimmed.variables,
        designSpecs,
        refDesignSpecs,
        treatments: trimmed.treatments,
        units: trimmed.units,
        setLocAssociations: [setLocAssociation],
      }, 'camelizeLower'))

      // return AWSUtil.callLambdaLocal(body)
      // return AWSUtil.callLambda('cosmos-experiments-test-lambda', body)
      return AWSUtil.callLambda(aws.lambdaName, body)
        .then((data) => {
          const response = JSON.parse(data.Payload)
          return [response.locationGroups[0]]
        })
        .catch((err) => {
          console.error(err)
          return Promise.reject(AppError.internalServerError('An error occurred while generating groups.', undefined, getFullErrorCode('1FC001')))
        })
    }))

  @setErrorCode('1FP000')
  getGroupsAndUnitsByExperimentIds = experimentIds =>
    Promise.all(_.map(experimentIds,
      experimentId => this.getGroupsAndUnits(experimentId)
        .catch((err) => {
          console.error(err)
          return []
        }),
    ))

  @setErrorCode('1FD000')
  getGroupsAndUnitsBySetIds = setIds => Promise.all(_.map(setIds,
    setId => this.getGroupsAndUnitsForSet(setId)
      .catch((err) => {
        console.error(err)
        return []
      }),
  ))

  @setErrorCode('1FQ000')
  getSetInformationBySetId = setId => this.locationAssociationService.getBySetId(setId)
    .then((setAssociation) => {
      if (!setAssociation) return {}
      const inflectedSetAssociation = inflector.transform(setAssociation, 'camelizeLower')
      return this.formatSetResponse(inflectedSetAssociation)
    })
    .catch(() => ({}))

  @setErrorCode('1FE000')
  getSetInformationBySetIds = setIds => Promise.all(_.map(setIds,
    setId => this.getSetInformationBySetId(setId)
      .catch((err) => {
        console.error(err)
        return []
      }),
  ))

  @setErrorCode('1FR000')
  formatSetResponse = ({
    setId, experimentId, location, block, blockId,
  }) => ({
    groupId: `${experimentId}.${location}.${_.isNil(block) ? '' : block}`,
    experimentId,
    refGroupTypeId: 1,
    setId,
    block,
    blockId,
    location,
    groupValues: [{
      id: 1,
      name: 'locationNumber',
      value: location,
      treatmentVariableLevelId: null,
      groupId: `${experimentId}.${location}.${_.isNil(block) ? '' : block}`,
    }],
  })

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
      return this.unitValidator.validate(units, 'POST')
        .then(() => Promise.all([
          dbRead.locationAssociation.findNumberOfLocationsAssociatedWithSets(experimentId),
          this.treatmentBlockService.getTreatmentBlocksByExperimentId(experimentId),
        ]))
        .then(([locations, treatmentBlocks]) => {
          if (units && (numberOfLocations < locations.max)) {
            throw AppError.badRequest('Cannot remove locations from an experiment that are' +
                ' linked to sets', undefined, getFullErrorCode('1FV002'))
          }

          _.forEach(units, (unit) => {
            unit.block = _.toString(unit.block) || null
          })

          const unitsWithTBs =
            this.addTreatmentBlocksToUnits(units, treatmentBlocks)
          this.validateUnitsTBs(unitsWithTBs)

          return tx.batch([
            this.saveUnitsByExperimentId(experimentId, unitsWithTBs, isTemplate, context, tx),
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

  addTreatmentBlocksToUnits = (units, treatmentBlocks) => _.map(units, (unit) => {
    const treatmentBlockId = this.findTreatmentBlockId(unit, treatmentBlocks)
    return ({ ...unit, treatmentBlockId })
  })

  findTreatmentBlockId = (unit, treatmentBlocks) => {
    const treatmentBlock = _.find(treatmentBlocks,
      tb => tb.treatment_id === unit.treatmentId && tb.name === unit.block)
    return treatmentBlock ? treatmentBlock.id : null
  }

  validateUnitsTBs = (unitWithTBs) => {
    const unitsWithInvalidTreatmentBlock = _.filter(unitWithTBs, unit => !unit.treatmentBlockId)
    if (unitsWithInvalidTreatmentBlock.length > 0) {
      throw AppError.badRequest(`${unitsWithInvalidTreatmentBlock.length} units have invalid treatment block values.`, undefined, getFullErrorCode('1FV003'))
    }
  }

  @setErrorCode('1FW000')
  @Transactional('saveUnitsByExperimentId')
  saveUnitsByExperimentId = (experimentId, units, isTemplate, context, tx) =>
    this.securityService.permissionsCheck(experimentId, context, isTemplate)
      .then(() => this.compareWithExistingUnitsByExperiment(experimentId, units)
        .then(comparisonResults =>
          this.saveComparedUnits(experimentId, comparisonResults, context, tx)),
      )

  @setErrorCode('1FX000')
  saveUnitsBySetId = (setId, experimentId, units, context, tx) =>
    this.compareWithExistingUnitsBySetId(setId, units)
      .then(comparisonResults =>
        this.saveComparedUnits(experimentId, comparisonResults, context, tx))

  @setErrorCode('1FY000')
  saveComparedUnits = (experimentId, comparisonUnits, context, tx) => tx.batch([
    this.createExperimentalUnits(experimentId, comparisonUnits.adds, context, tx),
    this.batchDeleteExperimentalUnits(comparisonUnits.deletes, tx),
  ])

  @setErrorCode('1FZ000')
  compareWithExistingUnitsByExperiment = (experimentId, newUnits) =>
    this.experimentalUnitService.getExperimentalUnitsByExperimentIdNoValidate(experimentId)
      .then(existingUnits => this.compareWithExistingUnits(existingUnits, newUnits))

  @setErrorCode('1Fa000')
  compareWithExistingUnitsBySetId = (setId, newUnits) =>
    dbRead.unit.batchFindAllBySetId(setId, true)
      .then(existingUnits => this.compareWithExistingUnits(existingUnits, newUnits))

  @setErrorCode('1Fb000')
  compareWithExistingUnits = (existingUnits, newUnits) => {
    const unitsToDeletesFromDB = _.compact(_.map(existingUnits, (eu) => {
      const matchingUnit = _.find(newUnits,
        nu => (eu.treatment_block_id || eu.treatmentBlockId) === nu.treatmentBlockId &&
          eu.rep === nu.rep && eu.location === nu.location && !nu.matched)
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
