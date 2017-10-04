import { GraphQLObjectType, GraphQLString, GraphQLInt } from 'graphql'
import DesignSpecificationDetailService from '../../services/DesignSpecificationDetailService'
import { DesignSpecification, getDesignSpecificationById } from './reference/DesignSpecification'

const DesignSpecificationDetail = new GraphQLObjectType({
  name: 'DesignSpecificationDetail',
  fields: {
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
    designSpecification: {
      type: DesignSpecification,
      resolve({ ref_design_spec_id }) {
        return getDesignSpecificationById({ id: ref_design_spec_id })
      },
    },
    experimentId: {
      type: GraphQLInt,
      resolve({ experiment_id: experimentId }) {
        return experimentId
      },
    },
    // TODO experiment: {}
  },
})

const getDesignSpecificationDetailsByExperimentId = ({ experimentId: id, isTemplate }) =>
  new DesignSpecificationDetailService().getDesignSpecificationDetailsByExperimentId(id, isTemplate)

export { DesignSpecificationDetail, getDesignSpecificationDetailsByExperimentId }
