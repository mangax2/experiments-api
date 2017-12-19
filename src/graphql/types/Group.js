import { GraphQLObjectType, GraphQLInt, GraphQLList } from 'graphql'
import { property } from 'lodash'
import { GroupType } from './reference/GroupType'
import GroupService from '../../services/GroupService'
import { GroupValue } from './GroupValue'
import { ExperimentalUnit } from './ExperimentalUnit'
import { AuditInfo, getAuditInfo } from './common/AuditInfo'
import Resolvers from '../resolvers'


const Group = new GraphQLObjectType({
  name: 'Group',
  fields: () => ({
    // properties
    id: {
      type: GraphQLInt,
    },
    experimentId: {
      type: GraphQLInt,
      resolve: property('experiment_id'),
    },
    parentId: {
      type: GraphQLInt,
      resolve: property('parent_id'),
    },
    refRandomizationStrategyId: {
      type: GraphQLInt,
      resolve: property('ref_randomization_strategy_id'),
    },
    refGroupTypeId: {
      type: GraphQLInt,
      resolve: property('ref_group_type_id'),
    },
    setId: {
      type: GraphQLInt,
      resolve: property('set_id'),
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
      resolve: Resolvers.parentGroupBatchResolver,
    },
    children: {
      type: new GraphQLList(Group),
      resolve: Resolvers.childGroupsBatchResolver,
    },
    groupType: {
      type: GroupType,
      resolve: Resolvers.refGroupTypeBatchResolver,
    },
    groupValues: {
      type: new GraphQLList(GroupValue),
      resolve: Resolvers.groupValueBatchResolver,
    },
    units: {
      type: new GraphQLList(ExperimentalUnit),
      resolve: Resolvers.unitBatchResolver,
    },
  }),
})

const getGroupById = ({ id }) =>
  (id !== null
    ? new GroupService().getGroupById(id)
    : null)

const getGroupsByExperimentId = ({ experimentId, isTemplate }) =>
  new GroupService().getGroupsByExperimentId(experimentId, isTemplate)

// const getChildGroups = ({ parentId }) =>
//   (parentId !== null
//     ? new GroupService().getGroupsbyParentId(parentId)
//     : [])

export { Group, getGroupById, getGroupsByExperimentId }
