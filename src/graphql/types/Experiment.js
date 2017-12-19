import { GraphQLObjectType, GraphQLString, GraphQLList, GraphQLInt } from 'graphql'
import ExperimentsService from '../../services/ExperimentsService'
// import { Tag } from './Tag'
import { Factor } from './Factor'
import { DependentVariable } from './DependentVariable'
import { Treatment } from './Treatment'
import { UnitSpecificationDetail } from './UnitSpecificationDetail'
import { DesignSpecificationDetail } from './DesignSpecificationDetail'
import { Group } from './Group'
import { AuditInfo, getAuditInfo } from './common/AuditInfo'
import Resolvers from '../resolvers'

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

    // This was removed because experiment is no longer retrieved
    // using ExperimentService.  This can be added back once a
    // loader is set up for it.
    // direct relationships
    // owners: {
    //   type: new GraphQLList(GraphQLString),
    // },

    // This was removed because experiment is no longer retrieved
    // using ExperimentService.  This can be added back once a
    // loader is set up for it.
    // ownerGroups: {
    //   type: new GraphQLList(GraphQLString),
    // },

    factors: {
      type: new GraphQLList(Factor),
      resolve: Resolvers.factorByExperimentIdsBatchResolver,
    },
    dependentVariables: {
      type: new GraphQLList(DependentVariable),
      resolve: Resolvers.dependentVariableForExperimentBatchResolver,
    },
    treatments: {
      type: new GraphQLList(Treatment),
      resolve: Resolvers.treatmentsForExperimentBatchResolver,
    },
    unitSpecificationDetails: {
      type: new GraphQLList(UnitSpecificationDetail),
      resolve: Resolvers.unitSpecDetailForExperimentBatchResolver,
    },
    designSpecifications: {
      type: new GraphQLList(DesignSpecificationDetail),
      resolve: Resolvers.designSpecDetailForExperimentBatchResolver,
    },
    groups: {
      type: new GraphQLList(Group),
      resolve: Resolvers.groupsForExperimentBatchResolver,
    },

    // This was removed because experiment is no longer retrieved
    // using ExperimentService.  This can be added back once a
    // loader is set up for it.
    // tags: {
    //   type: new GraphQLList(Tag),
    // },

    // TODO experimentDesign: {} ?

    // indirect relationships
    // TODO units: {} ?
    // TODO summary: {} ?
  },
})

const getAllExperiments = () => new ExperimentsService().getAllExperiments(false)

export { Experiment, getAllExperiments }
