import { GraphQLObjectType, GraphQLInt, GraphQLList } from 'graphql'
import { getGroupTypeById, GroupType } from './reference/GroupType'
import GroupService from '../../services/GroupService'
import { GroupValue, getGroupValuesByGroupId } from './GroupValue'
import { ExperimentalUnit, getExperimentalUnitsByGroupId } from './ExperimentalUnit'
import { AuditInfo, getAuditInfo } from './common/AuditInfo'


const Group = new GraphQLObjectType({
  name: 'Group',
  fields: () => ({
    // properties
    id: {
      type: GraphQLInt,
    },
    experimentId: {
      type: GraphQLInt,
      resolve({ experiment_id: experimentId }) {
        return experimentId
      },
    },
    parentId: {
      type: GraphQLInt,
      resolve({ parent_id: parentId }) {
        return parentId
      },
    },
    refRandomizationStrategyId: {
      type: GraphQLInt,
      resolve({ ref_randomization_strategy_id: refRandomizationStrategyId }) {
        return refRandomizationStrategyId
      },
    },
    refGroupTypeId: {
      type: GraphQLInt,
      resolve({ ref_group_type_id: refGroupTypeId }) {
        return refGroupTypeId
      },
    },
    setId: {
      type: GraphQLInt,
      resolve({ set_id: setId }) {
        return setId
      },
    },
    auditInfo: {
      type: AuditInfo,
      resolve(_) {
        return getAuditInfo(_)
      },
    },

    // direct relationships
    parent: {
      type: Group,
      resolve({ parent_id }) {
        return getGroupById({ id: parent_id })
      },
    },
    children: {
      type: new GraphQLList(Group),
      resolve({ id }) {
        return getChildGroups({ parentId: id })
      },
    },
    groupType: {
      type: GroupType,
      resolve({ ref_group_type_id }) {
        return getGroupTypeById({ id: ref_group_type_id })
      },
    },
    groupValues: {
      type: new GraphQLList(GroupValue),
      resolve({ id }) {
        return getGroupValuesByGroupId({ groupId: id })
      },
    },
    units: {
      type: new GraphQLList(ExperimentalUnit),
      resolve({ id }) {
        return getExperimentalUnitsByGroupId({ groupId: id })
      },
    },
  }),
})

const getGroupById = ({ id }) =>
  (id !== null
    ? new GroupService().getGroupById(id)
    : null)

const getGroupsByExperimentId = ({ experimentId, isTemplate }) =>
  new GroupService().getGroupsByExperimentId(experimentId, isTemplate)

const getChildGroups = ({ parentId }) =>
  (parentId !== null
    ? new GroupService().getGroupsbyParentId(parentId)
    : [])

export { Group, getGroupById, getGroupsByExperimentId }
