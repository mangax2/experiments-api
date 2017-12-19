import { GraphQLObjectType, GraphQLString, GraphQLInt, GraphQLBoolean } from 'graphql'
import { property } from 'lodash'
import DependentVariableService from '../../services/DependentVariableService'
import { AuditInfo, getAuditInfo } from './common/AuditInfo'

const DependentVariable = new GraphQLObjectType({
  name: 'DependentVariable',
  fields: {
    id: {
      type: GraphQLInt,
    },
    name: {
      type: GraphQLString,
    },
    required: {
      type: GraphQLBoolean,
    },
    questionCode: {
      type: GraphQLString,
      resolve: property('question_code'),
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
  },
})

const getDependentVariableById = ({ id }) =>
  new DependentVariableService().getDependentVariableById(id)

const getDependentVariablesByExperimentId = ({ experimentId, isTemplate }) =>
  new DependentVariableService().getDependentVariablesByExperimentId(experimentId, isTemplate)

export { DependentVariable, getDependentVariableById, getDependentVariablesByExperimentId }
