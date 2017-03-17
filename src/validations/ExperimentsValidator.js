import SchemaValidator from './SchemaValidator'
import * as _ from 'lodash'
import AppError from '../services/utility/AppError'
import db from '../db/DbManager'

class ExperimentsValidator extends SchemaValidator {
    getSchema() {
        return [
            {'paramName': 'name', 'type': 'text', 'lengthRange': {'min': 1, 'max': 100}, 'required': true},
            {'paramName': 'description', 'type': 'text','lengthRange': {'min': 0, 'max': 5000}, 'required': false},
            {'paramName': 'refExperimentDesignId', 'type': 'refData', 'entity': db.experimentDesign},
            {'paramName': 'status', 'type': 'constant', 'data': ['DRAFT', 'ACTIVE'], 'required': true},
        ]
    }

    getEntityName(){
        return 'Experiment'
    }

    preValidate(factorObj) {
        if (!_.isArray(factorObj) || factorObj.length == 0) {
            return Promise.reject(
                AppError.badRequest('Experiments request object needs to be an array'))
        } else {
            return Promise.resolve()
        }
    }

    postValidate(targetObject) {
        // No business key to validate
        return Promise.resolve()
    }
}

module.exports = ExperimentsValidator
