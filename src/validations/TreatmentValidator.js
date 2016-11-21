import SchemaValidator from './SchemaValidator'
import _ from 'lodash'
import AppError from '../services/utility/AppError'
import db from '../db/DbManager'

class TreatmentValidator extends SchemaValidator {
    static get POST_VALIDATION_SCHEMA() {
        return [
            {'paramName': 'isControl', 'type': 'boolean', 'required': true},
            {'paramName': 'name', 'type': 'text', 'lengthRange': {'min': 1, 'max': 500}, 'required': true},
            {'paramName': 'notes', 'type': 'text', 'lengthRange': {'min': 0, 'max': 500}, 'required': false},
            {'paramName': 'experimentId', 'type': 'numeric', 'required': true},
            {'paramName': 'experimentId', 'type': 'refData', 'entity': db.experiments},
            {
                'paramName': 'Treatment',
                'type': 'businessKey',
                'keys': ['experimentId', 'name'],
                'entity': db.treatment
            }
        ]
    }

    static get PUT_ADDITIONAL_SCHEMA_ELEMENTS() {
        return [
            {'paramName': 'id', 'type': 'numeric', 'required': true},
            {'paramName': 'id', 'type': 'refData', 'entity': db.treatment}
        ]
    }

    getEntityName(){
        return 'Treatment'
    }

    getSchema(operationName) {
        switch (operationName) {
            case 'POST': return TreatmentValidator.POST_VALIDATION_SCHEMA
            case 'PUT': return TreatmentValidator.POST_VALIDATION_SCHEMA.concat(
                TreatmentValidator.PUT_ADDITIONAL_SCHEMA_ELEMENTS
            )
        }
    }

    getBusinessKeyPropertyNames() {
        return ['experimentId', 'name']
    }

    getDuplicateBusinessKeyError() {
        return 'Duplicate treatment name in request payload with same experiment id'
    }

    preValidate(treatmentObj) {
        if (!_.isArray(treatmentObj) || treatmentObj.length == 0) {
            return Promise.reject(
                AppError.badRequest('Treatment request object needs to be an array'))
        } else {
            return Promise.resolve()
        }
    }

}

module.exports = TreatmentValidator