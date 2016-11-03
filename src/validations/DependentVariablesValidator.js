import SchemaValidator from './SchemaValidator'
import * as _ from 'lodash'
import AppError from '../services/utility/AppError'
import db from '../db/DbManager'

class DependentVariablesValidator extends SchemaValidator {
    getSchema(operationName) {
        const schema = [
            {'paramName': 'required', 'type': 'boolean', 'required': true},
            {'paramName': 'name', 'type': 'text', 'lengthRange': {'min': 1, 'max': 500}, 'required': true},
            {'paramName': 'experimentId', 'type': 'numeric', 'required': true},
            {'paramName': 'experimentId', 'type': 'refData', 'entity': db.experiments},
            {
                'paramName': 'DependentVariable',
                'type': 'businessKey',
                'keys': ['experimentId', 'name'],
                'entity': db.dependentVariable
            }
        ]
        switch (operationName) {
            case 'POST': return schema
            case 'PUT': return schema.concat([{'paramName': 'id', 'type': 'numeric', 'required': true},
                {'paramName': 'id', 'type': 'refData', 'entity': db.dependentVariable}])
        }

    }

    performValidations(targetObject, operationName, optionalTransaction) {
        if (_.isArray(targetObject)) {
            return Promise.all(
                _.map(targetObject, dv=> super.performValidations(dv, operationName, optionalTransaction))
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