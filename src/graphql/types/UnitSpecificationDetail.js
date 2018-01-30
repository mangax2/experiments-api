import { GraphQLObjectType, GraphQLString, GraphQLInt } from 'graphql'
import { property } from 'lodash'
import UnitSpecificationDetailService from '../../services/UnitSpecificationDetailService'
import UnitSpecification from './reference/UnitSpecification'
import { AuditInfo, getAuditInfo } from './common/AuditInfo'
import Resolvers from '../resolvers'

const UnitSpecificationDetail = new GraphQLObjectType({
  name: 'UnitSpecificationDetail',
  fields: {
    // properties
    id: {
      type: GraphQLInt,
    },
    value: {
      type: GraphQLString,
    },
    uomId: {
      type: GraphQLInt,
      resolve: property('uom_id'),
    },
    refUnitSpecId: {
      type: GraphQLInt,
      resolve: property('ref_unit_spec_id'),
    },
    experimentId: {
      type: GraphQLInt,
      resolve: property('experiment_id'),
    },
    auditInfo: {
      type: AuditInfo,
      resolve(_) {
        return getAuditInfo(_)
      },
    },

    // direct relationships
    unitSpecification: {
      type: UnitSpecification,
      resolve: Resolvers.refUnitSpecForUnitSpecificationDetailBatchResolver,
    },
  },
})

const getUnitSpecificationDetailsByExperimentId = ({ experimentId: id, isTemplate }) =>
  new UnitSpecificationDetailService().getUnitSpecificationDetailsByExperimentId(id, isTemplate)

export { UnitSpecificationDetail, getUnitSpecificationDetailsByExperimentId }
