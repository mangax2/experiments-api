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
    return this.securityService.permissionsCheck(experimentId, context, tx).then(() => {
      const error = this.validateGroups(groupAndUnitDetails)
      if (error) {
        throw AppError.badRequest(error)
      }
      return this.groupService.deleteGroupsForExperimentId(experimentId, tx)
        .then(() => this.recursiveBatchCreate(experimentId, groupAndUnitDetails, context, tx)
          .then(() => AppUtil.createCompositePostResponse()))
    })
  }

  recursiveBatchCreate(experimentId, groupAndUnitDetails, context, tx) {
    const groups = _.map(groupAndUnitDetails, (gU) => {
      gU.experimentId = experimentId
      return _.omit(gU, ['groupValues', 'units', 'childGroups'])
    })

    return this.groupService.batchCreateGroups(groups, context, tx)
      .then(groupResp =>
        this.createGroupValuesUnitsAndChildGroups(
          experimentId,
          groupResp,
          groupAndUnitDetails,
          context,
          tx,
        ),
      )
  }

  createGroupValuesUnitsAndChildGroups(
    experimentId, groupResponse, groupAndUnitDetails, context, tx) {
    const retVal = this.getUnitsAndGroupValues(groupResponse, groupAndUnitDetails)
    const promises = []
    if (retVal.groupValues.length > 0) {
      promises.push(this.groupValueService.batchCreateGroupValues(retVal.groupValues, context, tx))
    }
    if (retVal.units.length > 0) {
      promises.push(this.createExperimentalUnits(experimentId, retVal.units, context, tx))
    }
    if (retVal.childGroups.length > 0) {
      promises.push(this.recursiveBatchCreate(experimentId, retVal.childGroups, context, tx))
    }
    return Promise.all(promises)
  }

  getUnitsAndGroupValues(groupResp, groupAndUnitDetails) {
    const groupIds = _.map(groupResp, 'id')
    const updatedGroupAndUnitDetails = this.assignGroupIdToGroupValuesAndUnits(
      groupAndUnitDetails,
      groupIds,
    )
    const units = _.compact(_.flatMap(updatedGroupAndUnitDetails, 'units'))
    const groupValues = _.compact(_.flatMap(updatedGroupAndUnitDetails, 'groupValues'))
    const childGroups = _.compact(_.flatMap(updatedGroupAndUnitDetails, 'childGroups'))
    return { units, groupValues, childGroups }
  }

  createExperimentalUnits(experimentId, units, context, tx) {
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
    return this.groupService.getGroupsByExperimentId(experimentId, tx).then((groups) => {
      const groupIds = _.map(groups, 'id')
      if (groupIds.length > 0) {
        return Promise.all([
          this.groupValueService.batchGetGroupValuesByGroupIdsNoValidate(groupIds, tx),
          this.experimentalUnitService.batchGetExperimentalUnitsByGroupIdsNoValidate(groupIds, tx)],
        ).then((groupValuesAndUnits) => {
          const groupValuesGroupByGroupId = _.groupBy(groupValuesAndUnits[0], d => d.group_id)
          const unitsGroupByGroupId = _.groupBy(groupValuesAndUnits[1], u => u.group_id)
          return _.map(groups, (group) => {
            group.groupValues = groupValuesGroupByGroupId[group.id]
            group.units = unitsGroupByGroupId[group.id]
            return group
          })
        })
      }
      return []
    })
  }
}

module.exports = GroupExperimentalUnitCompositeService
