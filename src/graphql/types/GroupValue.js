import { GraphQLObjectType, GraphQLInt, GraphQLString } from 'graphql'
import { property } from 'lodash'
import FactorLevel from './FactorLevel'
import Group from './Group'
import { AuditInfo, getAuditInfo } from './common/AuditInfo'
import Resolvers from '../resolvers'

const GroupValue = new GraphQLObjectType({
  name: 'GroupValue',
  fields: {
    // properties
    id: {
      type: GraphQLInt,
    },
    name: {
      type: GraphQLString,
    },
    value: {
      type: GraphQLString,
    },
    factorLevelId: {
      type: GraphQLInt,
      resolve: property('factor_level_id'),
    },
    groupId: {
      type: GraphQLInt,
      resolve: property('group_id'),
    },
    auditInfo: {
      type: AuditInfo,
      resolve(_) {
        return getAuditInfo(_)
      },
    },

    // direct relationships
    factorLevel: {
      type: FactorLevel,
      resolve: Resolvers.factorLevelForGroupValueBatchResolver,
    },
  },
})

export default GroupValue
