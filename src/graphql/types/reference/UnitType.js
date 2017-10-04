import { GraphQLObjectType, GraphQLString, GraphQLInt } from 'graphql'
import UnitTypeService from '../../../services/UnitTypeService'

const UnitType = new GraphQLObjectType({
  name: 'UnitType',
  fields: {
    id: {
      type: GraphQLInt,
    },
    name: {
      type: GraphQLString,
    },
  },
})

const getUnitTypeById = ({ id }) =>
  new UnitTypeService().getUnitTypeById(id)

export { UnitType, getUnitTypeById }
