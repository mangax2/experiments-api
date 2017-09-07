import _ from 'lodash'
import SchemaValidator from './SchemaValidator'
import AppError from '../services/utility/AppError'
import db from '../db/DbManager'

class GroupValueValidator extends SchemaValidator {
  static get POST_VALIDATION_SCHEMA() {
    return [
      { paramName: 'name', type: 'text', lengthRange: { min: 1, max: 500 }, required: false },
      { paramName: 'value', type: 'text', lengthRange: { min: 0, max: 500 }, required: false },
      { paramName: 'factorLevelId', type: 'numeric', required: false },
      { paramName: 'factorLevelId', type: 'refData', entity: db.factorLevel },
      { paramName: 'groupId', type: 'numeric', required: true },
      { paramName: 'groupId', type: 'refData', entity: db.group },
    ]
  }

  static get PUT_ADDITIONAL_SCHEMA_ELEMENTS() {
    return [
      { paramName: 'id', type: 'numeric', required: true },
      { paramName: 'id', type: 'refData', entity: db.groupValue },
    ]
  }

  getEntityName = () => 'GroupValue'

  getSchema = (operationName) => {
    switch (operationName) {
      case 'POST':
        return GroupValueValidator.POST_VALIDATION_SCHEMA
      case 'PUT':
        return GroupValueValidator.POST_VALIDATION_SCHEMA.concat(
          GroupValueValidator.PUT_ADDITIONAL_SCHEMA_ELEMENTS,
        )
      default:
        throw AppError.badRequest('Invalid Operation')
    }
  }

  preValidate = (groupValueObj) => {
    if (!_.isArray(groupValueObj) || groupValueObj.length === 0) {
      return Promise.reject(
        AppError.badRequest('Group Value request object needs to be an array'))
    }
    if (_.filter(groupValueObj, (gv) => {
      if ((!gv.name || !gv.value) && !gv.factorLevelId) {
        return gv
      }
      return undefined
    }).length > 0) {
      return Promise.reject(
        AppError.badRequest('Group Values must have a name and a value, or a factor level id'),
      )
    }

    return Promise.resolve()
  }

  postValidate = (targetObject) => {
    if (!this.hasErrors()) {
      const factorLevelIds = _.uniq(_.compact(_.map(targetObject, 'factorLevelId')))

      const factorLevelPromise = factorLevelIds.length > 0
        ? db.factorLevel.batchFind(factorLevelIds)
        : new Promise(resolve => resolve([]))

      return factorLevelPromise.then((factorLevels) => {
        const groupIdsWithFactorId = _.map(targetObject, (groupValue) => {
          if (groupValue.factorLevelId) {
            const factorId = _.find(factorLevels, fl =>
              fl.id === groupValue.factorLevelId,
            ).factor_id

            return `${groupValue.groupId}|${factorId}`
          }

          return `${groupValue.groupId}|${groupValue.name}`
        })

        const hasDuplicateBusinessKeys =
          _.uniq(groupIdsWithFactorId).length !== groupIdsWithFactorId.length

        if (hasDuplicateBusinessKeys) {
          this.messages.push('Group Value provided with same group id, and either same name and value, or same factor level id as another')
        }

        return hasDuplicateBusinessKeys
      })
    }
    return Promise.resolve()
  }
}

module
  .exports = GroupValueValidator
