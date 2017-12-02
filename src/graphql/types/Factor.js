import { GraphQLObjectType, GraphQLString, GraphQLInt, GraphQLList } from 'graphql'
import FactorService from '../../services/FactorService'
import { FactorLevel, getFactorLevelsByFactorId } from './FactorLevel'
import { FactorType, getFactorTypeById } from './reference/FactorType'
import { DataSource, getDataSourceById } from './reference/DataSource'
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
      resolve({ experiment_id: experimentId }) {
        return experimentId
      },
    },
    refFactorTypeId: {
      type: GraphQLInt,
      resolve({ ref_factor_type_id: refFactorTypeId }) {
        return refFactorTypeId
      },
    },
    tier: {
      type: GraphQLInt,
    },
    refDataSourceId: {
      type: GraphQLInt,
      resolve({ ref_data_source_id: refDataSourceId }) {
        return refDataSourceId
      },
    },
    dataSource: {
      type: DataSource,
      resolve({ ref_data_source_id }) {
        return getDataSourceById({ id: ref_data_source_id })
      },
    },
    auditInfo: {
      type: AuditInfo,
      resolve(_) {
        return getAuditInfo(_)
      },
    },

    // direct relationships
    // TODO experiment? template?
    factorType: {
      type: FactorType,
      resolve({ ref_factor_type_id }) {
        return getFactorTypeById({ id: ref_factor_type_id })
      },
    },
    factorLevels: {
      type: new GraphQLList(FactorLevel),
      resolve({ id }) {
        return getFactorLevelsByFactorId({ factorId: id })
      },
    },

    // indirect relationships
  },
})

const getFactorById = ({ id }) =>
  new FactorService().getFactorById(id)

const getFactorsByExperimentId = ({ experimentId, isTemplate }) =>
  new FactorService().getFactorsByExperimentId(experimentId, isTemplate)

export { Factor, getFactorById, getFactorsByExperimentId }
