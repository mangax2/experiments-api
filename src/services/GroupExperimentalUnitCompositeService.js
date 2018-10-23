import log4js from 'log4js'
import _ from 'lodash'
import inflector from 'json-inflector'
import Transactional from '../decorators/transactional'
import DesignSpecificationDetailService from './DesignSpecificationDetailService'
import GroupService from './GroupService'
import GroupValueService from './GroupValueService'
import ExperimentalUnitService from './ExperimentalUnitService'
import SecurityService from './SecurityService'
import FactorService from './FactorService'
import LambdaPerformanceService from './LambdaPerformanceService'

import db from '../db/DbManager'
import AppUtil from './utility/AppUtil'
import AppError from './utility/AppError'
import AWSUtil from './utility/AWSUtil'
import setErrorDecorator from '../decorators/setErrorDecorator'
import HttpUtil from './utility/HttpUtil'
import PingUtil from './utility/PingUtil'
import cfServices from './utility/ServiceConfig'
import { notifyChanges, sendKafkaNotification } from '../decorators/notifyChanges'

const { getFullErrorCode, setErrorCode } = setErrorDecorator()

const logger = log4js.getLogger('GroupExperimentalUnitCompositeService')

// Error Codes 1FXXXX
class GroupExperimentalUnitCompositeService {
  constructor() {
    this.groupService = new GroupService()
    this.groupValueService = new GroupValueService()
    this.experimentalUnitService = new ExperimentalUnitService()
    this.designSpecificationDetailService = new DesignSpecificationDetailService()
    this.securityService = new SecurityService()
    this.factorService = new FactorService()
    this.lambdaPerformanceService = new LambdaPerformanceService()
  }

  @notifyChanges('update', 0)
  @setErrorCode('1F1000')
  @Transactional('saveDesignSpecsAndGroupUnitDetails')
  saveDesignSpecsAndGroupUnitDetails(experimentId, designSpecsAndGroupAndUnitDetails, context,
    isTemplate, tx) {
    if (designSpecsAndGroupAndUnitDetails) {
      const { designSpecifications } = designSpecsAndGroupAndUnitDetails
      const { groupAndUnitDetails } = designSpecsAndGroupAndUnitDetails
      return Promise.all([
        this.saveGroupAndUnitDetails(experimentId, groupAndUnitDetails, context, isTemplate, tx),
        this.designSpecificationDetailService.manageAllDesignSpecificationDetails(
          designSpecifications, experimentId, context, isTemplate, tx,
        ),
      ]).then(() => AppUtil.createCompositePostResponse())
    }

    throw AppError.badRequest('Design Specifications and Group-Experimental-Units object must be defined', undefined, getFullErrorCode('1F1001'))
  }

  @notifyChanges('update', 0)
  @setErrorCode('1F2000')
  @Transactional('saveGroupAndUnitDetails')
  saveGroupAndUnitDetails(experimentId, groupAndUnitDetails, context, isTemplate, tx) {
    return this.securityService.permissionsCheck(experimentId, context, isTemplate, tx)
      .then(() => {
        const error = this.validateGroups(groupAndUnitDetails)
        if (error) {
          throw error
        }
        return this.getGroupTree(experimentId, isTemplate, context, tx)
          .then(oldGroupsAndUnits =>
            this.persistGroupUnitChanges(groupAndUnitDetails, oldGroupsAndUnits, experimentId,
              context, tx))
      })
  }

  @setErrorCode('1FL000')
  persistGroupUnitChanges(newGroupsAndUnits, oldGroupsAndUnits, experimentId, context, tx) {
    const comparisonResults = this.compareGroupTrees(newGroupsAndUnits, oldGroupsAndUnits)
    return this.recursiveBatchCreate(experimentId, newGroupsAndUnits, context, tx)
      .then(() => Promise.all([
        this.createGroupValues(comparisonResults.groups.adds, context, tx),
        this.createExperimentalUnits(experimentId, comparisonResults.units.adds, context, tx)
          .then((unitIds) => {
            _.forEach(comparisonResults.units.adds,
              (unit, index) => { unit.id = unitIds[index].id })
          }),
        this.batchUpdateExperimentalUnits(comparisonResults.units.updates, context, tx),
        this.batchDeleteExperimentalUnits(comparisonResults.units.deletes, tx)]))
      .then(() => this.batchDeleteGroups(comparisonResults.groups.deletes, context, tx))
      .then(() => AppUtil.createCompositePostResponse())
  }

