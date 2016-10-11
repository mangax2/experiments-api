import SchemaValidator from './SchemaValidator'
import * as _ from 'lodash'

class ExperimentDesignsValidator extends SchemaValidator {
    getSchema() {
        return [
            {'paramName': 'name', 'type': 'text', 'lengthRange': {'min': 1, 'max': 50}, 'required': true}
        ]
    }

    performValidations(targetObject) {
        return Promise.all(
            _.map(targetObject, experimentDesign=> super.performValidations(experimentDesign))
        )
    }
}

module.exports = ExperimentDesignsValidator
