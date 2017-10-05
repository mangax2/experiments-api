import { GraphQLObjectType, GraphQLString, GraphQLInt } from 'graphql'
import UnitSpecificationDetailService from '../../services/UnitSpecificationDetailService'
import { getUnitSpecificationById, UnitSpecification } from './reference/UnitSpecification'

const UnitSpecificationDetail = new GraphQLObjectType({
  name: 'UnitSpecificationDetail',
  fields: {
    id: {
      type: GraphQLInt,
    },
    value: {
      type: GraphQLString,
    },
    uomId: {
      type: GraphQLInt,
      resolve({ uom_id: uomId }) {
        return uomId
      },
    },
    refUnitSpecID: {
      type: GraphQLInt,
      resolve({ ref_unit_spec_id: refUnitSpecId }) {
        return refUnitSpecId
      },
    },
    unitSpecification: {
      type: UnitSpecification,
      resolve({ ref_unit_spec_id }) {
        return getUnitSpecificationById({ id: ref_unit_spec_id })
      },
    },
    experimentId: {
      type: GraphQLInt,
      resolve({ experiment_id: experimentId }) {
        return experimentId
      },
    },
    // TODO experiment? template?
  },
})

const getUnitSpecificationDetailsByExperimentId = ({ experimentId: id, isTemplate }) =>
  new UnitSpecificationDetailService().getUnitSpecificationDetailsByExperimentId(id, isTemplate)

export { UnitSpecificationDetail, getUnitSpecificationDetailsByExperimentId }
