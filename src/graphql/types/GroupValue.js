import { GraphQLObjectType, GraphQLInt, GraphQLString } from 'graphql'
import GroupValueService from '../../services/GroupValueService'
import { FactorLevel, getFactorLevelById } from './FactorLevel'
import { Group, getGroupById } from './Group'
import { AuditInfo, getAuditInfo } from './common/AuditInfo'


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
      resolve({ factor_level_id }) {
        return getFactorLevelById({ id: factor_level_id })
      },
    },
    group: {
      type: Group,
      resolve({ group_id }) {
        return getGroupById({ id: group_id })
      },
    },
  }),
})

const getGroupValuesByGroupId = ({ groupId }) =>
  new GroupValueService().getGroupValuesByGroupId(groupId)

const getGroupValueById = ({ id }) =>
  new GroupValueService().getGroupValueById(id)

export { GroupValue, getGroupValuesByGroupId, getGroupValueById }
