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
import Resolvers from './resolvers'

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
        },
        resolve: Resolvers.experimentBatchResolver,
      },
      template: {
        type: Template,
        args: {
          id: {
            type: new GraphQLNonNull(GraphQLInt),
          },
        },
        resolve(_, { id }) {
          return getTemplateById(id)
        },
      },
      experiments: {
        type: new GraphQLList(Experiment),
        resolve() {
          return getAllExperiments()
        },
      },
      templates: {
        type: new GraphQLList(Template),
        resolve() {
          return getAllTemplates()
        },
      },
      factors: {
        type: new GraphQLList(Factor),
        args: {
          experimentId: {
            type: new GraphQLNonNull(GraphQLInt),
          },
          isTemplate: {
            type: GraphQLBoolean,
          },
        },
        resolve(_, { experimentId, isTemplate = false }) {
          return getFactorsByExperimentId({ experimentId, isTemplate })
        },
      },
      treatments: {
        type: new GraphQLList(Treatment),
        args: {
          experimentId: {
            type: new GraphQLNonNull(GraphQLInt),
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
        type: new GraphQLList(UnitSpecificationDetail),
        args: {
          experimentId: {
            type: new GraphQLNonNull(GraphQLInt),
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
        type: new GraphQLList(DesignSpecificationDetail),
        args: {
          experimentId: {
            type: new GraphQLNonNull(GraphQLInt),
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
        type: new GraphQLList(Group),
        args: {
          experimentId: {
            type: new GraphQLNonNull(GraphQLInt),
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
        type: new GraphQLList(ExperimentalUnit),
        args: {
          experimentId: {
            type: new GraphQLNonNull(GraphQLInt),
          },
          isTemplate: {
            type: GraphQLBoolean,
          },
        },
        resolve(_, { experimentId, isTemplate = false }) {
          return getExperimentalUnitsByExperimentId({ experimentId, isTemplate })
        },
      },
      // TODO set: {} ?
      // TODO setEntries: {} ?
    },
  }),
})
