import _ from 'lodash'
import BaseValidator from './BaseValidator'
import AppError from '../services/utility/AppError'
import { getFullErrorCode, setErrorCode } from '../decorators/setErrorDecorator'

// Error Codes 3HXXXX
class VariablesValidator extends BaseValidator {
  @setErrorCode('3H1000')
  findDuplicates = items =>
    _.filter(items, (value, index, iteratee) =>
      _.includes(iteratee, value, index + 1))

  @setErrorCode('3H2000')
  preValidate = (variables) => {
    if (_.isArray(variables)) {
      return Promise.reject(
        AppError.badRequest('Variables request object cannot be an array', undefined, getFullErrorCode('3H2001')))
    }

    // Common data
    const refIdsGroupedByFactor =
      _.map(variables.independent, factor => _.compact(_.map(factor.levels, '_refId')))
    const allRefIds = _.flatten(refIdsGroupedByFactor)

    // Check for duplicate ref ids
    const duplicateRefIds = _.uniq(this.findDuplicates(allRefIds)).sort()
    if (!_.isEmpty(duplicateRefIds)) {
      return Promise.reject(
        AppError.badRequest(`The following _refIds are not unique: ${duplicateRefIds.join(', ')}`, undefined, getFullErrorCode('3H2002')))
    }

    // Check that associations are valid
    const allAssociationRefIds = _.flatMap(variables.independentAssociations,
      association => [association.associatedLevelRefId, association.nestedLevelRefId])
    const invalidAssociationRefIds = _.uniq(_.difference(allAssociationRefIds, allRefIds)).sort()
    if (!_.isEmpty(invalidAssociationRefIds)) {
      return Promise.reject(
        AppError.badRequest(`The following _refIds are referenced within an independentAssociation, but the _refId is not valid: ${invalidAssociationRefIds.join(', ')}`, undefined, getFullErrorCode('3H2003')))
    }

    // Check that associations have no duplicates
    const associationStrings =
      _.map(variables.independentAssociations,
        association => `{associatedLevelRefId: ${association.associatedLevelRefId}, nestedLevelRefId: ${association.nestedLevelRefId}}`)
    const duplicateAssociations = _.uniq(this.findDuplicates(associationStrings)).sort()
    if (!_.isEmpty(duplicateAssociations)) {
      return Promise.reject(
        AppError.badRequest(`The following independent associations are not unique: ${duplicateAssociations.join(', ')}`, undefined, getFullErrorCode('3H2004')))
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
        AppError.badRequest(`Nesting levels within a single factor is not allowed.  The following associations violate this: ${invalidNestingAssociationStrings.join(', ')}`, undefined, getFullErrorCode('3H2005')))
    }

    // Check for missing association
    const allNestedRefIds =
      _.map(variables.independentAssociations, 'nestedLevelRefId')
    const levelCountGroupedByFactor =
      _.map(variables.independent, factor => _.size(factor.levels))
    const nestedRefIdCountGroupedByFactor =
      _.map(refIdsGroupedByFactor, refIds =>
        _.size(_.uniq(_.filter(refIds, refId => _.includes(allNestedRefIds, refId)))))
    const levelCountAndRefIdCount =
      _.zip(levelCountGroupedByFactor, nestedRefIdCountGroupedByFactor)
    if (_.some(levelCountAndRefIdCount, counts => counts[1] !== 0 && counts[0] !== counts[1])) {
      return Promise.reject(
        AppError.badRequest('An association must exist for all levels of a nested variable.', undefined, getFullErrorCode('3H2005')))
    }

    return Promise.resolve()
  }

  @setErrorCode('3H3000')
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
