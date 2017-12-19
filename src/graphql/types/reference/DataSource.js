import { GraphQLObjectType, GraphQLString, GraphQLInt } from 'graphql'
import { property } from 'lodash'
import { DataSourceType, getDataSourceTypeById } from './DataSourceType'

const DataSource = new GraphQLObjectType({
  name: 'DataSource',
  fields: {
    // properties
    id: {
      type: GraphQLInt,
    },
    name: {
      type: GraphQLString,
    },
    refDataSourceTypeId: {
      type: GraphQLInt,
      resolve: property('ref_data_source_type_id'),
    },

    // direct relationships
    dataSourceType: {
      type: DataSourceType,
      resolve({ ref_data_source_type_id }) {
        return getDataSourceTypeById({ id: ref_data_source_type_id })
      },
    },
  },
})

export default DataSource
