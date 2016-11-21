import SchemaValidator from './SchemaValidator'
import * as _ from 'lodash'
import AppError from '../services/utility/AppError'
import db from '../db/DbManager'

class ExperimentsValidator extends SchemaValidator {
    getSchema() {
        return [
            {'paramName': 'name', 'type': 'text', 'lengthRange': {'min': 1, 'max': 50}, 'required': true},
            {'paramName': 'subjectType', 'type': 'text', 'lengthRange': {'min': 0, 'max': 100}},
            {'paramName': 'refExperimentDesignId', 'type': 'refData', 'entity': db.experimentDesign},
            {'paramName': 'status', 'type': 'constant', 'data': ['DRAFT', 'ACTIVE'], 'required': true},
        ]
    }

    getEntityName(){
        return 'Experiment'
    }

    //FOR PARTIAL UPDATE SUPPORT:
    //
    // getSchema(operationName) {
    //     switch(operationName){
    //         case 'POST':
    //             return [
    //                 {'paramName': 'name', 'type': 'text', 'lengthRange': {'min': 1, 'max': 50}, 'required': true},
    //                 {'paramName': 'subjectType', 'type': 'text', 'lengthRange': {'min': 0, 'max': 100}},
    //                 {'paramName': 'refExperimentDesignId', 'type': 'refData', 'entity': db.experimentDesign},
    //                 {'paramName': 'status', 'type': 'constant', 'data': ['DRAFT', 'ACTIVE'], 'required': true}
    //             ]
    //         case 'PUT':
    //             return [
    //                 {'paramName': 'experimentId', 'type': 'refData', 'entity': db.experiments, 'required': true},
    //                 {'paramName': 'name', 'type': 'text', 'lengthRange': {'min': 1, 'max': 50}},
    //                 {'paramName': 'subjectType', 'type': 'text', 'lengthRange': {'min': 0, 'max': 100}},
    //                 {'paramName': 'refExperimentDesignId', 'type': 'refData', 'entity': db.experimentDesign},
    //                 {'paramName': 'status', 'type': 'constant', 'data': ['DRAFT', 'ACTIVE']}
    //             ]
    //         default:
    //             throw `No Experiments Schema For Supplied Operation Type: ${operationName}`
    //     }
    // }

    preValidate(factorObj) {
        if (!_.isArray(factorObj) || factorObj.length == 0) {
            return Promise.reject(
                AppError.badRequest('Experiments request object needs to be an array'))
        } else {
            return Promise.resolve()
        }
    }

    postValidate(targetObject) {
        // No business key to validate
        return Promise.resolve()
    }

    //FOR PARTIAL UPDATE SUPPORT:
    //
    // performValidations(targetObject, operationName) {
    //     if (_.isArray(targetObject) && targetObject.length>0) {
    //         return Promise.all(
    //             _.map(targetObject, experiment=> super.performValidations(experiment, operationName))
    //         )
    //     } else {
    //         throw AppError.badRequest('Experiments request object needs to be an array')
    //     }
    // }
}

module.exports = ExperimentsValidator
