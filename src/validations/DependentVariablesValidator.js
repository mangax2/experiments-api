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

    getEntityName(){
        return 'DependentVariable'
    }

    getBusinessKeyPropertyNames() {
        return ['experimentId', 'name']
    }

    getDuplicateBusinessKeyError() {
        return 'duplicate dependent variable name in request payload with same experiment id'
    }

    preValidate(factorObj) {
        if (!_.isArray(factorObj) || factorObj.length == 0) {
            return Promise.reject(
                AppError.badRequest('Dependent Variables request object needs to be an array'))
        } else {
            return Promise.resolve()
        }
    }

    postValidate(targetObject) {
        if (!this.hasErrors()) {
            const businessKeyPropertyNames = this.getBusinessKeyPropertyNames()
            const businessKeyArray = _.map(targetObject, (obj)=> {
                return _.pick(obj, businessKeyPropertyNames)
            })
            const groupByObject = _.values(_.groupBy(businessKeyArray, keyObj=>keyObj.experimentId))
            _.forEach(groupByObject, innerArray=> {
                const names = _.map(innerArray, e=> {
                    return e[businessKeyPropertyNames[1]]
                })
                if (_.uniq(names).length != names.length) {
                    this.messages.push(this.getDuplicateBusinessKeyError())
                    return false
                }

            })
        }
        return Promise.resolve()
    }
}

module.exports = DependentVariablesValidator
