import { GraphQLObjectType, GraphQLInt } from 'graphql'
// import { getGroupById } from './Group'
import { Treatment, getTreatmentById } from './Treatment'
import ExperimentalUnitService from '../../services/ExperimentalUnitService'
import { AuditInfo, getAuditInfo } from './common/AuditInfo'

const ExperimentalUnit = new GraphQLObjectType({
  name: 'ExperimentalUnit',
  fields: {
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
    // vvv recursive issue vvv
    // group: {
    //   type: Group,
    //   resolve({ group_id }) {
    //     return getGroupById(group_id)
    //   },
    // },
    treatment: {
      type: Treatment,
      resolve({ treatment_id }) {
        return getTreatmentById({ id: treatment_id })
      },
    },

    // indirect relationships
    // TODO factorLevels: {} ?
  },
})

const getExperimentalUnitsByGroupId = ({ groupId }) =>
  new ExperimentalUnitService().batchGetExperimentalUnitsByGroupIdsNoValidate([groupId])

export { ExperimentalUnit, getExperimentalUnitsByGroupId }
