import { GraphQLObjectType, GraphQLInt, GraphQLList } from 'graphql'
import { property } from 'lodash'
import GraphQLJSON from 'graphql-type-json'
import Resolvers from '../resolvers'
import Factor from './Factor'
import { AuditInfo, getAuditInfo } from './common/AuditInfo'
import FactorLevelValue from './FactorLevelValue'

const FactorLevel = new GraphQLObjectType({
  name: 'FactorLevel',
  fields: () => ({
    // properties
    id: {
      type: GraphQLInt,
    },
    value: {
      type: FactorLevelValue,
    },
    valueJSON: {
      type: GraphQLJSON,
      resolve: property('value'),
    },
    factorId: {
      type: GraphQLInt,
      resolve: property('factor_id'),
    },
    auditInfo: {
      type: AuditInfo,
      resolve(_) {
        return getAuditInfo(_)
      },
    },

    // direct relationships
    factor: {
      type: Factor,
      resolve: Resolvers.factorBatchResolver,
    },
    nestedLevels: {
      type: GraphQLList(FactorLevel),
      resolve: Resolvers.nestedFactorLevelForFactorLevelResolver,
    },
    associatedLevels: {
      type: GraphQLList(FactorLevel),
      resolve: Resolvers.associatedFactorLevelForFactorLevelResolver,
    },

    // indirect relationships
  }),
})

export default FactorLevel
