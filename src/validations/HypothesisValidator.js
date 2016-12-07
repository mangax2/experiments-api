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

    getEntityName(){
        return 'Hypothesis'
    }

    getBusinessKeyPropertyNames() {
        return ['experimentId', 'description', 'isNull']
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


    postValidate(targetObject) {
        if (!this.hasErrors()) {
            const businessKeyPropertyNames = this.getBusinessKeyPropertyNames()
            const businessKeyArray = _.map(targetObject, (obj)=> {
                return _.pick(obj, businessKeyPropertyNames)
            })
            const groupByObject = _.values(_.groupBy(businessKeyArray, keyObj=>keyObj.experimentId))
            _.forEach(groupByObject, innerArray=> {
                const names = _.map(innerArray, e=> {
                    return `${e[businessKeyPropertyNames[1]]}|${e[businessKeyPropertyNames[2]]}`
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

module.exports = HypothesisValidator
