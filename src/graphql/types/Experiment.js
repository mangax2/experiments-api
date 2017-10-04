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
      resolve({ id, is_template }) {
        return getFactorsByExperimentId({ experimentId: id, isTemplate: is_template })
      },
    },
    treatments: {
      type: new GraphQLList(Treatment),
      resolve({ id, is_template }) {
        return getTreatmentsByExperimentId({ experimentId: id, isTemplate: is_template })
      },
    },
    unitSpecificationDetails: {
      type: new GraphQLList(UnitSpecificationDetail),
      resolve({ id, is_template }) {
        return getUnitSpecificationDetailsByExperimentId(
          { experimentId: id, isTemplate: is_template },
        )
      },
    },
    designSpecifications: {
      type: new GraphQLList(DesignSpecificationDetail),
      resolve({ id, is_template }) {
        return getDesignSpecificationDetailsByExperimentId(
          { experimentId: id, isTemplate: is_template },
        )
      },
    },
    // TODO groups: {} ?
    // TODO units: {} ?
  },
})

const getExperimentById = ({ id, isTemplate = false }) =>
  new ExperimentsService().getExperimentById(id, isTemplate)

export { Experiment, getExperimentById }
