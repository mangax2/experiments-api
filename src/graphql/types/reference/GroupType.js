import { GraphQLObjectType, GraphQLInt, GraphQLString } from 'graphql'

const GroupType = new GraphQLObjectType({
  name: 'GroupType',
  fields: {
    id: {
      type: GraphQLInt,
    },
    type: {
      type: GraphQLString,
    },
  },
})

export default GroupType
