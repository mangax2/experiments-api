import { GraphQLObjectType, GraphQLInt } from 'graphql'
import { property } from 'lodash'
import { Group } from './Group'
import { Treatment } from './Treatment'
import ExperimentalUnitService from '../../services/ExperimentalUnitService'
import { AuditInfo, getAuditInfo } from './common/AuditInfo'
import Resolvers from '../resolvers'

const ExperimentalUnit = new GraphQLObjectType({
  name: 'ExperimentalUnit',
  fields: () => ({
    // properties
    id: {
      type: GraphQLInt,
    },
    groupId: {
      type: GraphQLInt,
      resolve: property('group_id'),
    },
    treatmentId: {
      type: GraphQLInt,
      resolve: property('treatment_id'),
    },
    rep: {
      type: GraphQLInt,
    },
    setEntryId: {
      type: GraphQLInt,
      resolve: property('set_entry_id'),
    },
    auditInfo: {
      type: AuditInfo,
      resolve(_) {
        return getAuditInfo(_)
      },
    },

    // direct relationships
    group: {
      type: Group,
      resolve: Resolvers.groupForExperimentalUnitBatchResolver,
    },
    treatment: {
      type: Treatment,
      resolve: Resolvers.treatmentForExperimentalUnitBatchResolver,
    },

    // indirect relationships
  }),
})

const getExperimentalUnitsByExperimentId = ({ experimentId }) =>
  new ExperimentalUnitService().getExperimentalUnitsByExperimentIdNoValidate(experimentId)

export { ExperimentalUnit, getExperimentalUnitsByExperimentId }
