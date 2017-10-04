import { GraphQLObjectType, GraphQLString, GraphQLInt, GraphQLList } from 'graphql'
import FactorService from '../../services/FactorService'
import { FactorLevel, getFactorLevelsByFactorId } from './FactorLevel'
import { FactorType, getFactorTypeById } from './reference/FactorType'
import { DataSource, getDataSourceById } from './reference/DataSource'

const Factor = new GraphQLObjectType({
  name: 'Factor',
  fields: {
    id: {
      type: GraphQLInt,
    },
    name: {
      type: GraphQLString,
    },
    refFactorTypeId: {
      type: GraphQLInt,
      resolve({ ref_factor_type_id: refFactorTypeId }) {
        return refFactorTypeId
      },
    },
    factorType: {
      type: FactorType,
      resolve({ ref_factor_type_id }) {
        return getFactorTypeById({ id: ref_factor_type_id })
      },
    },
    experimentId: {
      type: GraphQLInt,
      resolve({ experiment_id: experimentId }) {
        return experimentId
      },
    },
    // TODO experiment: {}
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
    factorLevels: {
      type: new GraphQLList(FactorLevel),
      resolve({ id }) {
        return getFactorLevelsByFactorId({ factorId: id })
      },
    },
  },
})

const getFactorById = ({ id }) =>
  new FactorService().getFactorById(id)

const getFactorsByExperimentId = ({ experimentId, isTemplate }) =>
  new FactorService().getFactorsByExperimentId(experimentId, isTemplate)

export { Factor, getFactorById, getFactorsByExperimentId }
