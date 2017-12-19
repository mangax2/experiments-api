import { GraphQLObjectType, GraphQLInt, GraphQLList } from 'graphql'
import { property } from 'lodash'
import GraphQLJSON from 'graphql-type-json'
import Resolvers from '../resolvers'
import FactorLevelService from '../../services/FactorLevelService'
import { Factor } from './Factor'
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
      type: new GraphQLList(FactorLevel),
      resolve: Resolvers.nestedFactorLevelForFactorLevelResolver,
    },
    associatedLevels: {
      type: new GraphQLList(FactorLevel),
      resolve: Resolvers.associatedFactorLevelForFactorLevelResolver,
    },
    // TODO combinationElements: {} ?
    // TODO groupValues: {} ?

    // indirect relationships
    // TODO treatments: {} ?
    // TODO units: {} ?
  }),
})

const getFactorLevelById = ({ id }) =>
  new FactorLevelService().getFactorLevelById(id)

const getFactorLevelsByFactorId = ({ factorId }) =>
  new FactorLevelService().getFactorLevelsByFactorId(factorId)

export { FactorLevel, getFactorLevelById, getFactorLevelsByFactorId }
