'use strict'

const BaseValidator = require('./BaseValidator')


class ExperimentsValidator extends BaseValidator {

    constructor() {
        super()
        this.experimentSchema = {
            'name': {'paramName': 'name', 'type': 'text', 'lengthRange': {'min': 1, 'max': 10}, 'required': true},
            'subjectType': {'paramName': 'subjectType', 'type': 'text', 'lengthRange': {'min': 1, 'max': 10}, 'required': true},
            'reps': {'paramName': 'reps', 'type': 'numeric', 'numericRange': {'min': 1, 'max': 100}, 'required': true},
            'refExperimentDesignId':{'paramName': 'refExperimentDesignId', 'type': 'refData', 'required': true},
            'status':{'paramName': 'status', 'type': 'constant', 'data':['DRAFT','ACTIVE'], 'required': true}

        }
    }

    validate(experiments){

      return  Promise.all(
            experiments.map(experiment=> this.validateExperiment(experiment))

        )


    }

    validateExperiment(experiment){

        return new Promise((resolve, reject) => {
            // this.maxLength(experiment.name, experimentConstraints.name.length, experimentConstraints.name.paramName)
            this.schemaCheck(experiment.name, this.experimentSchema.name)
            this.schemaCheck(experiment.subjectType, this.experimentSchema.subjectType)
            this.schemaCheck(experiment.reps, this.experimentSchema.reps)
            this.schemaCheck(experiment.refExperimentDesignId, this.experimentSchema.refExperimentDesignId)
            this.schemaCheck(experiment.status, this.experimentSchema.status)


            this.check()
            resolve()
            }
        )

    }

}

module.exports = ExperimentsValidator
