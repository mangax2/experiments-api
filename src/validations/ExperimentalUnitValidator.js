import SchemaValidator from './SchemaValidator'
import _ from 'lodash'
import AppError from '../services/utility/AppError'
import db from '../db/DbManager'

class ExperimentalUnitValidator extends SchemaValidator {
    static get POST_VALIDATION_SCHEMA() {
        return [
            {'paramName': 'rep', 'type': 'numeric', 'numericRange': {'min': 1, 'max': 999}, 'required': true},
            {'paramName': 'groupId', 'type': 'numeric', 'required': true},
            {'paramName': 'groupId', 'type': 'refData', 'entity': db.group},
            {'paramName': 'treatmentId', 'type': 'numeric', 'required': true},
            {'paramName': 'treatmentId', 'type': 'refData', 'entity': db.treatment},
            {
                'paramName': 'Unit',
                'type': 'businessKey',
                'keys': ['treatmentId', 'rep'],
                'entity': db.unit
            }
        ]
    }

    static get PUT_ADDITIONAL_SCHEMA_ELEMENTS() {
        return [
            {'paramName': 'id', 'type': 'numeric', 'required': true},
            {'paramName': 'id', 'type': 'refData', 'entity': db.unit}
        ]
    }

    getEntityName() {
        return 'Unit'
    }

    getSchema(operationName) {
        switch (operationName) {
            case 'POST':
                return ExperimentalUnitValidator.POST_VALIDATION_SCHEMA
            case 'PUT':
                return ExperimentalUnitValidator.POST_VALIDATION_SCHEMA.concat(
                    ExperimentalUnitValidator.PUT_ADDITIONAL_SCHEMA_ELEMENTS
                )
        }
    }

    getBusinessKeyPropertyNames() {
        return ['treatmentId', 'rep']
    }

    getDuplicateBusinessKeyError() {
        return 'Duplicate rep in request payload with same treatmentId'
    }

    preValidate(combinationElementObj) {
        if (!_.isArray(combinationElementObj) || combinationElementObj.length == 0) {
            return Promise.reject(
                AppError.badRequest('Unit request object needs to be an array'))
        } else {
            return Promise.resolve()
        }
    }
}

module.exports = ExperimentalUnitValidator