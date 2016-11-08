import SchemaValidator from "./SchemaValidator"
import _ from 'lodash'
import AppError from '../services/utility/AppError'
import db from '../db/DbManager'

class HypothesisValidator extends SchemaValidator {
    getSchema() {
        return [
            {'paramName': 'description', 'type': 'text', 'lengthRange': {'min': 0, 'max': 1000}, 'required': false},
            {'paramName': 'isNull', 'type': 'boolean', 'required': true},
            {'paramName': 'status', 'type': 'constant', 'data': ['INACTIVE', 'ACTIVE'], 'required': true},
            {'paramName': 'experimentId', 'type': 'numeric', 'required': true},
            {'paramName': 'experimentId', 'type': 'refData', 'required': true, 'entity': db.experiments},
            {'paramName': 'Hypothesis', 'type': 'businessKey', 'keys': ['experimentId', 'description', 'isNull'], 'entity': db.hypothesis}
        ]
    }

    getBusinessKeyPropertyNames() {
        return ['description','experimentId','isNull']
    }

    getDuplicateBusinessKeyError() {
        return 'duplicate hypotheses in request payload with same experiment id'
    }

    preValidate(factorLevelObj) {
        if (!_.isArray(factorLevelObj) || factorLevelObj.length == 0) {
            return Promise.reject(
                AppError.badRequest('Hypothesis request object needs to be an array'))
        } else {
            return Promise.resolve()
        }
    }
}

module.exports = HypothesisValidator
