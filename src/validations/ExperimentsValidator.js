'use strict'

const BaseValidator = require('./BaseValidator')
const SchemaValidator= require ('./SchemaValidator')


class ExperimentsValidator extends SchemaValidator {


    getSchema(){
        return {
            'name': {'paramName': 'name', 'type': 'text', 'lengthRange': {'min': 1, 'max': 50}, 'required': true},
            'subjectType': {
                'paramName': 'subjectType',
                'type': 'text',
                'lengthRange': {'min': 1, 'max': 100},
                'required': true
            },
            'reps': {'paramName': 'reps', 'type': 'numeric', 'numericRange': {'min': 1, 'max': 1000}, 'required': true},
            'refExperimentDesignId': {'paramName': 'refExperimentDesignId', 'type': 'refData', 'required': true},
            'status': {'paramName': 'status', 'type': 'constant', 'data': ['DRAFT', 'ACTIVE'], 'required': true},
            'userId':{'paramName': 'userId', 'type': 'text', 'lengthRange': {'min': 1, 'max': 50}, 'required': true}
        }
    }

    performValidations(targetObject){
        return Promise.all(
            targetObject.map(experiment=> super.performValidations(experiment))
        )


    }
}

module.exports = ExperimentsValidator
