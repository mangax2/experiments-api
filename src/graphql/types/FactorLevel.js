import { GraphQLObjectType, GraphQLInt, GraphQLList } from 'graphql'
import GraphQLJSON from 'graphql-type-json'
import Resolvers from '../resolvers'
import FactorLevelService from '../../services/FactorLevelService'
import { Factor, getFactorById } from './Factor'
import { AuditInfo, getAuditInfo } from './common/AuditInfo'
import db from '../../db/DbManager'

const FactorLevel = new GraphQLObjectType({
  name: 'FactorLevel',
  fields: () => ({
    // properties
    id: {
      type: GraphQLInt,
    },
    value: {
      type: GraphQLJSON,
    },
    factorId: {
      type: GraphQLInt,
      resolve({ factor_id: factorId }) {
        return factorId
      },
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

const getNestedLevels = ({ id }) =>
  db.factorLevelAssociation.findNestedLevels(id)

const getAssociatedLevels = ({ id }) =>
  db.factorLevelAssociation.findAssociatedLevels(id)

export { FactorLevel, getFactorLevelById, getFactorLevelsByFactorId }