  @setErrorCode('1F3000')
  createGroupValues = (groupAdds, context, tx) => (groupAdds.length > 0
    ? this.groupValueService.batchCreateGroupValues(_.flatMap(groupAdds, g => g.groupValues),
      context, tx)
    : Promise.resolve())

  @setErrorCode('1F4000')
  batchUpdateExperimentalUnits = (unitUpdates, context, tx) => (unitUpdates.length > 0
    ? this.experimentalUnitService.batchUpdateExperimentalUnits(unitUpdates, context, tx)
    : Promise.resolve())

  @setErrorCode('1F5000')
  batchDeleteExperimentalUnits = (unitDeletes, tx) => (unitDeletes.length > 0
    ? db.unit.batchRemove(_.map(unitDeletes, 'id'), tx)
    : Promise.resolve())

  @setErrorCode('1F7000')
  batchDeleteGroups = (groupDeletes, context, tx) => (groupDeletes.length > 0
    ? this.groupService.batchDeleteGroups(_.map(groupDeletes, 'id'), context, tx)
    : Promise.resolve())

  @setErrorCode('1F8000')
  recursiveBatchCreate(experimentId, groupAndUnitDetails, context, tx) {
    const groups = _.map(groupAndUnitDetails, (gU) => {
      gU.experimentId = Number(experimentId)
      return _.omit(gU, ['groupValues', 'units', 'childGroups'])
    })
    const groupsToCreate = _.filter(groups, g => !g.id)
    const createPromise = groupsToCreate.length > 0
      ? this.groupService.batchCreateGroups(groupsToCreate, context, tx)
      : Promise.resolve([])
    return createPromise
      .then(groupResp => _.forEach(groupsToCreate, (g, index) => { g.id = groupResp[index].id }))
      .then(() =>
        this.createGroupValuesUnitsAndChildGroups(experimentId, groups, groupAndUnitDetails,
          context, tx))
  }

  @setErrorCode('1F9000')
  createGroupValuesUnitsAndChildGroups(experimentId, groupResponse, groupAndUnitDetails,
    context, tx) {
    const updatedGroupAndUnitDetails = this.assignGroupIdToGroupValuesAndUnits(
      groupAndUnitDetails,
      _.map(groupResponse, 'id'),
    )
    const childGroups = _.compact(_.flatMap(updatedGroupAndUnitDetails, 'childGroups'))
    const promises = []
    if (childGroups.length > 0) {
      promises.push(this.recursiveBatchCreate(experimentId, childGroups, context, tx))
    }
    return Promise.all(promises)
  }

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

  @setErrorCode('1FB000')
  validateGroups(groups) {
    let error
    _.forEach(groups, (grp) => {
      if (!error) {
        error = this.validateGroup(grp)
      }
    })
    return error
  }

  @setErrorCode('1FC000')
  validateGroup(group) {
    const units = group.units ? group.units : []
    const childGroups = group.childGroups ? group.childGroups : []
    if (units.length > 0 && childGroups.length > 0) {
      return AppError.badRequest('Only leaf child groups should have units', undefined, getFullErrorCode('1FC001'))
    }
    if (units.length === 0 && childGroups.length === 0) {
      return AppError.badRequest('Each group should have at least one unit or at least one child group', undefined, getFullErrorCode('1FC002'))
    }
    if (childGroups.length > 0) {
      return this.validateGroups(childGroups)
    }
    return undefined
  }

  @setErrorCode('1FD000')
  assignGroupIdToGroupValuesAndUnits = (groupAndUnitDetails, groupIds) => {
    _.forEach(groupAndUnitDetails, (gU, index) => {
      _.forEach(gU.groupValues, (gV) => { gV.groupId = groupIds[index] })
      _.forEach(gU.units, (u) => { u.groupId = groupIds[index] })
      _.forEach(gU.childGroups, (cg) => { cg.parentId = groupIds[index] })
    })
    return groupAndUnitDetails
  }

