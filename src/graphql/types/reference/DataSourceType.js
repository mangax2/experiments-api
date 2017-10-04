import { GraphQLObjectType, GraphQLString, GraphQLInt } from 'graphql'
import RefDataSourceTypeService from '../../../services/RefDataSourceTypeService'

const DataSourceType = new GraphQLObjectType({
  name: 'DataSourceType',
  fields: {
    id: {
      type: GraphQLInt,
    },
    type: {
      type: GraphQLString,
    },
  },
})

const getDataSourceTypeById = ({ id }) =>
  new RefDataSourceTypeService().getRefDataSourceTypeById(id)

export { DataSourceType, getDataSourceTypeById }
