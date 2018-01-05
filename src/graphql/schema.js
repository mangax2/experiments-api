import { GraphQLSchema, GraphQLObjectType, GraphQLInt, GraphQLBoolean, GraphQLNonNull, GraphQLList } from 'graphql'
import { Experiment, getAllExperiments } from './types/Experiment'
import { Factor, getFactorsByExperimentId } from './types/Factor'
import { Treatment, getTreatmentsByExperimentId } from './types/Treatment'
import {
  getUnitSpecificationDetailsByExperimentId,
  UnitSpecificationDetail,
} from './types/UnitSpecificationDetail'
import {
  DesignSpecificationDetail,
  getDesignSpecificationDetailsByExperimentId,
} from './types/DesignSpecificationDetail'
import { Template, getAllTemplates, getTemplateById } from './types/Template'
import { Group, getGroupsByExperimentId } from './types/Group'
import { ExperimentalUnit, getExperimentalUnitsByExperimentId } from './types/ExperimentalUnit'
import { ExperimentalSet, getSetBySetId } from './types/ExperimentalSet'
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
        type: Template,
        args: {
          id: {
            type: GraphQLNonNull(GraphQLInt),
          },
        },
        resolve(_, { id }) {
          return getTemplateById(id)
        },
      },
      experiments: {
        type: GraphQLList(Experiment),
        resolve() {
          return getAllExperiments()
        },
      },
      templates: {
        type: GraphQLList(Template),
        resolve() {
          return getAllTemplates()
        },
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
          isTemplate: {
            type: GraphQLBoolean,
          },
        },
        resolve(_, { experimentId, isTemplate = false }) {
          return getTreatmentsByExperimentId({ experimentId, isTemplate })
        },
      },
      unitSpecificationDetails: {
        type: GraphQLList(UnitSpecificationDetail),
        args: {
          experimentId: {
            type: GraphQLNonNull(GraphQLInt),
          },
          isTemplate: {
            type: GraphQLBoolean,
          },
        },
        resolve(_, { experimentId, isTemplate = false }) {
          return getUnitSpecificationDetailsByExperimentId({ experimentId, isTemplate })
        },
      },
      designSpecificationDetails: {
        type: GraphQLList(DesignSpecificationDetail),
        args: {
          experimentId: {
            type: GraphQLNonNull(GraphQLInt),
          },
          isTemplate: {
            type: GraphQLBoolean,
          },
        },
        resolve(_, { experimentId, isTemplate = false }) {
          return getDesignSpecificationDetailsByExperimentId({ experimentId, isTemplate })
        },
      },
      groups: {
        type: GraphQLList(Group),
        args: {
          experimentId: {
            type: GraphQLNonNull(GraphQLInt),
          },
          isTemplate: {
            type: GraphQLBoolean,
          },
        },
        resolve(_, { experimentId, isTemplate = false }) {
          return getGroupsByExperimentId({ experimentId, isTemplate })
        },
      },
      units: {
        type: GraphQLList(ExperimentalUnit),
        args: {
          experimentId: {
            type: GraphQLNonNull(GraphQLInt),
          },
          isTemplate: {
            type: GraphQLBoolean,
          },
        },
        resolve(_, { experimentId, isTemplate = false }) {
          return getExperimentalUnitsByExperimentId({ experimentId, isTemplate })
        },
      },
      set: {
        type: ExperimentalSet,
        args: {
          setId: {
            type: GraphQLNonNull(GraphQLInt),
          },
        },
        resolve(_, { setId }) {
          return getSetBySetId({ setId })
        },
      },
      // TODO setEntries: {} ?
    },
  }),
})
