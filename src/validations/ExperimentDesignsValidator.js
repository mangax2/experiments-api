import SchemaValidator from './SchemaValidator'

class ExperimentDesignsValidator extends SchemaValidator {
    getSchema() {
        return [
            {'paramName': 'name', 'type': 'text', 'lengthRange': {'min': 1, 'max': 50}, 'required': true},
        ]
    }

    performValidations(targetObject) {
        return Promise.all(
            targetObject.map(experimentDesign=> super.performValidations(experimentDesign))
        )
    }
}

module.exports = ExperimentDesignsValidator
