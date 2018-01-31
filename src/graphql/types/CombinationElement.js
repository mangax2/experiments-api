import { GraphQLObjectType, GraphQLInt } from 'graphql'
import { property } from 'lodash'
import FactorLevel from './FactorLevel'
import Treatment from './Treatment'
import { AuditInfo, getAuditInfo } from './common/AuditInfo'
import Resolvers from '../resolvers'

const CombinationElement = new GraphQLObjectType({
  name: 'CombinationElement',
  fields: {
    // properties
    id: {
      type: GraphQLInt,
    },
    factorLevelId: {
      type: GraphQLInt,
      resolve: property('factor_level_id'),
    },
    treatmentId: {
      type: GraphQLInt,
      resolve: property('treatment_id'),
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
      resolve: Resolvers.factorLevelForCombinationElementBatchResolver,
    },
  },
})

export default CombinationElement
