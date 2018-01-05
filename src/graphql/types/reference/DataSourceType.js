import { GraphQLObjectType, GraphQLString, GraphQLInt } from 'graphql'

const DataSourceType = new GraphQLObjectType({
  name: 'DataSourceType',
  fields: {
    id: {
      type: GraphQLInt,
    },
    type: {
      type: GraphQLString,
    },
  },
})

export default DataSourceType
