import { GraphQLSchema, GraphQLObjectType, GraphQLInt, GraphQLNonNull, GraphQLList } from 'graphql'
import ExperimentInfo from './types/ExperimentInfo'
import Experiment from './types/Experiment'
import Factor from './types/Factor'
import Treatment from './types/Treatment'
import UnitSpecificationDetail from './types/UnitSpecificationDetail'
import DesignSpecificationDetail from './types/DesignSpecificationDetail'
import Group from './types/Group'
import ExperimentalUnit from './types/ExperimentalUnit'
import ExperimentalSet from './types/ExperimentalSet'
import Resolvers from './resolvers'

export default new GraphQLSchema({
  query: new GraphQLObjectType({
    name: 'RootQueryType',
    fields: {
      experiment: {
        type: Experiment,
        args: {
          id: {
            type: GraphQLNonNull(GraphQLInt),
          },
        },
        resolve: Resolvers.experimentBatchResolver,
      },
      template: {
        type: Experiment,
        args: {
          id: {
            type: GraphQLNonNull(GraphQLInt),
          },
        },
        resolve: Resolvers.templateBatchResolver,
      },
      experiments: {
        type: GraphQLList(ExperimentInfo),
        resolve: Resolvers.experimentsBatchResolver,
      },
      templates: {
        type: GraphQLList(ExperimentInfo),
        resolve: Resolvers.templatesBatchResolver,
      },
      factors: {
        type: GraphQLList(Factor),
        args: {
          experimentId: {
            type: GraphQLNonNull(GraphQLInt),
          },
        },
        resolve: Resolvers.factorByExperimentIdParameterBatchResolver,
      },
      treatments: {
        type: GraphQLList(Treatment),
        args: {
          experimentId: {
            type: GraphQLNonNull(GraphQLInt),
          },
        },
        resolve: Resolvers.treatmentByExperimentIdParameterBatchResolver,
      },
      unitSpecificationDetails: {
        type: GraphQLList(UnitSpecificationDetail),
        args: {
          experimentId: {
            type: GraphQLNonNull(GraphQLInt),
          },
        },
        resolve: Resolvers.unitSpecDetailByExperimentIdParameterBatchResolver,
      },
      designSpecificationDetails: {
        type: GraphQLList(DesignSpecificationDetail),
        args: {
          experimentId: {
            type: GraphQLNonNull(GraphQLInt),
          },
        },
        resolve: Resolvers.designSpecDetailByExperimentIdParameterBatchResolver,
      },
      groups: {
        type: GraphQLList(Group),
        args: {
          experimentId: {
            type: GraphQLNonNull(GraphQLInt),
          },
        },
        resolve: Resolvers.groupByExperimentIdParameterBatchResolver,
      },
      units: {
        type: GraphQLList(ExperimentalUnit),
        args: {
          experimentId: {
            type: GraphQLNonNull(GraphQLInt),
          },
        },
        resolve: Resolvers.unitByExperimentIdParameterBatchResolver,
      },
      set: {
        type: ExperimentalSet,
        args: {
          setId: {
            type: GraphQLNonNull(GraphQLInt),
          },
        },
        resolve: Resolvers.setBySetIdParameterBatchResolver,
      },
      setEntries: {
        type: GraphQLList(ExperimentalUnit),
        args: {
          setId: {
            type: GraphQLNonNull(GraphQLInt),
          },
        },
        resolve: Resolvers.unitBySetIdParameterBatchResolver,
      },
    },
  }),
})
