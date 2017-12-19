import { GraphQLObjectType, GraphQLString, GraphQLInt } from 'graphql'
import { property } from 'lodash'
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
      resolve: property('uom_type'),
    },
    refUnitTypeId: {
      type: GraphQLInt,
      resolve: property('ref_unit_type_id'),
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
