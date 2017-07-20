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

class GroupExperimentalUnitCompositeService {

  constructor() {
    this.groupService = new GroupService()
    this.groupValueService = new GroupValueService()
    this.experimentalUnitService = new ExperimentalUnitService()
    this.designSpecificationDetailService = new DesignSpecificationDetailService()
    this.securityService = new SecurityService()
  }

  @Transactional('saveDesignSpecsAndGroupUnitDetails')
  saveDesignSpecsAndGroupUnitDetails(experimentId, designSpecsAndGroupAndUnitDetails, context, tx) {
    if (designSpecsAndGroupAndUnitDetails) {
      const designSpecifications = designSpecsAndGroupAndUnitDetails.designSpecifications
      const groupAndUnitDetails = designSpecsAndGroupAndUnitDetails.groupAndUnitDetails
      return Promise.all([
        this.saveGroupAndUnitDetails(experimentId, groupAndUnitDetails, context, tx),
        this.designSpecificationDetailService.manageAllDesignSpecificationDetails(
          designSpecifications, experimentId, context, tx,
        ),
      ]).then(() => AppUtil.createCompositePostResponse())
    }

    throw AppError.badRequest('Design Specifications and Group-Experimental-Units object must be' +
      ' defined')
  }

  @Transactional('saveGroupAndUnitDetails')
  saveGroupAndUnitDetails(experimentId, groupAndUnitDetails, context, tx) {
    const permissionsCheckPromise = this.securityService.permissionsCheck(experimentId, context, tx)
      .then(() => {
        const error = this.validateGroups(groupAndUnitDetails)
        if (error) {
          throw AppError.badRequest(error)
        }
      })
    const existingGroupTreePromise = this.getGroupTree(experimentId, tx)
    return Promise.all([existingGroupTreePromise, permissionsCheckPromise]).then((results) => {
      const oldGroupsAndUnits = results[0]

      const comparisonResults = this.compareGroupTrees(groupAndUnitDetails, oldGroupsAndUnits)
      return this.recursiveBatchCreate(experimentId, groupAndUnitDetails, context, tx)
        .then(() => this.createGroupValues(comparisonResults.groups.adds, context, tx))
        .then(() => this.createExperimentalUnits(experimentId, comparisonResults.units.adds,
          context, tx))
        .then(() => this.batchUpdateExperimentalUnits(comparisonResults.units.updates, context, tx))
        .then(() => this.batchDeleteExperimentalUnits(comparisonResults.units.deletes, tx))
        .then(() => this.batchDeleteGroups(comparisonResults.groups.deletes, tx))
        .then(() => AppUtil.createCompositePostResponse())
    })
  }

  createGroupValues = (groupAdds, context, tx) => (groupAdds.length > 0
    ? this.groupValueService.batchCreateGroupValues(_.flatMap(groupAdds, g => g.groupValues),
        context, tx)
    : Promise.resolve())

  batchUpdateExperimentalUnits = (unitUpdates, context, tx) => (unitUpdates.length > 0
    ? this.experimentalUnitService.batchUpdateExperimentalUnits(unitUpdates, context, tx)
    : Promise.resolve())

  batchDeleteExperimentalUnits = (unitDeletes, tx) => (unitDeletes.length > 0
    ? this.experimentalUnitService.batchDeleteExperimentalUnits(_.map(unitDeletes, 'id'), tx)
    : Promise.resolve())

  batchDeleteGroups = (groupDeletes, tx) => (groupDeletes.length > 0
    ? this.groupService.batchDeleteGroups(_.map(groupDeletes, 'id'), tx)
    : Promise.resolve())

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

