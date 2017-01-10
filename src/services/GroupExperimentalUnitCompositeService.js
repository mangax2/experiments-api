import Transactional from "../decorators/transactional"
import GroupService from "./GroupService"
import GroupValueService from "./GroupValueService"
import ExperimentalUnitService from "./ExperimentalUnitService"
import _ from "lodash"
import db from "../db/DbManager"

class GroupExperimentalUnitCompositeService {

    constructor() {
        this._groupService = new GroupService()
        this._groupValueService = new GroupValueService()
        this._experimentalUnitService = new ExperimentalUnitService()
    }

    @Transactional("saveGroupAndUnitDetails")
    saveGroupAndUnitDetails(groupAndUnitDetails, context, tx) {
        const groups = _.map(groupAndUnitDetails, (gU)=> {
            return _.omit(gU, ['groupValues', 'units'])
        })
        const experimentId = groups[0]["experimentId"]
        return this._groupService.deleteGroupsForExperimentId(groups[0]["experimentId"], tx).then(()=> {
            return this._groupService.batchCreateGroups(groups, context, tx).then((groupResp)=> {
                const groupIds = _.map(groupResp, "id")
                const updatedGroupAndUnitDetails = this.assignGroupIdToGroupValuesAndUnits(groupAndUnitDetails, groupIds)
                const units = _.flatMap(updatedGroupAndUnitDetails, "units")
                const groupValues = _.flatMap(updatedGroupAndUnitDetails, "groupValues")
                return Promise.all([
                    this._groupValueService.batchCreateGroupValues(groupValues, context, tx),
                    this._createExperimentalUnits(units, context, experimentId, tx)])

            })
        })

    }

    _createExperimentalUnits(units, context, experimentId, tx) {
        const treatmentIds = _.uniq(_.map(units, "treatmentId"))
        return db.treatment.getDistinctExperimentIds(treatmentIds, tx).then((experimentIdsResp)=> {
            const experimentIds = _.map(experimentIdsResp, "experiment_id")
            if (experimentIds.length > 1 || experimentIds[0] != experimentId) {
                return Promise.reject("Treatments not associated with same experiment")
            } else {
                return this._experimentalUnitService.batchCreateExperimentalUnits(units, context, tx)
            }

        })
    }

    assignGroupIdToGroupValuesAndUnits(groupAndUnitDetails, groupIds) {
        _.forEach(groupAndUnitDetails, (gU, index)=> {
            _.forEach(gU["groupValues"], (gV)=> gV.groupId = groupIds[index])
            _.forEach(gU["units"], (u)=> u.groupId = groupIds[index])
        })
        return groupAndUnitDetails
    }

    @Transactional("getGroupAndUnitDetails")
    getGroupAndUnitDetails(experimentId, tx) {
        return this._groupService.getGroupsByExperimentId(experimentId, tx).then((groups)=> {
            const groupIds = _.map(groups, "id")
            return Promise.all([
                this._groupValueService.batchGetGroupValuesByGroupIds(groupIds, tx),
                this._experimentalUnitService.batchGetExperimentalUnitsByGroupIds(groupIds, tx)]
            ).then((groupValuesAndUnits)=> {
                const groupValues = _.compact(_.flatMap(groupValuesAndUnits[0]))
                const units = _.compact(_.flatMap(groupValuesAndUnits[1]))
                return _.map(groups, (group) => {
                    group["groupValues"] = _.filter(groupValues, (g)=>g["group_id"] == group.id)
                    group["units"] = _.filter(units, (u)=>u["group_id"] == group.id)
                    return group
                })
            })
        })
    }


}

module.exports = GroupExperimentalUnitCompositeService