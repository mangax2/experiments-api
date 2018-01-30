import { GraphQLObjectType, GraphQLString, GraphQLInt } from 'graphql'
import ExperimentsService from '../../services/ExperimentsService'
// import { Tag } from './Tag'
// import { Factor, getFactorsByExperimentId } from './Factor'
// import { DependentVariable, getDependentVariablesByExperimentId } from './DependentVariable'
// import { Treatment, getTreatmentsByExperimentId } from './Treatment'
// import { UnitSpecificationDetail, getUnitSpecificationDetailsByExperimentId }
// from './UnitSpecificationDetail'
// import {
//   DesignSpecificationDetail,
//   getDesignSpecificationDetailsByExperimentId,
// } from './DesignSpecificationDetail'
// import { Group, getGroupsByExperimentId } from './Group'
import { AuditInfo, getAuditInfo } from './common/AuditInfo'

const Template = new GraphQLObjectType({
  name: 'Template',
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
    // owners: {
    //   type: GraphQLList(GraphQLString),
    // },
    // ownerGroups: {
    //   type: GraphQLList(GraphQLString),
    // },
    // factors: {
    //   type: GraphQLList(Factor),
    //   resolve({ id }) {
    //     return getFactorsByExperimentId({ experimentId: id, isTemplate: true })
    //   },
    // },
    // dependentVariables: {
    //   type: GraphQLList(DependentVariable),
    //   resolve({ id }) {
    //     return getDependentVariablesByExperimentId({ experimentId: id, isTemplate: true })
    //   },
    // },
    // treatments: {
    //   type: GraphQLList(Treatment),
    //   resolve({ id }) {
    //     return getTreatmentsByExperimentId({ experimentId: id, isTemplate: true })
    //   },
    // },
    // unitSpecificationDetails: {
    //   type: GraphQLList(UnitSpecificationDetail),
    //   resolve({ id }) {
    //     return getUnitSpecificationDetailsByExperimentId(
    //       { experimentId: id, isTemplate: true },
    //     )
    //   },
    // },
    // designSpecifications: {
    //   type: GraphQLList(DesignSpecificationDetail),
    //   resolve({ id }) {
    //     return getDesignSpecificationDetailsByExperimentId(
    //       { experimentId: id, isTemplate: true },
    //     )
    //   },
    // },
    // groups: {
    //   type: GraphQLList(Group),
    //   resolve({ id }) {
    //     return getGroupsByExperimentId(
    //       { experimentId: id, isTemplate: true },
    //     )
    //   },
    // },
    // tags: {
    //   type: GraphQLList(Tag),
    // },

    // indirect relationships
  },
})

const getTemplateById = ({ id, isTemplate = true }) =>
  new ExperimentsService().getExperimentById(id, isTemplate)

const getAllTemplates = () => new ExperimentsService().getAllExperiments(true)

export { Template, getTemplateById, getAllTemplates }
