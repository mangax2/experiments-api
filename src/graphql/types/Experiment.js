import { GraphQLObjectType, GraphQLString, GraphQLList, GraphQLInt } from 'graphql'
import ExperimentsService from '../../services/ExperimentsService'
import { Tag } from './Tag'
import { Factor, getFactorsByExperimentId } from './Factor'
import { Treatment, getTreatmentsByExperimentId } from './Treatment'
import { UnitSpecificationDetail, getUnitSpecificationDetailsByExperimentId } from './UnitSpecificationDetail'
import {
  DesignSpecificationDetail,
  getDesignSpecificationDetailsByExperimentId,
} from './DesignSpecificationDetail'

const Experiment = new GraphQLObjectType({
  name: 'Experiment',
  fields: {
    id: {
      type: GraphQLInt,
    },
    name: {
      type: GraphQLString,
    },
    description: {
      type: GraphQLString,
    },
    owners: {
      type: new GraphQLList(GraphQLString),
    },
    ownerGroups: {
      type: new GraphQLList(GraphQLString),
    },
    tags: {
      type: new GraphQLList(Tag),
    },
    factors: {
      type: new GraphQLList(Factor),
      resolve({ id }) {
        return getFactorsByExperimentId({ experimentId: id, isTemplate: false })
      },
    },
    treatments: {
      type: new GraphQLList(Treatment),
      resolve({ id }) {
        return getTreatmentsByExperimentId({ experimentId: id, isTemplate: false })
      },
    },
    unitSpecificationDetails: {
      type: new GraphQLList(UnitSpecificationDetail),
      resolve({ id }) {
        return getUnitSpecificationDetailsByExperimentId(
          { experimentId: id, isTemplate: false },
        )
      },
    },
    designSpecifications: {
      type: new GraphQLList(DesignSpecificationDetail),
      resolve({ id }) {
        return getDesignSpecificationDetailsByExperimentId(
          { experimentId: id, isTemplate: false },
        )
      },
    },
    // TODO groups: {} ?
    // TODO units: {} ?
  },
})

const getExperimentById = ({ id, isTemplate = false }) =>
  new ExperimentsService().getExperimentById(id, isTemplate)

const getAllExperiments = () => new ExperimentsService().getAllExperiments(false)

export { Experiment, getExperimentById, getAllExperiments }
