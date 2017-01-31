import Transactional from "../decorators/transactional";
import GroupService from "./GroupService";
import GroupValueService from "./GroupValueService";
import ExperimentalUnitService from "./ExperimentalUnitService";
import _ from "lodash";
import db from "../db/DbManager";
import AppUtil from "./utility/AppUtil";

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
           return  Promise.reject(error)
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
            const _retVal = this._getUnitsAndGroupValues(groupResp, groupAndUnitDetails)
            const promises = []
            if (_retVal.groupValues.length > 0) {
                promises.push(this._groupValueService.batchCreateGroupValues(_retVal.groupValues, context, tx))
            }
            if (_retVal.units.length > 0) {
                promises.push(this._createExperimentalUnits(_retVal.units, context, experimentId, tx))
            }
            if (_retVal.childGroups.length > 0) {
                promises.push(this._recursiveBatchCreate(experimentId,_retVal.childGroups,context,tx))
            }
            return Promise.all(promises)
        })
    }

    _getUnitsAndGroupValues(groupResp, groupAndUnitDetails) {
        const groupIds = _.map(groupResp, "id")
        const updatedGroupAndUnitDetails = this.assignGroupIdToGroupValuesAndUnits(groupAndUnitDetails, groupIds)
        const units = _.compact(_.flatMap(updatedGroupAndUnitDetails, "units"))
        const groupValues = _.compact(_.flatMap(updatedGroupAndUnitDetails, "groupValues"))
        const childGroups = _.compact(_.flatMap(updatedGroupAndUnitDetails, "childGroups"))
        return {units: units, groupValues: groupValues, childGroups: childGroups}
    }

    _createExperimentalUnits(units, context, experimentId, tx) {
        const treatmentIds = _.uniq(_.map(units, "treatmentId"))
        return db.treatment.getDistinctExperimentIds(treatmentIds, tx).then((experimentIdsResp)=> {
            const experimentIds = _.compact(_.map(experimentIdsResp, "experiment_id"))

            if (experimentIds.length > 1 || experimentIds[0] != experimentId) {
                return Promise.reject("Treatments not associated with same experiment")
            } else {
                return this._experimentalUnitService.batchCreateExperimentalUnits(units, context, tx)
            }

        })
    }

    _validateGroups(groups) {
        let error=undefined
        _.forEach(groups, (grp)=> {
            if(!error) {
                const units = grp['units']?grp['units']:[]
                const childGroups = grp['childGroups']?grp['childGroups']:[]
                if (units.length > 0 && childGroups.length > 0) {
                    error = "Only leaf childGroups should have units"
                }
                if (units.length == 0 && childGroups.length == 0) {
                    error = "Each group should have at least one Unit or at least one ChildGroup"
                }
                if (childGroups.length > 0) {
                    error = this._validateGroups(childGroups)
                }
            }
        })
        return error
    }



assignGroupIdToGroupValuesAndUnits(groupAndUnitDetails, groupIds)
{
    _.forEach(groupAndUnitDetails, (gU, index)=> {
        _.forEach(gU["groupValues"], (gV)=> gV.groupId = groupIds[index])
        _.forEach(gU["units"], (u)=> u.groupId = groupIds[index])
        _.forEach(gU["childGroups"], (cg)=> cg.parentId = groupIds[index])
    })
    return groupAndUnitDetails
}

@Transactional("getGroupAndUnitDetails")
getGroupAndUnitDetails(experimentId, tx)
{
    return this._groupService.getGroupsByExperimentId(experimentId, tx).then((groups)=> {
        const groupIds = _.map(groups, "id")
        if (groupIds.length > 0) {
            return Promise.all([
                this._groupValueService.batchGetGroupValuesByGroupIds(groupIds, tx),
                this._experimentalUnitService.batchGetExperimentalUnitsByGroupIds(groupIds, tx)]
            ).then((groupValuesAndUnits) => {
                const groupValues = _.compact(_.flatMap(groupValuesAndUnits[0]))
                const units = _.compact(_.flatMap(groupValuesAndUnits[1]))
                return _.map(groups, (group) => {
                    group["groupValues"] = _.filter(groupValues, (g) => g["group_id"] == group.id)
                    group["units"] = _.filter(units, (u) => u["group_id"] == group.id)
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