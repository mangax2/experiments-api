import { GraphQLObjectType, GraphQLString, GraphQLList, GraphQLInt } from 'graphql'
import ExperimentsService from '../../services/ExperimentsService'
import { Tag } from './Tag'
import { Factor, getFactorsByExperimentId } from './Factor'
import { Treatment, getTreatmentsByExperimentId } from './Treatment'
import { UnitSpecificationDetail, getUnitSpecificationDetailsByExperimentId } from './UnitSpecificationDetail'
import { DesignSpecificationDetail, getDesignSpecificationDetailsByExperimentId } from './DesignSpecificationDetail'

const Template = new GraphQLObjectType({
  name: 'Template',
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
        return getFactorsByExperimentId({ experimentId: id, isTemplate: true })
      },
    },
    treatments: {
      type: new GraphQLList(Treatment),
      resolve({ id }) {
        return getTreatmentsByExperimentId({ experimentId: id, isTemplate: true })
      },
    },
    unitSpecificationDetails: {
      type: new GraphQLList(UnitSpecificationDetail),
      resolve({ id }) {
        return getUnitSpecificationDetailsByExperimentId(
          { experimentId: id, isTemplate: true },
        )
      },
    },
    designSpecifications: {
      type: new GraphQLList(DesignSpecificationDetail),
      resolve({ id }) {
        return getDesignSpecificationDetailsByExperimentId(
          { experimentId: id, isTemplate: true },
        )
      },
    },
    // TODO groups: {} ?
    // TODO units: {} ?
  },
})

const getTemplateById = ({ id, isTemplate = true }) =>
  new ExperimentsService().getExperimentById(id, isTemplate)

const getAllTemplates = () => new ExperimentsService().getAllExperiments(true)

export { Template, getTemplateById, getAllTemplates }
