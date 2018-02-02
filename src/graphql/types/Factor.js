import { GraphQLObjectType, GraphQLString, GraphQLInt, GraphQLList } from 'graphql'
import { property } from 'lodash'
import Resolvers from '../resolvers'
import FactorLevel from './FactorLevel'
import FactorType from './reference/FactorType'
import { AuditInfo, getAuditInfo } from './common/AuditInfo'

const Factor = new GraphQLObjectType({
  name: 'Factor',
  fields: {
    // properties
    id: {
      type: GraphQLInt,
    },
    name: {
      type: GraphQLString,
    },
    experimentId: {
      type: GraphQLInt,
      resolve: property('experiment_id'),
    },
    refFactorTypeId: {
      type: GraphQLInt,
      resolve: property('ref_factor_type_id'),
    },
    tier: {
      type: GraphQLInt,
    },
    auditInfo: {
      type: AuditInfo,
      resolve(_) {
        return getAuditInfo(_)
      },
    },

    // direct relationships
    factorType: {
      type: FactorType,
      resolve: Resolvers.refFactorTypeBatchResolver,
    },
    factorLevels: {
      type: GraphQLList(FactorLevel),
      resolve: Resolvers.factorLevelByFactorIdsBatchResolver,
    },

    // indirect relationships
  },
})

export default Factor
