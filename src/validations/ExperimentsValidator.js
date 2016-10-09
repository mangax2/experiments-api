'use strict'

const BaseValidator = require('./BaseValidator')
const SchemaValidator = require('./SchemaValidator')


class ExperimentsValidator extends SchemaValidator {


    getSchema() {
        return [
            {'paramName': 'name', 'type': 'text', 'lengthRange': {'min': 1, 'max': 50}, 'required': true},
            {'paramName': 'subjectType', 'type': 'text', 'lengthRange': {'min': 1, 'max': 100}, 'required': true},
            {'paramName': 'reps', 'type': 'numeric', 'numericRange': {'min': 1, 'max': 1000}, 'required': true},
            {'paramName': 'refExperimentDesignId', 'type': 'refData', 'required': true},
            {'paramName': 'status', 'type': 'constant', 'data': ['DRAFT', 'ACTIVE'], 'required': true},
            {'paramName': 'userId', 'type': 'text', 'lengthRange': {'min': 1, 'max': 50}, 'required': true}
        ]
    }

    performValidations(targetObject) {
        return Promise.all(
            targetObject.map(experiment=> super.performValidations(experiment))
        )


    }
}

module.exports = ExperimentsValidator
