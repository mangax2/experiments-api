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
      getExperimentById: {
        type: Experiment,
        args: {
          id: {
            type: GraphQLNonNull(GraphQLInt),
          },
        },
        resolve: Resolvers.experimentBatchResolver,
      },
      getTemplateById: {
        type: Experiment,
        args: {
          id: {
            type: GraphQLNonNull(GraphQLInt),
          },
        },
        resolve: Resolvers.templateBatchResolver,
      },
      getAllExperiments: {
        type: GraphQLList(ExperimentInfo),
        resolve: Resolvers.experimentsBatchResolver,
      },
      getAllTemplates: {
        type: GraphQLList(ExperimentInfo),
        resolve: Resolvers.templatesBatchResolver,
      },
      getFactorsByExperimentId: {
        type: GraphQLList(Factor),
        args: {
          experimentId: {
            type: GraphQLNonNull(GraphQLInt),
          },
        },
        resolve: Resolvers.factorByExperimentIdParameterBatchResolver,
      },
      getTreatmentsByExperimentId: {
        type: GraphQLList(Treatment),
        args: {
          experimentId: {
            type: GraphQLNonNull(GraphQLInt),
          },
        },
        resolve: Resolvers.treatmentByExperimentIdParameterBatchResolver,
      },
      getUnitSpecificationDetailsByExperimentId: {
        type: GraphQLList(UnitSpecificationDetail),
        args: {
          experimentId: {
            type: GraphQLNonNull(GraphQLInt),
          },
        },
        resolve: Resolvers.unitSpecDetailByExperimentIdParameterBatchResolver,
      },
      getDesignSpecificationDetailsByExperimentId: {
        type: GraphQLList(DesignSpecificationDetail),
        args: {
          experimentId: {
            type: GraphQLNonNull(GraphQLInt),
          },
        },
        resolve: Resolvers.designSpecDetailByExperimentIdParameterBatchResolver,
      },
      getGroupsByExperimentId: {
        type: GraphQLList(Group),
        args: {
          experimentId: {
            type: GraphQLNonNull(GraphQLInt),
          },
        },
        resolve: Resolvers.groupByExperimentIdParameterBatchResolver,
      },
      getUnitsByExperimentId: {
        type: GraphQLList(ExperimentalUnit),
        args: {
          experimentId: {
            type: GraphQLNonNull(GraphQLInt),
          },
        },
        resolve: Resolvers.unitByExperimentIdParameterBatchResolver,
      },
      getSetBySetId: {
        type: ExperimentalSet,
        args: {
          setId: {
            type: GraphQLNonNull(GraphQLInt),
          },
        },
        resolve: Resolvers.setBySetIdParameterBatchResolver,
      },
      getSetEntriesBySetId: {
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
