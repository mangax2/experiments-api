import SchemaValidator from './SchemaValidator'
import * as _ from 'lodash'
import AppError from '../services/utility/AppError'
import db from '../db/DbManager'

class FactorTypesValidator extends SchemaValidator {
    getSchema() {
        return [
            {'paramName': 'type', 'type': 'text', 'lengthRange': {'min': 1, 'max': 50}, 'required': true},
            {'paramName': 'FactorType', 'type': 'businessKey', 'keys': ['type'], 'entity': db.factorType}

        ]
    }

    performValidations(targetObject) {
        if (_.isArray(targetObject) && targetObject.length > 0) {
            return Promise.all(
                _.map(targetObject, factorType=> super.performValidations(factorType))
            )
        } else {
            throw AppError.badRequest('Factor Types request object needs to be an array')
        }
    }
}

module.exports = FactorTypesValidator
