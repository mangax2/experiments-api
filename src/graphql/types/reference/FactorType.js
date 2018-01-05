import { GraphQLObjectType, GraphQLInt, GraphQLString } from 'graphql'

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

export default FactorType
