import SchemaValidator from './SchemaValidator'
import * as _ from 'lodash'
import AppError from '../services/utility/AppError'
import db from '../db/DbManager'

class DependentVariablesValidator extends SchemaValidator {
    getSchema() {
        return [
            {'paramName': 'required', 'type': 'boolean', 'required': true},
            {'paramName': 'name', 'type': 'text', 'lengthRange': {'min': 1, 'max': 500}, 'required': true},
            {'paramName': 'experimentId', 'type': 'refData', 'entity': db.experiments, 'required': true},
            {'paramName': 'userId', 'type': 'text', 'lengthRange': {'min': 1, 'max': 50}, 'required': true},
            {
                'paramName': 'DependentVariable',
                'type': 'businessKey',
                'keys': ['experimentId', 'name'],
                'entity': db.dependentVariable
            }
        ]
    }

    performValidations(targetObject) {
        if (_.isArray(targetObject) && targetObject.length > 0) {
            return Promise.all(
                _.map(targetObject, dv=> super.performValidations(dv))
            ).then(()=> {
                this.checkBusinessKey(targetObject)
            })
        } else {
            throw AppError.badRequest('Dependent Variables request object needs to be an array')
        }
    }

    checkBusinessKey(ObjArray) {
        const uniqArray = _.uniqWith(_.map(ObjArray, (obj)=> {
            return _.pick(obj, ['experimentId', 'name'])
        }), _.isEqual)
        if (uniqArray.length != ObjArray.length) {
            throw AppError.badRequest('duplicate dependent variable name in request payload with same experiment id')
        }
    }
}

module.exports = DependentVariablesValidator
