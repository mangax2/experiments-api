import { GraphQLObjectType, GraphQLString, GraphQLInt } from 'graphql'
import RefDataSourceService from '../../../services/RefDataSourceService'
import { DataSourceType, getDataSourceTypeById } from './DataSourceType'

const DataSource = new GraphQLObjectType({
  name: 'DataSource',
  fields: {
    id: {
      type: GraphQLInt,
    },
    name: {
      type: GraphQLString,
    },
    refDataSourceTypeId: {
      type: GraphQLInt,
      resolve({ ref_data_source_type_id: refDataSourceTypeId }) {
        return refDataSourceTypeId
      },
    },
    dataSourceType: {
      type: DataSourceType,
      resolve({ ref_data_source_type_id }) {
        return getDataSourceTypeById({ id: ref_data_source_type_id })
      },
    },
  },
})

const getDataSourceById = ({ id }) =>
  new RefDataSourceService().getRefDataSourceById(id)

export { DataSource, getDataSourceById }
