import SchemaValidator from './SchemaValidator'
import * as _ from 'lodash'
import AppError from '../services/utility/AppError'
import db from '../db/DbManager'

class ExperimentDesignsValidator extends SchemaValidator {
    getSchema() {
        return [
            {'paramName': 'name', 'type': 'text', 'lengthRange': {'min': 1, 'max': 50}, 'required': true},
            {'paramName': 'ExperimentDesign', 'type': 'businessKey', 'keys': ['name'], 'entity': db.experimentDesign}
        ]
    }

    performValidations(targetObject) {
        if (_.isArray(targetObject) && targetObject.length > 0) {
            return Promise.all(
                _.map(targetObject, experimentDesign=> super.performValidations(experimentDesign))
            )

        } else {
            throw AppError.badRequest('Experiment Designs request object needs to be an array')
        }
    }
}

module.exports = ExperimentDesignsValidator
