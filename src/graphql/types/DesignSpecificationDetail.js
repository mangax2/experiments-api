import { GraphQLObjectType, GraphQLString, GraphQLInt } from 'graphql'
import { property } from 'lodash'
import DesignSpecificationDetailService from '../../services/DesignSpecificationDetailService'
import DesignSpecification from './reference/DesignSpecification'
import { AuditInfo, getAuditInfo } from './common/AuditInfo'
import Resolvers from '../resolvers'

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
      resolve: property('ref_design_spec_id'),
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
    designSpecification: {
      type: DesignSpecification,
      resolve: Resolvers.refDesignSpecForDesignSpecDetailBatchResolver,
    },
    // TODO experiment? template?
  },
})

const getDesignSpecificationDetailsByExperimentId = ({ experimentId: id, isTemplate }) =>
  new DesignSpecificationDetailService().getDesignSpecificationDetailsByExperimentId(id, isTemplate)

export { DesignSpecificationDetail, getDesignSpecificationDetailsByExperimentId }
