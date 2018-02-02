import { GraphQLObjectType, GraphQLInt } from 'graphql'
import { property } from 'lodash'
import { AuditInfo, getAuditInfo } from './common/AuditInfo'

const ExperimentalUnit = new GraphQLObjectType({
  name: 'ExperimentalUnit',
  fields: {
    // properties
    id: {
      type: GraphQLInt,
    },
    groupId: {
      type: GraphQLInt,
      resolve: property('group_id'),
    },
    treatmentId: {
      type: GraphQLInt,
      resolve: property('treatment_id'),
    },
    rep: {
      type: GraphQLInt,
    },
    setEntryId: {
      type: GraphQLInt,
      resolve: property('set_entry_id'),
    },
    auditInfo: {
      type: AuditInfo,
      resolve(_) {
        return getAuditInfo(_)
      },
    },

    // direct relationships

    // indirect relationships
  },
})

export default ExperimentalUnit
