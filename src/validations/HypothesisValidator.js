/**
 * Created by kprat1 on 12/10/16.
 */
import SchemaValidator from "./SchemaValidator"
import _ from 'lodash'
import AppError from '../services/utility/AppError'

class HypothesisValidator extends SchemaValidator {

    getSchema() {
        return [
            {'paramName': 'description', 'type': 'text', 'lengthRange': {'min': 1, 'max': 300}, 'required': true},
            {'paramName': 'isNull', 'type': 'boolean', 'required': true},
            {'paramName': 'status', 'type': 'constant', 'data': ['INACTIVE', 'ACTIVE'], 'required': true},
            {'paramName': 'experimentId', 'type': 'refData', 'required': true},
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
        const uniqArray=_.uniq(_.map(hypothesisObj,(hypothesis)=>{
              _.pick(hypothesis,['description','experimentId','isNull'])
        }))

        if(uniqArray.length!==hypothesisObj.length){
            throw AppError.badRequest('Exact hypothesis already exist for some experiments')
        }
    }


}


module.exports = HypothesisValidator