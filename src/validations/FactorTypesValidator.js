import SchemaValidator from './SchemaValidator'
import * as _ from 'lodash'

class FactorTypesValidator extends SchemaValidator {
    getSchema() {
        return [
            {'paramName': 'type', 'type': 'text', 'lengthRange': {'min': 1, 'max': 50}, 'required': true}
        ]
    }

    performValidations(targetObject) {
        return Promise.all(
            _.map(targetObject, factorType=> super.performValidations(factorType))
        )
    }
}

module.exports = FactorTypesValidator
