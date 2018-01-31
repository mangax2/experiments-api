import { GraphQLObjectType, GraphQLString } from 'graphql'

const Tag = new GraphQLObjectType({
  name: 'Tag',
  fields: {
    category: {
      type: GraphQLString,
    },
    value: {
      type: GraphQLString,
    },
  },
})

export default Tag
