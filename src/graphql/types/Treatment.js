import { GraphQLObjectType, GraphQLString, GraphQLInt, GraphQLList } from 'graphql'
import TreatmentService from '../../services/TreatmentService'
import { CombinationElement, getCombinationElementsByTreatmentId } from './CombinationElement'
import { AuditInfo, getAuditInfo } from './common/AuditInfo'
import Resolvers from '../resolvers'

const Treatment = new GraphQLObjectType({
  name: 'Treatment',
  fields: {
    // properties
    id: {
      type: GraphQLInt,
    },
    experimentId: {
      type: GraphQLInt,
      resolve({ experiment_id: experimentId }) {
        return experimentId
      },
    },
    isControl: {
      type: GraphQLString,
      resolve({ is_control: isControl }) {
        return isControl
      },
    },
    treatmentNumber: {
      type: GraphQLInt,
      resolve({ treatment_number: treatmentNumber }) {
        return treatmentNumber
      },
    },
    notes: {
      type: GraphQLString,
    },
    auditInfo: {
      type: AuditInfo,
      resolve(_) {
        return getAuditInfo(_)
      },
    },
    // direct relationships
    // TODO experiment/template: {} ?
    combinationElements: {
      type: new GraphQLList(CombinationElement),
      resolve: Resolvers.combinationElementForTreatmentBatchResolver,
    },
    // TODO units: {} ?

    // indirect relationships:
    // TODO factorLevels: {} ?
  },
})

const getTreatmentsByExperimentId = ({ experimentId, isTemplate = false }) =>
  new TreatmentService().getTreatmentsByExperimentId(experimentId, isTemplate)

const getTreatmentById = ({ id }) => new TreatmentService().getTreatmentById(id)

export { Treatment, getTreatmentsByExperimentId, getTreatmentById }