  createGroupValuesUnitsAndChildGroups(
    experimentId, groupResponse, groupAndUnitDetails, context, tx) {
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

  createExperimentalUnits(experimentId, units, context, tx) {
    if (units.length === 0) {
      return Promise.resolve()
    }
    const treatmentIds = _.uniq(_.map(units, 'treatmentId'))
    return db.treatment.getDistinctExperimentIds(treatmentIds, tx).then((experimentIdsResp) => {
      const experimentIds = _.compact(_.map(experimentIdsResp, 'experiment_id'))
      if (experimentIds.length > 1 || Number(experimentIds[0]) !== Number(experimentId)) {
        throw AppError.badRequest('Treatments not associated with same experiment')
      } else {
        return this.experimentalUnitService.batchCreateExperimentalUnits(units, context, tx)
      }
    })
  }

  validateGroups(groups) {
    let error
    _.forEach(groups, (grp) => {
      if (!error) {
        error = this.validateGroup(grp)
      }
    })
    return error
  }

  validateGroup(group) {
    const units = group.units ? group.units : []
    const childGroups = group.childGroups ? group.childGroups : []
    if (units.length > 0 && childGroups.length > 0) {
      return 'Only leaf child groups should have units'
    }
    if (units.length === 0 && childGroups.length === 0) {
      return 'Each group should have at least one unit or at least one child group'
    }
    if (childGroups.length > 0) {
      return this.validateGroups(childGroups)
    }
    return undefined
  }

  assignGroupIdToGroupValuesAndUnits = (groupAndUnitDetails, groupIds) => {
    _.forEach(groupAndUnitDetails, (gU, index) => {
      _.forEach(gU.groupValues, (gV) => { gV.groupId = groupIds[index] })
      _.forEach(gU.units, (u) => { u.groupId = groupIds[index] })
      _.forEach(gU.childGroups, (cg) => { cg.parentId = groupIds[index] })
    })
    return groupAndUnitDetails
  }

  @Transactional('getGroupAndUnitDetails')
  getGroupAndUnitDetails(experimentId, tx) {
    return Promise.all([this.groupService.getGroupsByExperimentId(experimentId, tx),
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

  @Transactional('getGroupTree')
  getGroupTree(experimentId, tx) {
    return this.getGroupAndUnitDetails(experimentId, tx)
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

  compareGroupTrees = (newTree, oldTree) => {
    const newGroups = _.flatMap(newTree, g => this.assignAncestryAndLocation(g))
    const oldGroups = _.flatMap(oldTree, g => this.assignAncestryAndLocation(g))
    const hashedOldGroups = _.groupBy(oldGroups, 'ancestors')
    const newUnits = _.filter(_.flatMap(newGroups, g => g.units))
    const oldUnits = _.filter(_.flatMap(oldGroups, g => g.units))
    const hashedOldUnits = _.groupBy(oldUnits, 'hashKey')

    _.forEach(newGroups, (g) => {
      this.findMatchingEntity(g, hashedOldGroups, 'ancestors',
        group => _.forEach(group.units, (u) => { u.groupId = group.id }))
    })

    _.forEach(newUnits, (u) => {
      this.findMatchingEntity(u, hashedOldUnits, 'hashKey', (unit, entity) => {
        unit.oldGroupId = entity.group.id
        unit.setEntryId = entity.setEntryId
      })
    })
    return this.formatComparisonResults(oldGroups, newGroups, oldUnits, newUnits)
  }

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

  assignAncestryAndLocation = (group, parent) => {
    const parentAncestors = parent ? parent.ancestors : ''
    const businessKeys = _.map(group.groupValues, gv => `${gv.name}::${gv.value}`).sort().join('\t')
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

  formatComparisonResults = (oldGroups, newGroups, oldUnits, newUnits) => {
    const partitionedUnits = _.partition(newUnits, u => !u.id)

    return {
      groups: {
        adds: _.filter(newGroups, g => !g.id),
        deletes: _.filter(oldGroups, g => !g.used),
      },
      units: {
        adds: partitionedUnits[0],
        updates: _.filter(partitionedUnits[1], u => u.groupId !== u.oldGroupId),
        deletes: _.filter(oldUnits, u => !u.used),
      },
    }
  }
}

module.exports = GroupExperimentalUnitCompositeService
