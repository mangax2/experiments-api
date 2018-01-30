import log4js from 'log4js'
import _ from 'lodash'
import Transactional from '../decorators/transactional'
import DesignSpecificationDetailService from './DesignSpecificationDetailService'
import GroupService from './GroupService'
import GroupValueService from './GroupValueService'
import ExperimentalUnitService from './ExperimentalUnitService'
import SecurityService from './SecurityService'

import db from '../db/DbManager'
import AppUtil from './utility/AppUtil'
import AppError from '../services/utility/AppError'
import setErrorDecorator from '../decorators/setErrorDecorator'
import HttpUtil from '../services/utility/HttpUtil'
import PingUtil from '../services/utility/PingUtil'
import cfServices from '../services/utility/ServiceConfig'

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
  }

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
            _.forEach(comparisonResults.units.adds, (unit, index) => { unit.id = unitIds[index] })
          }),
        this.batchUpdateGroups(comparisonResults.groups.updates, context, tx),
        this.batchUpdateExperimentalUnits(comparisonResults.units.updates, context, tx),
        this.batchDeleteExperimentalUnits(comparisonResults.units.deletes, context, tx)]))
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
  batchDeleteExperimentalUnits = (unitDeletes, context, tx) => (unitDeletes.length > 0
    ? this.experimentalUnitService.batchDeleteExperimentalUnits(_.map(unitDeletes, 'id'), context, tx)
    : Promise.resolve())

  @setErrorCode('1F6000')
  batchUpdateGroups = (groupUpdates, context, tx) => (groupUpdates.length > 0
    ? this.groupService.batchUpdateGroupsNoValidate(groupUpdates, context, tx)
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

  @setErrorCode('1FE000')
  @Transactional('getGroupAndUnitDetails')
  getGroupAndUnitDetails(experimentId, isTemplate, context, tx) {
    return Promise.all([this.groupService.getGroupsByExperimentId(experimentId, isTemplate,
      context, tx),
    this.groupValueService.batchGetGroupValuesByExperimentId(experimentId, tx),
    this.experimentalUnitService.getExperimentalUnitsByExperimentIdNoValidate(experimentId, tx)])
      .then((groupValuesAndUnits) => {
        const groups = groupValuesAndUnits[0]
        const groupValuesGroupByGroupId = _.groupBy(groupValuesAndUnits[1], d => d.group_id)
        const unitsGroupByGroupId = _.groupBy(groupValuesAndUnits[2], u => u.group_id)
        return _.map(groups, (group) => {
          group.groupValues = groupValuesGroupByGroupId[group.id]
          group.units = unitsGroupByGroupId[group.id]
          return group
        })
      })
  }

  @setErrorCode('1FF000')
  @Transactional('getGroupTree')
  getGroupTree(experimentId, isTemplate, context, tx) {
    return this.getGroupAndUnitDetails(experimentId, isTemplate, context, tx)
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
        (group, matchingGroup) => {
          group.oldRefRandomizationStrategyId = matchingGroup.ref_randomization_strategy_id
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
        updates: _.filter(partitionedGroups[1],
          g => g.refRandomizationStrategyId !== g.oldRefRandomizationStrategyId),
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
        experimentId, setGroup, numberOfReps, repGroupTypeId,
      } = results
      return db.treatment.findAllByExperimentId(experimentId, tx).then((treatments) => {
        const newGroupsAndUnits = this.createRcbGroupStructure(setId, setGroup, numberOfReps,
          treatments, repGroupTypeId)

        return this.getGroupTree(experimentId, false, context, tx).then((experimentGroups) => {
          const oldGroupsAndUnits = [_.find(experimentGroups, group => group.set_id === setId)]
          const entries = []
          while (entries.length < numberOfReps * treatments.length) {
            entries.push({})
          }

          return this.persistGroupUnitChanges(newGroupsAndUnits, oldGroupsAndUnits,
            experimentId, context, tx)
            .then(() => PingUtil.getMonsantoHeader()).then(header =>
              HttpUtil.getWithRetry(`${cfServices.experimentsExternalAPIUrls.value.setsAPIUrl}/sets/${setId}?entries=true`, header)
                .then(originalSet => Promise.all(_.map(originalSet.entries, entry => HttpUtil.delete(`${cfServices.experimentsExternalAPIUrls.value.setsAPIUrl}/entries/${entry.entryId}`, header))))
                .then(() => HttpUtil.patch(`${cfServices.experimentsExternalAPIUrls.value.setsAPIUrl}/sets/${setId}`, header, { entries }))
                .then((result) => {
                  const units = _.flatMap(newGroupsAndUnits[0].childGroups, 'units')
                  const setEntryIds = _.map(result.entries, 'entryId')
                  _.forEach(units, (unit, index) => { unit.setEntryId = setEntryIds[index] })
                  return this.experimentalUnitService.batchPartialUpdateExperimentalUnits(units,
                    context, tx)
                }))
            .catch((err) => {
              logger.error(`[[${context.requestId}]] An error occurred while communicating with the sets service`, err)
              throw AppError.internalServerError('An error occurred while communicating with the sets service.', undefined, getFullErrorCode('1FM001'))
            })
        })
      })
    })

  @setErrorCode('1FK000')
  verifySetAndGetDetails = (setId, context, tx) =>
    db.groups.findGroupBySetId(setId, tx).then((setGroup) => {
      if (!setGroup) {
        logger.error(`[[${context.requestId}]] No set found for id ${setId}.`)
        throw AppError.notFound(`No set found for id ${setId}`, undefined, getFullErrorCode('1FK001'))
      }
      const experimentId = setGroup.experiment_id
      const factorsPromise = db.factor.findByExperimentId(experimentId, tx)
      const designSpecPromise = db.designSpecificationDetail.findAllByExperimentId(experimentId, tx)
      const refDesignSpecPromise = db.refDesignSpecification.all()
      const groupTypePromise = db.groupType.all()

      return Promise.all([factorsPromise, designSpecPromise, refDesignSpecPromise,
        groupTypePromise])
        .then((results) => {
          const repsRefDesignSpec = _.find(results[2], refDesignSpec => refDesignSpec.name === 'Reps')
          const minRepRefDesignSpec = _.find(results[2], refDesignSpec => refDesignSpec.name === 'Min Rep')
          const repDesignSpecDetail =
            _.find(results[1], sd => sd.ref_design_spec_id === minRepRefDesignSpec.id)
              || _.find(results[1], sd => sd.ref_design_spec_id === repsRefDesignSpec.id)

          if (_.find(results[0], factor => factor.tier)) {
            logger.error(`[[${context.requestId}]] The specified set (id ${setId}) has tiering set up and cannot be reset.`)
            throw AppError.badRequest(`The specified set (id ${setId}) has tiering set up and cannot be reset.`,
              undefined, getFullErrorCode('1FK002'))
          }
          if (!repDesignSpecDetail) {
            logger.error(`[[${context.requestId}]] The specified set (id ${setId}) does not have a minimum number of reps and cannot be reset.`)
            throw AppError.badRequest(`The specified set (id ${setId}) does not have a minimum number of reps and cannot be reset.`,
              undefined, getFullErrorCode('1FK003'))
          }

          const repGroupType = _.find(results[3], groupType => groupType.type === 'Rep')
          const numberOfReps = Number(repDesignSpecDetail.value)

          return {
            experimentId,
            setGroup,
            numberOfReps,
            repGroupTypeId: repGroupType.id,
          }
        })
    })

  @setErrorCode('1FN000')
  createRcbGroupStructure = (setId, setGroup, numOfReps, treatments, repTypeId) => {
    const newGroupsAndUnits = [{
      refRandomizationStrategyId: setGroup.ref_randomization_strategy_id,
      refGroupTypeId: setGroup.ref_group_type_id,
      groupValues: [{
        name: 'locationNumber',
        value: setGroup.location_number,
      }],
      setId,
      childGroups: [],
    }]
    let currentRepNumber = 0
    const createUnit = treatment => ({
      treatmentId: treatment.id,
      rep: currentRepNumber,
    })
    while (currentRepNumber < numOfReps) {
      currentRepNumber += 1
      newGroupsAndUnits[0].childGroups.push({
        refRandomizationStrategyId: setGroup.ref_randomization_strategy_id,
        refGroupTypeId: repTypeId,
        groupValues: [{
          name: 'repNumber',
          value: currentRepNumber,
        }],
        units: _.map(treatments, createUnit),
      })
    }

    return newGroupsAndUnits
  }
}

module.exports = GroupExperimentalUnitCompositeService
