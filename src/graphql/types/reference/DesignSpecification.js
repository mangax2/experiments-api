import { GraphQLObjectType, GraphQLString, GraphQLInt } from 'graphql'

const DesignSpecification = new GraphQLObjectType({
  name: 'DesignSpecification',
  fields: {
    id: {
      type: GraphQLInt,
    },
    name: {
      type: GraphQLString,
    },
  },
})

export default DesignSpecification