  @setErrorCode('1FF000')
  @Transactional('getGroupTree')
  getGroupTree(experimentId, isTemplate, context, tx) {
    return this.getGroupsAndUnits(experimentId, tx)
      .then((groups) => {
        const childGroupHash = _.groupBy(groups, 'parent_id')
        _.forEach(groups, (g) => {
          const childGroups = childGroupHash[g.id]
          if (childGroups && childGroups.length > 0) {
            g.childGroups = childGroups
          }
        })

        return _.filter(groups, g => !g.parent_id)
      })
  }

  @setErrorCode('1FG000')
  compareGroupTrees = (newTree, oldTree) => {
    const newGroups = _.flatMap(newTree, g => this.assignAncestryAndLocation(g))
    const oldGroups = _.flatMap(oldTree, g => this.assignAncestryAndLocation(g))
    const hashedOldGroups = _.groupBy(oldGroups, 'ancestors')
    const newUnits = _.compact(_.flatMap(newGroups, g => g.units))
    const oldUnits = _.compact(_.flatMap(oldGroups, g => g.units))
    const hashedOldUnits = _.groupBy(oldUnits, 'hashKey')

    _.forEach(newGroups, (g) => {
      this.findMatchingEntity(g, hashedOldGroups, 'ancestors',
        (group) => {
          _.forEach(group.units, (u) => { u.groupId = group.id })
        })
    })

    _.forEach(newUnits, (u) => {
      this.findMatchingEntity(u, hashedOldUnits, 'hashKey', (unit, entity) => {
        unit.oldGroupId = entity.group.id
        unit.setEntryId = entity.setEntryId
      })
    })
    return this.formatComparisonResults(oldGroups, newGroups, oldUnits, newUnits)
  }

  @setErrorCode('1FH000')
  findMatchingEntity = (entity, hashedEntities, hashProperty, additionalLogic) => {
    const matchingEntity = _.find(hashedEntities[entity[hashProperty]], e => !e.used)
    if (matchingEntity) {
      matchingEntity.used = true
      entity.id = matchingEntity.id
      additionalLogic(entity, matchingEntity)
    } else {
      entity.id = undefined
    }
  }

  @setErrorCode('1FI000')
  assignAncestryAndLocation = (group, parent) => {
    const parentAncestors = parent ? parent.ancestors : ''
    const businessKeys = _.map(group.groupValues, (gv) => {
      if (gv.factorLevelId || gv.factor_level_id) {
        return `${gv.factorLevelId || gv.factor_level_id}`
      }
      return `${gv.name}::${gv.value}`
    }).sort().join('\t')

    group.ancestors = `${parentAncestors}\n${businessKeys}`

    if (parent === undefined) {
      group.locNumber = group.groupValues[0].value
    } else {
      group.locNumber = parent.locNumber
    }

    if (group.childGroups) {
      const descendents = _.flatMap(group.childGroups,
        cg => this.assignAncestryAndLocation(cg, group))
      descendents.push(group)
      return descendents
    }
    _.forEach(group.units, (u) => {
      u.hashKey = `${group.locNumber}|${u.rep}|${u.treatmentId || u.treatment_id}`
      u.oldGroupId = undefined
      u.group = group
      u.location = group.locNumber
    })
    return [group]
  }

  @setErrorCode('1FJ000')
  formatComparisonResults = (oldGroups, newGroups, oldUnits, newUnits) => {
    const partitionedGroups = _.partition(newGroups, g => !g.id)
    const partitionedUnits = _.partition(newUnits, u => !u.id)

    return {
      groups: {
        adds: partitionedGroups[0],
        deletes: _.filter(oldGroups, g => !g.used),
      },
      units: {
        adds: partitionedUnits[0],
        updates: _.filter(partitionedUnits[1], u => u.groupId !== u.oldGroupId),
        deletes: _.filter(oldUnits, u => !u.used),
      },
    }
  }

