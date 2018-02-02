import { GraphQLObjectType, GraphQLString, GraphQLList } from 'graphql'

const FactorLevelValue = new GraphQLObjectType({
  name: 'FactorLevelValue',
  fields: () => ({
    // properties
    items: {
      type: GraphQLList(ClusterComposite),
    },
    objectType: {
      type: GraphQLString,
    },
  }),
})

const ClusterComposite = new GraphQLObjectType({
  name: 'ClusterComposite',
  fields: () => ({
    // properties
    text: {
      type: GraphQLString,
    },
    label: {
      type: GraphQLString,
    },
    objectType: {
      type: GraphQLString,
    },
    items: {
      type: GraphQLList(ClusterComposite),
    },
  }),
})

export default FactorLevelValue
