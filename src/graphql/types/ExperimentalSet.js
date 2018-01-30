import { GraphQLObjectType, GraphQLInt, GraphQLList } from 'graphql'
import { property } from 'lodash'
import GroupType from './reference/GroupType'
import { Group } from './Group'
import { GroupValue } from './GroupValue'
// import { ExperimentalUnit } from './ExperimentalUnit'
import Resolvers from '../resolvers'

const ExperimentalSet = new GraphQLObjectType({
  name: 'ExperimentalSet',
  fields: () => ({
    // properties
    groupId: {
      type: GraphQLInt,
      resolve: property('id'),
    },
    experimentId: {
      type: GraphQLInt,
      resolve: property('experiment_id'),
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

    // direct relationships
    children: {
      type: GraphQLList(Group),
      resolve: Resolvers.childGroupsBatchResolver,
    },
    groupType: {
      type: GroupType,
      resolve: Resolvers.refGroupTypeBatchResolver,
    },
    groupValues: {
      type: GraphQLList(GroupValue),
      resolve: Resolvers.groupValueBatchResolver,
    },
    // setEntries: {
    //   type: GraphQLList(ExperimentalUnit),
    //   resolve: Resolvers.setEntryBatchResolver,
    // },
  }),
})

export default ExperimentalSet
