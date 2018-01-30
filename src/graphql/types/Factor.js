import { GraphQLObjectType, GraphQLString, GraphQLInt, GraphQLList } from 'graphql'
import { property } from 'lodash'
import Resolvers from '../resolvers'
import FactorService from '../../services/FactorService'
import { FactorLevel } from './FactorLevel'
import FactorType from './reference/FactorType'
import DataSource from './reference/DataSource'
import { AuditInfo, getAuditInfo } from './common/AuditInfo'

const Factor = new GraphQLObjectType({
  name: 'Factor',
  fields: {
    // properties
    id: {
      type: GraphQLInt,
    },
    name: {
      type: GraphQLString,
    },
    experimentId: {
      type: GraphQLInt,
      resolve: property('experiment_id'),
    },
    refFactorTypeId: {
      type: GraphQLInt,
      resolve: property('ref_factor_type_id'),
    },
    tier: {
      type: GraphQLInt,
    },
    refDataSourceId: {
      type: GraphQLInt,
      resolve: property('ref_data_source_id'),
    },
    auditInfo: {
      type: AuditInfo,
      resolve(_) {
        return getAuditInfo(_)
      },
    },

    // direct relationships
    dataSource: {
      type: DataSource,
      resolve: Resolvers.refDataSourceBatchResolver,
    },
    factorType: {
      type: FactorType,
      resolve: Resolvers.refFactorTypeBatchResolver,
    },
    factorLevels: {
      type: GraphQLList(FactorLevel),
      resolve: Resolvers.factorLevelByFactorIdsBatchResolver,
    },

    // indirect relationships
  },
})

const getFactorById = ({ id }) =>
  new FactorService().getFactorById(id)

const getFactorsByExperimentId = ({ experimentId, isTemplate }) =>
  new FactorService().getFactorsByExperimentId(experimentId, isTemplate)

export { Factor, getFactorById, getFactorsByExperimentId }
