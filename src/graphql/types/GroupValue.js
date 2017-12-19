import { GraphQLObjectType, GraphQLInt, GraphQLString } from 'graphql'
import { property } from 'lodash'
import GroupValueService from '../../services/GroupValueService'
import { FactorLevel } from './FactorLevel'
import { Group } from './Group'
import { AuditInfo, getAuditInfo } from './common/AuditInfo'
import Resolvers from '../resolvers'

const GroupValue = new GraphQLObjectType({
  name: 'GroupValue',
  fields: () => ({
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
    group: {
      type: Group,
      resolve: Resolvers.groupForGroupValueBatchResolver,
    },
  }),
})

const getGroupValuesByGroupId = ({ groupId }) =>
  new GroupValueService().getGroupValuesByGroupId(groupId)

const getGroupValueById = ({ id }) =>
  new GroupValueService().getGroupValueById(id)

export { GroupValue, getGroupValuesByGroupId, getGroupValueById }
