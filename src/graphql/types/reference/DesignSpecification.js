import { GraphQLObjectType, GraphQLString, GraphQLInt } from 'graphql'
import RefDesignSpecificationService from '../../../services/RefDesignSpecificationService'

const DesignSpecification = new GraphQLObjectType({
  name: 'DesignSpecification',
  fields: {
    id: {
      type: GraphQLInt,
    },
    name: {
      type: GraphQLString,
    },
  },
})

const getDesignSpecificationById = ({ id }) =>
  new RefDesignSpecificationService().getDesignSpecById(id)

export { DesignSpecification, getDesignSpecificationById }
