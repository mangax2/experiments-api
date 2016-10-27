import SchemaValidator from './SchemaValidator'
import _ from 'lodash'
import AppError from '../services/utility/AppError'
import db from '../db/DbManager'

class FactorsValidator extends SchemaValidator {
    static get POST_VALIDATION_SCHEMA() {
        return [
            {'paramName': 'name', 'type': 'text', 'lengthRange': {'min': 1, 'max': 500}, 'required': true},
            {'paramName': 'refFactorTypeId', 'type': 'numeric', 'required': true},
            {'paramName': 'refFactorTypeId', 'type': 'refData', 'entity': db.factorType, 'required': true},
            {'paramName': 'experimentId', 'type': 'numeric', 'required': true},
            {'paramName': 'experimentId', 'type': 'refData', 'entity': db.experiments, 'required': true},
            {'paramName': 'userId', 'type': 'text', 'lengthRange': {'min': 1, 'max': 50}, 'required': true},
            {
                'paramName': 'Factor',
                'type': 'businessKey',
                'keys': ['experimentId', 'name'],
                'entity': db.factor
            }
        ]
    }

    static get PUT_ADDITIONAL_SCHEMA_ELEMENTS() {
        return [
            {'paramName': 'id', 'type': 'numeric', 'required': true},
            {'paramName': 'id', 'type': 'refData', 'entity': db.factor}
        ]
    }

    getSchema(operationName) {
        switch (operationName) {
            case 'POST': return FactorsValidator.POST_VALIDATION_SCHEMA
            case 'PUT': return FactorsValidator.POST_VALIDATION_SCHEMA.concat(
                FactorsValidator.PUT_ADDITIONAL_SCHEMA_ELEMENTS
            )
        }
    }

    performValidations(factorObj, operationName) {
        if (_.isArray(factorObj) && factorObj.length > 0) {
            return Promise.all(
                _.map(factorObj, (factor) => super.performValidations(factor, operationName))
            ).then(() => {
                this.checkBusinessKey(factorObj)
            })
        } else {
            return Promise.reject(
                AppError.badRequest('Factor request object needs to be an array')
            )
        }
    }

    checkBusinessKey(ObjArray) {
        const uniqArray = _.uniqWith(_.map(ObjArray, (obj) => {
            return _.pick(obj, ['experimentId', 'name'])
        }), _.isEqual)
        if (uniqArray.length != ObjArray.length) {
            throw AppError.badRequest('Duplicate factor name in request payload with same experiment id')
        }
    }
}

module.exports = FactorsValidator