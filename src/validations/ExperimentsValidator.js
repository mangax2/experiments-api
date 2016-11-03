import SchemaValidator from './SchemaValidator'
import * as _ from 'lodash'
import AppError from '../services/utility/AppError'
import db from '../db/DbManager'

class ExperimentsValidator extends SchemaValidator {
    getSchema() {
        return [
            {'paramName': 'name', 'type': 'text', 'lengthRange': {'min': 1, 'max': 50}, 'required': true},
            {'paramName': 'subjectType', 'type': 'text', 'lengthRange': {'min': 0, 'max': 100}},
            {'paramName': 'refExperimentDesignId', 'type': 'refData', 'entity': db.experimentDesign},
            {'paramName': 'status', 'type': 'constant', 'data': ['DRAFT', 'ACTIVE'], 'required': true},
        ]
    }

    performValidations(targetObject) {
        if (_.isArray(targetObject) && targetObject.length>0) {
            return Promise.all(
                _.map(targetObject, experiment=> super.performValidations(experiment))
            )
        } else {
            throw AppError.badRequest('Experiments request object needs to be an array')
        }
    }
}

module.exports = ExperimentsValidator
