import { GraphQLObjectType, GraphQLString, GraphQLInt, GraphQLList } from 'graphql'
import { property } from 'lodash'
import TreatmentService from '../../services/TreatmentService'
import { CombinationElement } from './CombinationElement'
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
      resolve: property('experiment_id'),
    },
    isControl: {
      type: GraphQLString,
      resolve: property('is_control'),
    },
    treatmentNumber: {
      type: GraphQLInt,
      resolve: property('treatment_number'),
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
      type: GraphQLList(CombinationElement),
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
