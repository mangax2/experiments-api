import SchemaValidator from './SchemaValidator'
import db from '../db/DbManager'

class VariablesValidator extends SchemaValidator {

    static get SCHEMA() {
        return [
            {'paramName': 'experimentId', 'type': 'numeric', 'required': true},
            {'paramName': 'experimentId', 'type': 'refData', 'entity': db.experiments}
        ]
    }

    getSchema() {
        return VariablesValidator.SCHEMA
    }

    postValidate(targetObject) {
        // No business key to validate
        return Promise.resolve()
    }
}

module.exports = VariablesValidator