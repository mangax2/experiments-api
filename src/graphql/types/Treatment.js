import { GraphQLObjectType, GraphQLString, GraphQLInt, GraphQLList } from 'graphql'
import TreatmentService from '../../services/TreatmentService'
import { CombinationElement, getCombinationElementsByTreatmentId } from './CombinationElement'

const Treatment = new GraphQLObjectType({
  name: 'Treatment',
  fields: {
    id: {
      type: GraphQLInt,
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
    combinationElements: {
      type: new GraphQLList(CombinationElement),
      resolve({ id }) {
        return getCombinationElementsByTreatmentId({ treatmentId: id })
      },
    },
  },
})

const getTreatmentsByExperimentId = ({ experimentId, isTemplate = false }) =>
  new TreatmentService().getTreatmentsByExperimentId(experimentId, isTemplate)

const getTreatmentById = ({ id }) => new TreatmentService().getTreatmentById(id)()

export { Treatment, getTreatmentsByExperimentId, getTreatmentById }
