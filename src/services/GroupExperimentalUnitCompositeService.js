import Transactional from "../decorators/transactional"
import GroupService from "./GroupService"
import GroupValueService from "./GroupValueService"
import ExperimentalUnitService from "./ExperimentalUnitService"
import _ from "lodash"
import db from "../db/DbManager"
import AppUtil from "./utility/AppUtil"
import AppError from "../services/utility/AppError"

class GroupExperimentalUnitCompositeService {

    constructor() {
        this._groupService = new GroupService()
        this._groupValueService = new GroupValueService()
        this._experimentalUnitService = new ExperimentalUnitService()
    }

    @Transactional("saveGroupAndUnitDetails")
    saveGroupAndUnitDetails(experimentId, groupAndUnitDetails, context, tx) {
        const error = this._validateGroups(groupAndUnitDetails)
        if(error){
            throw  AppError.badRequest(error)
        }
        return this._groupService.deleteGroupsForExperimentId(experimentId, tx).then(()=> {
            return this._recursiveBatchCreate(experimentId,groupAndUnitDetails, context,tx).then(()=>{
                return AppUtil.createCompositePostResponse()
            })
        })
    }

    _recursiveBatchCreate(experimentId,groupAndUnitDetails, context, tx) {
        const groups = _.map(groupAndUnitDetails, (gU)=> {
            gU.experimentId = experimentId
            return _.omit(gU, ['groupValues', 'units', 'childGroups'])
        })

        return this._groupService.batchCreateGroups(groups, context, tx).then((groupResp)=> {
            return this._createGroupValuesUnitsAndChildGroups(experimentId, groupResp,groupAndUnitDetails,context,tx)
        })
    }

    _createGroupValuesUnitsAndChildGroups(experimentId, groupResponse, groupAndUnitDetails, context,tx){
        const _retVal = this._getUnitsAndGroupValues(groupResponse, groupAndUnitDetails)
        const promises = []
        if (_retVal.groupValues.length > 0) {
            promises.push(this._groupValueService.batchCreateGroupValues(_retVal.groupValues, context, tx))
        }
        if (_retVal.units.length > 0) {
            promises.push(this._createExperimentalUnits(experimentId, _retVal.units, context, tx))
        }
        if (_retVal.childGroups.length > 0) {
            promises.push(this._recursiveBatchCreate(experimentId,_retVal.childGroups,context,tx))
        }
        return Promise.all(promises)
    }

    _getUnitsAndGroupValues(groupResp, groupAndUnitDetails) {
        const groupIds = _.map(groupResp, "id")
        const updatedGroupAndUnitDetails = this.assignGroupIdToGroupValuesAndUnits(groupAndUnitDetails, groupIds)
        const units = _.compact(_.flatMap(updatedGroupAndUnitDetails, "units"))
        const groupValues = _.compact(_.flatMap(updatedGroupAndUnitDetails, "groupValues"))
        const childGroups = _.compact(_.flatMap(updatedGroupAndUnitDetails, "childGroups"))
        return {units: units, groupValues: groupValues, childGroups: childGroups}
    }

    _createExperimentalUnits(experimentId,units, context , tx) {
        const treatmentIds = _.uniq(_.map(units, "treatmentId"))
        return db.treatment.getDistinctExperimentIds(treatmentIds, tx).then((experimentIdsResp)=> {
            const experimentIds = _.compact(_.map(experimentIdsResp, "experiment_id"))
            if (experimentIds.length > 1 || experimentIds[0] != experimentId) {
                throw AppError.badRequest("Treatments not associated with same experiment")
            } else {
                return this._experimentalUnitService.batchCreateExperimentalUnits(units, context, tx)
            }
        })
    }

    _validateGroups(groups) {
        let error=undefined
        _.forEach(groups, (grp)=> {
            if(!error) {
                error = this._validateGroup(grp)
            }
        })
        return error
    }

    _validateGroup(group){
        const units = group['units'] ? group['units'] : []
        const childGroups = group['childGroups'] ? group['childGroups'] : []
        if (units.length > 0 && childGroups.length > 0) {
            return "Only leaf childGroups should have units"
        }
        if (units.length == 0 && childGroups.length == 0) {
            return "Each group should have at least one Unit or at least one ChildGroup"
        }
        if (childGroups.length > 0) {
            return this._validateGroups(childGroups)
        }
    }

    assignGroupIdToGroupValuesAndUnits(groupAndUnitDetails, groupIds) {
        _.forEach(groupAndUnitDetails, (gU, index)=> {
            _.forEach(gU["groupValues"], (gV)=> gV.groupId = groupIds[index])
            _.forEach(gU["units"], (u)=> u.groupId = groupIds[index])
            _.forEach(gU["childGroups"], (cg)=> cg.parentId = groupIds[index])
        })
        return groupAndUnitDetails
    }

    @Transactional("getGroupAndUnitDetails")
    getGroupAndUnitDetails(experimentId, tx) {
        return this._groupService.getGroupsByExperimentId(experimentId, tx).then((groups)=> {
            const groupIds = _.map(groups, "id")
            if (groupIds.length > 0) {
                return Promise.all([
                    this._groupValueService.batchGetGroupValuesByGroupIdsNoValidate(groupIds, tx),
                    this._experimentalUnitService.batchGetExperimentalUnitsByGroupIdsNoValidate(groupIds, tx)]
                ).then((groupValuesAndUnits) => {
                    const groupValuesGroupByGroupId = _.groupBy(groupValuesAndUnits[0], (d) => d.group_id)
                    const unitsGroupByGroupId = _.groupBy(groupValuesAndUnits[1], (u) => u.group_id)
                    return _.map(groups, (group) => {
                        group['groupValues'] = groupValuesGroupByGroupId[group.id]
                        group['units'] =  unitsGroupByGroupId[group.id]
                        return group
                    })
                })
            } else {
                return []
            }
        })
    }
}

module.exports = GroupExperimentalUnitCompositeService