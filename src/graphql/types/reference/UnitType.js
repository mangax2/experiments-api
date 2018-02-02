import { GraphQLObjectType, GraphQLString, GraphQLInt } from 'graphql'

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

export default UnitType
