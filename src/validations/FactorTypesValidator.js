import SchemaValidator from './SchemaValidator'

class FactorTypesValidator extends SchemaValidator {
    getSchema() {
        return [
            {'paramName': 'type', 'type': 'text', 'lengthRange': {'min': 1, 'max': 50}, 'required': true}
        ]
    }

    performValidations(targetObject) {
        return Promise.all(
            targetObject.map(factorType=> super.performValidations(factorType))
        )
    }
}

module.exports = FactorTypesValidator