  @setErrorCode('1FM000')
  @Transactional('resetSet')
  resetSet = (setId, context, tx) =>
    // get group by setId
    this.verifySetAndGetDetails(setId, context, tx).then((results) => {
      const {
        experimentId, location, numberOfReps,
      } = results
      return db.treatment.findAllByExperimentId(experimentId, tx).then((treatments) => {
        const units = this.createUnits(location, treatments, numberOfReps)
        return this.saveUnitsBySetId(setId, experimentId, units, context, tx)
          .then(() => this.getSetEntriesFromSet(setId, numberOfReps, treatments.length, context))
          .then(result => db.unit.batchFindAllByExperimentIdAndLocation(experimentId, location, tx)
            .then((unitsInDB) => {
              const setEntryIds = _.map(result.body.entries, 'entryId')
              _.forEach(unitsInDB, (unit, index) => {
                unit.setEntryId = setEntryIds[index]
              })
              const unitsFromDBCamlized = _.map(unitsInDB, u => inflector.transform(u, 'camelizeLower'))
              return this.experimentalUnitService.batchPartialUpdateExperimentalUnits(
                unitsFromDBCamlized, context, tx).then(sendKafkaNotification('update', experimentId))
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
          }
        })
    })

  @setErrorCode('1FN000')
  createUnits = (location, treatments, numberOfReps) => _.flatMap(_.range(numberOfReps), repl =>
    _.map(treatments, treatment => ({
      location,
      rep: repl + 1,
      treatmentId: treatment.id,
    })))

  @setErrorCode('1FO000')
  @Transactional('getGroupsAndUnits')
  getGroupsAndUnits = (experimentId, tx) =>
    Promise.all([
      PingUtil.getMonsantoHeader().then(header =>
        HttpUtil.getWithRetry(`${cfServices.experimentsExternalAPIUrls.value.randomizationAPIUrl}/strategies`, header))
        .then(data => data.body),
      db.factor.findByExperimentId(experimentId, tx),
      db.factorLevel.findByExperimentId(experimentId, tx),
      db.designSpecificationDetail.findAllByExperimentId(experimentId, tx),
      db.refDesignSpecification.all(tx),
      db.treatment.findAllByExperimentId(experimentId, tx),
      db.combinationElement.findAllByExperimentId(experimentId, tx),
      db.unit.findAllByExperimentId(experimentId, tx),
      db.locationAssociation.findByExperimentId(experimentId, tx),
    ]).then(([
      randomizationStrategies,
      variables,
      variableLevels,
      designSpecs,
      refDesignSpecs,
      treatments,
      combinationElements,
      units,
      setLocAssociations,
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
        variables: trimmedVariables,
        designSpecs,
        refDesignSpecs,
        randomizationStrategies,
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

  @setErrorCode('1Fc000')
  @Transactional('getGroupsAndUnits')
  getGroupsByExperimentId = (experimentId, tx) => this.getGroupsAndUnits(experimentId, tx)
    .then((groupsAndUnits) => {
      _.forEach(groupsAndUnits, (gu) => {
        delete gu.units
        delete gu.groupValues
      })
      return groupsAndUnits
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
    return _.compact(_.concat(group.units, this.getChildGroupUnits(groups, group.id)))
  }

  @setErrorCode('1FT000')
  getChildGroupUnits = (groups, parentId) => {
    const children = this.getAllChildGroups(groups, parentId)
    return _.compact(_.flatMap(children, c => c.units))
  }

  @setErrorCode('1FU000')
  getAllChildGroups = (groups, parentId) => {
    const children = _.filter(groups, g => g.parentId === parentId)
    if (_.isEmpty(children)) return []

    return _.concat(children, _.flatMap(children, c => this.getAllChildGroups(groups, c.id)))
  }

  @notifyChanges('update', 0)
  @setErrorCode('1FV000')
  @Transactional('saveDesignSpecsAndUnitDetails')
  saveDesignSpecsAndUnits = (experimentId, designSpecsAndUnits, context, isTemplate, tx) => {
    if (designSpecsAndUnits) {
      const { designSpecifications, units } = designSpecsAndUnits
      const numberOfLocations = _.max(_.map(units, 'location'))
      return db.locationAssociation.findNumberOfLocationsAssociatedWithSets(experimentId, tx)
        .then((response) => {
          if (units && (numberOfLocations < response.max)) {
            throw AppError.badRequest('Cannot remove locations from an experiment that are' +
                ' linked to sets', undefined, getFullErrorCode('1FV002'))
          }
          return Promise.all([
            this.saveUnitsByExperimentId(experimentId, units, isTemplate, context, tx),
            this.designSpecificationDetailService.manageAllDesignSpecificationDetails(
              designSpecifications, experimentId, context, isTemplate, tx,
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

module.exports = GroupExperimentalUnitCompositeService
