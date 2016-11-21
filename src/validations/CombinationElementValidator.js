import SchemaValidator from './SchemaValidator'
import _ from 'lodash'
import AppError from '../services/utility/AppError'
import db from '../db/DbManager'

class CombinationElementValidator extends SchemaValidator {
    static get POST_VALIDATION_SCHEMA() {
        return [
            {'paramName': 'name', 'type': 'text', 'lengthRange': {'min': 1, 'max': 500}, 'required': true},
            {'paramName': 'value', 'type': 'text', 'lengthRange': {'min': 0, 'max': 500}, 'required': false},
            {'paramName': 'treatmentId', 'type': 'numeric', 'required': true},
            {'paramName': 'treatmentId', 'type': 'refData', 'entity': db.treatment},
            {
                'paramName': 'CombinationElement',
                'type': 'businessKey',
                'keys': ['treatmentId', 'name'],
                'entity': db.combinationElement
            }
        ]
    }

    static get PUT_ADDITIONAL_SCHEMA_ELEMENTS() {
        return [
            {'paramName': 'id', 'type': 'numeric', 'required': true},
            {'paramName': 'id', 'type': 'refData', 'entity': db.combinationElement}
        ]
    }

    getEntityName(){
        return 'CombinationElement'
    }

    getSchema(operationName) {
        switch(operationName) {
            case 'POST': return CombinationElementValidator.POST_VALIDATION_SCHEMA
            case 'PUT': return CombinationElementValidator.POST_VALIDATION_SCHEMA.concat(
                CombinationElementValidator.PUT_ADDITIONAL_SCHEMA_ELEMENTS
            )
        }
    }

    getBusinessKeyPropertyNames() {
        return ['treatmentId', 'name']
    }

    getDuplicateBusinessKeyError() {
        return 'Duplicate name in request payload with same treatmentId'
    }

    preValidate(combinationElementObj) {
        if (!_.isArray(combinationElementObj) || combinationElementObj.length == 0) {
            return Promise.reject(
                AppError.badRequest('CombinationElement request object needs to be an array'))
        } else {
            return Promise.resolve()
        }
    }
}

module.exports = CombinationElementValidator