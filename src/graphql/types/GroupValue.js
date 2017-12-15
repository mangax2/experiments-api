import { GraphQLObjectType, GraphQLInt, GraphQLString } from 'graphql'
import GroupValueService from '../../services/GroupValueService'
import { FactorLevel, getFactorLevelById } from './FactorLevel'
import { Group, getGroupById } from './Group'
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
      resolve({ factor_level_id: factorLevelId }) {
        return factorLevelId
      },
    },
    groupId: {
      type: GraphQLInt,
      resolve({ group_id: groupId }) {
        return groupId
      },
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
