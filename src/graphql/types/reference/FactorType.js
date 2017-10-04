import { GraphQLObjectType, GraphQLInt, GraphQLString } from 'graphql'
import FactorTypeService from '../../../services/FactorTypeService'

const FactorType = new GraphQLObjectType({
  name: 'FactorType',
  fields: {
    id: {
      type: GraphQLInt,
    },
    type: {
      type: GraphQLString,
    },
  },
})

const getFactorTypeById = ({ id }) =>
  new FactorTypeService().getFactorTypeById(id)

export { FactorType, getFactorTypeById }
