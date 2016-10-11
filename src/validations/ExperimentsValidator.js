const SchemaValidator = require('./SchemaValidator')
const _ = require('lodash')
const AppError = require('../services/utility/AppError')

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
        if (_.isArray(targetObject)) {
            return Promise.all(
                _.map(targetObject, experiment=> super.performValidations(experiment))
            )

        } else {
            return Promise.reject('Experiments request object needs to be an array')

        }


    }
}

module.exports = ExperimentsValidator
