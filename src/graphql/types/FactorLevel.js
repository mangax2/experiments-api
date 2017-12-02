import { GraphQLObjectType, GraphQLInt } from 'graphql'
import GraphQLJSON from 'graphql-type-json'
import FactorLevelService from '../../services/FactorLevelService'
import { Factor, getFactorById } from './Factor'
import { AuditInfo, getAuditInfo } from './common/AuditInfo'

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
      resolve({ factor_id }) {
        return getFactorById({ id: factor_id })
      },
    },
    // TODO nestedLevels: {}
    // TODO associatedLevels: {}
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
