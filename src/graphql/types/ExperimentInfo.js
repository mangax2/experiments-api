import { GraphQLObjectType, GraphQLString, GraphQLInt } from 'graphql'
import { property } from 'lodash'
import { AuditInfo, getAuditInfo } from './common/AuditInfo'
import Owner from './Owner'
import Resolvers from '../resolvers'

const ExperimentInfo = new GraphQLObjectType({
  name: 'ExperimentInfo',
  fields: {
    id: {
      type: GraphQLInt,
    },
    name: {
      type: GraphQLString,
    },
    description: {
      type: GraphQLString,
    },
    status: {
      type: GraphQLString,
    },
    capacityRequestSyncDate: {
      type: GraphQLString,
      resolve: property('capacity_request_sync_date'),
    },
    auditInfo: {
      type: AuditInfo,
      resolve(_) {
        return getAuditInfo(_)
      },
    },
    owners: {
      type: Owner,
      resolve: Resolvers.ownersForExperimentBatchResolver,
    },
  },
})

export default ExperimentInfo
