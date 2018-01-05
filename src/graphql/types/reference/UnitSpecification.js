import { GraphQLObjectType, GraphQLString, GraphQLInt } from 'graphql'
import { property } from 'lodash'
import UnitType from './UnitType'
import Resolvers from '../../resolvers'

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
      type: GraphQLString,
      resolve: property('uom_type'),
    },
    refUnitTypeId: {
      type: GraphQLInt,
      resolve: property('ref_unit_type_id'),
    },

    // direct relationships
    unitType: {
      type: UnitType,
      resolver: Resolvers.refUnitTypeForUnitSpecificationBatchResolver,
    },
  },
})

export default UnitSpecification
