import { GraphQLObjectType, GraphQLInt, GraphQLList, GraphQLString } from 'graphql'
import { property } from 'lodash'
import { AuditInfo, getAuditInfo } from './common/AuditInfo'

const Owner = new GraphQLObjectType({
  name: 'Owner',
  fields: {
    id: {
      type: GraphQLInt,
    },
    experimentId: {
      type: GraphQLInt,
      resolve: property('experiment_id'),
    },
    userIds: {
      type: GraphQLList(GraphQLString),
      resolve: property('user_ids'),
    },
    groupIds: {
      type: GraphQLList(GraphQLString),
      resolve: property('group_ids'),
    },
    auditInfo: {
      type: AuditInfo,
      resolve(_) {
        return getAuditInfo(_)
      },
    },
  },
})

export default Owner
