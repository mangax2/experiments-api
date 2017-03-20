import SchemaValidator from './SchemaValidator'
import * as _ from 'lodash'
import AppError from '../services/utility/AppError'
import db from '../db/DbManager'

class TagValidator extends SchemaValidator {
    static get POST_VALIDATION_SCHEMA() {
        return [
            {'paramName': 'name', 'type': 'text', 'lengthRange': {'min': 1, 'max': 500}, 'required': true},
            {'paramName': 'value', 'type': 'text', 'lengthRange': {'min': 1, 'max': 500}, 'required': true},
            {'paramName': 'experimentId', 'type': 'numeric', 'required': true},
            {'paramName': 'experimentId', 'type': 'refData', 'entity': db.experiments},
            {
                'paramName': 'Tag',
                'type': 'businessKey',
                'keys': ['name', 'value','experimentId'],
                'entity': db.tag
            }
        ]
    }
    static get PUT_ADDITIONAL_SCHEMA_ELEMENTS() {
        return [
            {'paramName': 'id', 'type': 'numeric', 'required': true},
            {'paramName': 'id', 'type': 'refData', 'entity': db.tag}
        ]
    }

    getEntityName(){
        return 'Tag'
    }

    getSchema(operationName) {
        switch (operationName) {
            case 'POST': return TagValidator.POST_VALIDATION_SCHEMA
            case 'PUT': return TagValidator.POST_VALIDATION_SCHEMA.concat(
                TagValidator.PUT_ADDITIONAL_SCHEMA_ELEMENTS
            )
        }
    }

    getBusinessKeyPropertyNames() {
        return ['name','value','experimentId']
    }

    getDuplicateBusinessKeyError() {
        return 'Duplicate Tag  in request payload with same experiment id'
    }

    preValidate(obj) {
        if (!_.isArray(obj) || obj.length == 0) {
            return Promise.reject(
                AppError.badRequest('Tag request object needs to be an array'))
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
                const namesAndValues = _.map(innerArray, e=> {
                    return {name: e[businessKeyPropertyNames[0]], value: e[businessKeyPropertyNames[1]]}
                })
                if (_.uniqWith(namesAndValues, _.isEqual).length != namesAndValues.length) {
                    this.messages.push(this.getDuplicateBusinessKeyError())
                    return false
                }

            })
        }
        return Promise.resolve()
    }
}

module.exports = TagValidator
