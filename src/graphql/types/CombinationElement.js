import { GraphQLObjectType, GraphQLInt } from 'graphql'
import { FactorLevel, getFactorLevelById } from './FactorLevel'
import CombinationElementService from '../../services/CombinationElementService'

const CombinationElement = new GraphQLObjectType({
  name: 'CombinationElement',
  fields: {
    id: {
      type: GraphQLInt,
    },
    factorLevelId: {
      type: GraphQLInt,
      resolve({ is_control: isControl }) {
        return isControl
      },
    },
    factorLevel: {
      type: FactorLevel,
      resolve({ factor_level_id }) {
        return getFactorLevelById({ id: factor_level_id })
      },
    },
    treatmentId: {
      type: GraphQLInt,
      resolve({ treatment_id: treatmentId }) {
        return treatmentId
      },
    },
    // TODO treatment: {}
  },
})

const getCombinationElementsByTreatmentId = ({ treatmentId }) =>
  new CombinationElementService().getCombinationElementsByTreatmentId(treatmentId)

export { CombinationElement, getCombinationElementsByTreatmentId }
