import { GraphQLSchema, GraphQLObjectType, GraphQLInt, GraphQLBoolean, GraphQLNonNull } from 'graphql'
import { Experiment, getExperimentById } from './types/Experiment'

export default new GraphQLSchema({
  query: new GraphQLObjectType({
    name: 'RootQueryType',
    fields: {
      experiment: {
        type: Experiment,
        args: {
          id: {
            type: new GraphQLNonNull(GraphQLInt),
          },
          isTemplate: {
            type: GraphQLBoolean,
          },
        },
        resolve(_, { id, isTemplate }) {
          return getExperimentById({ id, isTemplate })
        },
      },
    },
  }),
})
