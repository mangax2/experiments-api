import SchemaValidator from "./SchemaValidator"
import _ from 'lodash'
import AppError from '../services/utility/AppError'
import db from '../db/DbManager'

class HypothesisValidator extends SchemaValidator {

    getSchema() {
        return [
            {'paramName': 'description', 'type': 'text', 'lengthRange': {'min': 1, 'max': 300}, 'required': true},
            {'paramName': 'isNull', 'type': 'boolean', 'required': true},
            {'paramName': 'status', 'type': 'constant', 'data': ['INACTIVE', 'ACTIVE'], 'required': true},
            {'paramName': 'experimentId', 'type': 'refData', 'required': true, 'entity': db.experiments},
            {'paramName': 'userId', 'type': 'text', 'lengthRange': {'min': 1, 'max': 50}, 'required': true}
        ]
    }
    performValidations(hypothesisObj){
        if (_.isArray(hypothesisObj) && hypothesisObj.length>0) {
            return Promise.all(
                _.map(hypothesisObj, (hypothesis) => super.performValidations(hypothesis))
            ).then(()=>{
                  this.checkBusinessKey(hypothesisObj)
            })
        } else {
            throw AppError.badRequest('Hypothesis request object needs to be an array')
        }


    }

    checkBusinessKey(hypothesisObj){
        const uniqArray = _.uniqWith(_.map(hypothesisObj,(hypothesis)=>{
            return _.pick(hypothesis,['description','experimentId','isNull'])
        }), _.isEqual)
        if(uniqArray.length!=hypothesisObj.length){
              throw AppError.badRequest('duplicate hypothesis with same experiment id exists')
        }
    }
}


module.exports = HypothesisValidator