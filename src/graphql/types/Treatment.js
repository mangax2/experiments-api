import { GraphQLObjectType, GraphQLString, GraphQLInt, GraphQLList } from 'graphql'
import { property } from 'lodash'
import CombinationElement from './CombinationElement'
import { AuditInfo, getAuditInfo } from './common/AuditInfo'
import Resolvers from '../resolvers'

const Treatment = new GraphQLObjectType({
  name: 'Treatment',
  fields: {
    // properties
    id: {
      type: GraphQLInt,
    },
    experimentId: {
      type: GraphQLInt,
      resolve: property('experiment_id'),
    },
    isControl: {
      type: GraphQLString,
      resolve: property('is_control'),
    },
    treatmentNumber: {
      type: GraphQLInt,
      resolve: property('treatment_number'),
    },
    notes: {
      type: GraphQLString,
    },
    auditInfo: {
      type: AuditInfo,
      resolve(_) {
        return getAuditInfo(_)
      },
    },
    // direct relationships
    combinationElements: {
      type: GraphQLList(CombinationElement),
      resolve: Resolvers.combinationElementForTreatmentBatchResolver,
    },

    // indirect relationships:
  },
})

export default Treatment
