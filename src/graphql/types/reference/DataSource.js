import { GraphQLObjectType, GraphQLString, GraphQLInt } from 'graphql'
import { property } from 'lodash'
import Resolvers from '../../resolvers'
import DataSourceType from './DataSourceType'

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
      resolve: Resolvers.refDataSourceTypeBatchResolver,
    },
  },
})

export default DataSource
