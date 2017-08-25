import _ from 'lodash'
import BaseValidator from './BaseValidator'
import AppError from '../services/utility/AppError'

class VariablesValidator extends BaseValidator {
  preValidate = (variables) => {
    if (_.isArray(variables)) {
      return Promise.reject(
        AppError.badRequest('Variables request object cannot be an array'))
    }
    return Promise.resolve()
  }

  validateEntity = (variables) => {
    const independentVariables = variables.independent
    if (!_.isUndefined(independentVariables) && !_.isNull(independentVariables)) {
      const factorsWithoutLevels =
        _.filter(independentVariables,
          variable => (_.isNull(variable)
            || _.isUndefined(variable)
            || _.size(variable.levels) === 0))
      if (_.size(factorsWithoutLevels) > 0) {
        this.messages.push('Factors must contain at least one level.')
      }
    }
    return Promise.resolve()
  }
}

module.exports = VariablesValidator
