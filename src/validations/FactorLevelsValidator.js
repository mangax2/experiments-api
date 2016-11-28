import SchemaValidator from './SchemaValidator'
import _ from 'lodash'
import AppError from '../services/utility/AppError'
import db from '../db/DbManager'

class FactorLevelsValidator extends SchemaValidator {
    static get POST_VALIDATION_SCHEMA() {
        return [
            {'paramName': 'value', 'type': 'text', 'lengthRange': {'min': 1, 'max': 500}, 'required': true},
            {'paramName': 'factorId', 'type': 'numeric', 'required': true},
            {'paramName': 'factorId', 'type': 'refData', 'entity': db.factor},
            {
                'paramName': 'FactorLevel',
                'type': 'businessKey',
                'keys': ['factorId', 'value'],
                'entity': db.factorLevel
            }
        ]
    }

    static get PUT_ADDITIONAL_SCHEMA_ELEMENTS() {
        return [
            {'paramName': 'id', 'type': 'numeric', 'required': true},
            {'paramName': 'id', 'type': 'refData', 'entity': db.factorLevel}
        ]
    }

    getEntityName(){
        return 'FactorLevel'
    }

    getSchema(operationName) {
        switch(operationName) {
            case 'POST': return FactorLevelsValidator.POST_VALIDATION_SCHEMA
            case 'PUT': return FactorLevelsValidator.POST_VALIDATION_SCHEMA.concat(
                FactorLevelsValidator.PUT_ADDITIONAL_SCHEMA_ELEMENTS
            )
        }
    }

    getBusinessKeyPropertyNames() {
        return ['factorId', 'value']
    }

    getDuplicateBusinessKeyError() {
        return 'Duplicate factor level value in request payload with same factor id'
    }

    preValidate(factorLevelObj) {
        if (!_.isArray(factorLevelObj) || factorLevelObj.length == 0) {
            return Promise.reject(
                AppError.badRequest('Factor Level request object needs to be an array'))
        } else {
            return Promise.resolve()
        }
    }
}

module.exports = FactorLevelsValidator