import SchemaValidator from './SchemaValidator'
import _ from 'lodash'
import AppError from '../services/utility/AppError'
import db from '../db/DbManager'

class FactorsValidator extends SchemaValidator {
    getSchema(operationName) {
        const schema = [
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
        switch (operationName) {
            case 'POST': return schema
            case 'PUT': return schema.concat(
                [
                    {'paramName': 'id', 'type': 'numeric', 'required': true},
                    {'paramName': 'id', 'type': 'refData', 'entity': db.factor, 'operation': 'PUT'}
                ]
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
            throw AppError.badRequest('Factor request object needs to be an array')
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