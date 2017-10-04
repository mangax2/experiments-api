import { GraphQLObjectType, GraphQLInt } from 'graphql'
import GraphQLJSON from 'graphql-type-json'
import FactorLevelService from '../../services/FactorLevelService'

const FactorLevel = new GraphQLObjectType({
  name: 'FactorLevel',
  fields: {
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
    // TODO factor
  },
})

const getFactorLevelById = ({ id }) =>
  new FactorLevelService().getFactorLevelById(id)

const getFactorLevelsByFactorId = ({ factorId }) =>
  new FactorLevelService().getFactorLevelsByFactorId(factorId)

export { FactorLevel, getFactorLevelById, getFactorLevelsByFactorId }
