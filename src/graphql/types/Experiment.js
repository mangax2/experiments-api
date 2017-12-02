import { GraphQLObjectType, GraphQLString, GraphQLList, GraphQLInt } from 'graphql'
import ExperimentsService from '../../services/ExperimentsService'
import { Tag } from './Tag'
import { Factor, getFactorsByExperimentId } from './Factor'
import { DependentVariable, getDependentVariablesByExperimentId } from './DependentVariable'
import { Treatment, getTreatmentsByExperimentId } from './Treatment'
import { UnitSpecificationDetail, getUnitSpecificationDetailsByExperimentId } from './UnitSpecificationDetail'
import {
  DesignSpecificationDetail,
  getDesignSpecificationDetailsByExperimentId,
} from './DesignSpecificationDetail'
import { Group, getGroupsByExperimentId } from './Group'
import { AuditInfo, getAuditInfo } from './common/AuditInfo'

const Experiment = new GraphQLObjectType({
  name: 'Experiment',
  fields: {
    // properties
    id: {
      type: GraphQLInt,
    },
    name: {
      type: GraphQLString,
    },
    description: {
      type: GraphQLString,
    },
    status: {
      type: GraphQLString,
    },
    auditInfo: {
      type: AuditInfo,
      resolve(_) {
        return getAuditInfo(_)
      },
    },

    // direct relationships
    owners: {
      type: new GraphQLList(GraphQLString),
    },
    ownerGroups: {
      type: new GraphQLList(GraphQLString),
    },
    factors: {
      type: new GraphQLList(Factor),
      resolve({ id }) {
        return getFactorsByExperimentId({ experimentId: id, isTemplate: false })
      },
    },
    dependentVariables: {
      type: new GraphQLList(DependentVariable),
      resolve({ id }) {
        return getDependentVariablesByExperimentId({ experimentId: id, isTemplate: false })
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
    groups: {
      type: new GraphQLList(Group),
      resolve({ id }) {
        return getGroupsByExperimentId(
          { experimentId: id, isTemplate: false },
        )
      },
    },
    tags: {
      type: new GraphQLList(Tag),
    },
    // TODO experimentDesign: {} ?

    // indirect relationships
    // TODO units: {} ?
    // TODO summary: {} ?
  },
})

const getExperimentById = ({ id, isTemplate = false }) =>
  new ExperimentsService().getExperimentById(id, isTemplate)

const getAllExperiments = () => new ExperimentsService().getAllExperiments(false)

export { Experiment, getExperimentById, getAllExperiments }
