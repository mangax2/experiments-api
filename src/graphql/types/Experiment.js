import { GraphQLObjectType, GraphQLString, GraphQLList, GraphQLInt } from 'graphql'
import { property } from 'lodash'
import { AuditInfo, getAuditInfo } from './common/AuditInfo'
import DependentVariable from './DependentVariable'
import DesignSpecificationDetail from './DesignSpecificationDetail'
import Factor from './Factor'
import Group from './Group'
import Owner from './Owner'
import Treatment from './Treatment'
import UnitSpecificationDetail from './UnitSpecificationDetail'
import Resolvers from '../resolvers'
import ExperimentalUnit from './ExperimentalUnit'

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
    capacityRequestSyncDate: {
      type: GraphQLString,
      resolve: property('capacity_request_sync_date'),
    },
    auditInfo: {
      type: AuditInfo,
      resolve(_) {
        return getAuditInfo(_)
      },
    },

    dependentVariables: {
      type: GraphQLList(DependentVariable),
      resolve: Resolvers.dependentVariableForExperimentBatchResolver,
    },
    designSpecifications: {
      type: GraphQLList(DesignSpecificationDetail),
      resolve: Resolvers.designSpecDetailForExperimentBatchResolver,
    },
    factors: {
      type: GraphQLList(Factor),
      resolve: Resolvers.factorByExperimentIdsBatchResolver,
    },
    groups: {
      type: GraphQLList(Group),
      resolve: Resolvers.groupsForExperimentBatchResolver,
    },
    owners: {
      type: Owner,
      resolve: Resolvers.ownersForExperimentBatchResolver,
    },
    treatments: {
      type: GraphQLList(Treatment),
      resolve: Resolvers.treatmentsForExperimentBatchResolver,
    },
    unitSpecificationDetails: {
      type: GraphQLList(UnitSpecificationDetail),
      resolve: Resolvers.unitSpecDetailForExperimentBatchResolver,
    },
    units: {
      type: GraphQLList(ExperimentalUnit),
      resolve: Resolvers.unitByExperimentIdBatchResolver,
    },
  },
})

export default Experiment
