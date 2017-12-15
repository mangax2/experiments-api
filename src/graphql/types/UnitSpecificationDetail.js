import { GraphQLObjectType, GraphQLString, GraphQLInt } from 'graphql'
import UnitSpecificationDetailService from '../../services/UnitSpecificationDetailService'
import { getUnitSpecificationById, UnitSpecification } from './reference/UnitSpecification'
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
    experimentId: {
      type: GraphQLInt,
      resolve({ experiment_id: experimentId }) {
        return experimentId
      },
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
    // TODO experiment? template?
  },
})

const getUnitSpecificationDetailsByExperimentId = ({ experimentId: id, isTemplate }) =>
  new UnitSpecificationDetailService().getUnitSpecificationDetailsByExperimentId(id, isTemplate)

export { UnitSpecificationDetail, getUnitSpecificationDetailsByExperimentId }
