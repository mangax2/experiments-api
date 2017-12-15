import { GraphQLObjectType, GraphQLInt } from 'graphql'
import { Group, getGroupById } from './Group'
import { Treatment, getTreatmentById } from './Treatment'
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
      resolve({ group_id: groupId }) {
        return groupId
      },
    },
    treatmentId: {
      type: GraphQLInt,
      resolve({ treatment_id: treatmentId }) {
        return treatmentId
      },
    },
    rep: {
      type: GraphQLInt,
    },
    setEntryId: {
      type: GraphQLInt,
      resolve({ set_entry_id: setEntryId }) {
        return setEntryId
      },
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
      resolve({ group_id }) {
        return getGroupById({ id: group_id })
      },
    },
    treatment: {
      type: Treatment,
      resolve: Resolvers.treatmentForExperimentalUnitBatchResolver,
    },

    // indirect relationships
    // TODO factorLevels: {} ?
  }),
})

const getExperimentalUnitsByGroupId = ({ groupId }) =>
  new ExperimentalUnitService().batchGetExperimentalUnitsByGroupIdsNoValidate([groupId])

const getExperimentalUnitsByExperimentId = ({ experimentId }) =>
  new ExperimentalUnitService().getExperimentalUnitsByExperimentIdNoValidate(experimentId)

export { ExperimentalUnit, getExperimentalUnitsByGroupId, getExperimentalUnitsByExperimentId }
