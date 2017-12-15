import { GraphQLObjectType, GraphQLInt } from 'graphql'
import { FactorLevel, getFactorLevelById } from './FactorLevel'
import CombinationElementService from '../../services/CombinationElementService'
import { Treatment, getTreatmentById } from './Treatment'
import { AuditInfo, getAuditInfo } from './common/AuditInfo'
import Resolvers from '../resolvers'

const CombinationElement = new GraphQLObjectType({
  name: 'CombinationElement',
  fields: () => ({
    // properties
    id: {
      type: GraphQLInt,
    },
    factorLevelId: {
      type: GraphQLInt,
      resolve({ is_control: isControl }) {
        return isControl
      },
    },
    treatmentId: {
      type: GraphQLInt,
      resolve({ treatment_id: treatmentId }) {
        return treatmentId
      },
    },
    auditInfo: {
      type: AuditInfo,
      resolve(_) {
        return getAuditInfo(_)
      },
    },

    // direct relationships
    factorLevel: {
      type: FactorLevel,
      resolve: Resolvers.factorLevelForCombinationElementBatchResolver,
    },
    treatment: {
      type: Treatment,
      resolve: Resolvers.treatmentForCombinationElementBatchResolver,
    },
  }),
})

const getCombinationElementsByTreatmentId = ({ treatmentId }) =>
  new CombinationElementService().getCombinationElementsByTreatmentId(treatmentId)

const getCombinationElementById = ({ id }) =>
  new CombinationElementService().getCombinationElementById(id)

export { CombinationElement, getCombinationElementsByTreatmentId, getCombinationElementById }
