import { GraphQLObjectType, GraphQLString, GraphQLInt } from 'graphql'
import DesignSpecificationDetailService from '../../services/DesignSpecificationDetailService'
import { DesignSpecification, getDesignSpecificationById } from './reference/DesignSpecification'
import { AuditInfo, getAuditInfo } from './common/AuditInfo'

const DesignSpecificationDetail = new GraphQLObjectType({
  name: 'DesignSpecificationDetail',
  fields: {
    // properties
    id: {
      type: GraphQLInt,
    },
    value: {
      type: GraphQLString,
    },
    refDesignSpecId: {
      type: GraphQLInt,
      resolve({ ref_design_spec_id: refDesignSpecId }) {
        return refDesignSpecId
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
    designSpecification: {
      type: DesignSpecification,
      resolve({ ref_design_spec_id }) {
        return getDesignSpecificationById({ id: ref_design_spec_id })
      },
    },
    // TODO experiment? template?
  },
})

const getDesignSpecificationDetailsByExperimentId = ({ experimentId: id, isTemplate }) =>
  new DesignSpecificationDetailService().getDesignSpecificationDetailsByExperimentId(id, isTemplate)

export { DesignSpecificationDetail, getDesignSpecificationDetailsByExperimentId }
