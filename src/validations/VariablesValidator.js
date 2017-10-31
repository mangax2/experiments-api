import _ from 'lodash'
import BaseValidator from './BaseValidator'
import AppError from '../services/utility/AppError'

class VariablesValidator extends BaseValidator {
  findDuplicates = items =>
    _.filter(items, (value, index, iteratee) =>
      _.includes(iteratee, value, index + 1))

  preValidate = (variables) => {
    if (_.isArray(variables)) {
      return Promise.reject(
        AppError.badRequest('Variables request object cannot be an array'))
    }

    // Common data
    const refIdsGroupedByFactor =
      _.map(variables.independent, factor => _.map(factor.levels, '_refId'))
    const allRefIds = _.compact(_.flatten(refIdsGroupedByFactor))

    // Check for duplicate ref ids
    const duplicateRefIds = _.uniq(this.findDuplicates(allRefIds)).sort()
    if (!_.isEmpty(duplicateRefIds)) {
      return Promise.reject(
        AppError.badRequest(
          `The following _refIds are not unique: ${duplicateRefIds.join(', ')}`))
    }

    // Check that associations are valid
    const allAssociationRefIds = _.flatMap(variables.independentAssociations, (association) => {
      return [association.associatedLevelRefId, association.nestedLevelRefId]
    })
    const invalidAssociationRefIds = _.uniq(_.difference(allAssociationRefIds, allRefIds)).sort()
    if (!_.isEmpty(invalidAssociationRefIds)) {
      return Promise.reject(
        AppError.badRequest(
          `The following _refIds are referenced within an independentAssociation, but the _refId is not valid: ${invalidAssociationRefIds.join(', ')}`))
    }

    // Check that associations have no duplicates
    const associationStrings =
      _.map(variables.independentAssociations,
          association => `{associatedLevelRefId: ${association.associatedLevelRefId}, nestedLevelRefId: ${association.nestedLevelRefId}}`)
    const duplicateAssociations = _.uniq(this.findDuplicates(associationStrings)).sort()
    if (!_.isEmpty(duplicateAssociations)) {
      return Promise.reject(
        AppError.badRequest(
          `The following independent associations are not unique: ${duplicateAssociations.join(', ')}`))
    }

    // Check that associations do not nest within factors
    const invalidNestingAssociations =
      _.compact(_.map(variables.independentAssociations, (association) => {
        const associatedFactorIndex =
          _.findIndex(refIdsGroupedByFactor,
              factorRefIds => _.includes(factorRefIds, association.associatedLevelRefId))
        const nestedFactorIndex =
          _.findIndex(refIdsGroupedByFactor,
              factorRefIds => _.includes(factorRefIds, association.nestedLevelRefId))
        return (associatedFactorIndex === nestedFactorIndex) ? association : null
      })).sort()
    if (!_.isEmpty(invalidNestingAssociations)) {
      const invalidNestingAssociationStrings =
        _.map(invalidNestingAssociations,
          association => `{associatedLevelRefId: ${association.associatedLevelRefId}, nestedLevelRefId: ${association.nestedLevelRefId}}`)
      return Promise.reject(
        AppError.badRequest(
          `Nesting levels within a single factor is not allowed.  The following associations violate this: ${invalidNestingAssociationStrings.join(', ')}`))
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
