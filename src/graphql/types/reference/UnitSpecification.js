import { GraphQLObjectType, GraphQLString, GraphQLInt } from 'graphql'
import UnitSpecificationService from '../../../services/UnitSpecificationService'
import { getUnitTypeById, UnitType } from './UnitType'

const UnitSpecification = new GraphQLObjectType({
  name: 'UnitSpecification',
  fields: {
    // properties
    id: {
      type: GraphQLInt,
    },
    name: {
      type: GraphQLString,
    },
    uomType: {
      type: GraphQLInt,
      resolve({ uom_type: uomType }) {
        return uomType
      },
    },
    refUnitTypeId: {
      type: GraphQLInt,
      resolve({ ref_unit_type_id: refUnitTypeId }) {
        return refUnitTypeId
      },
    },

    // direct relationships
    unitType: {
      type: UnitType,
      resolve({ ref_unit_type_id }) {
        return getUnitTypeById({ id: ref_unit_type_id })
      },
    },
  },
})

const getUnitSpecificationById = ({ id }) =>
  new UnitSpecificationService().getUnitSpecificationById(id)

export { UnitSpecification, getUnitSpecificationById }
