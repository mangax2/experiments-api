'use strict'

const BaseValidator = require('./BaseValidator')


class ExperimentsValidator extends BaseValidator {


    validate(experiments){

      return  Promise.all(
            experiments.map(experiment=> this.validateExperiment(experiment))

        )


    }

    validateExperiment(experiment){

        return new Promise((resolve, reject) => {
            this.maxLength(experiment.name, 10, 'name')
            this.check()
            resolve()
            }
        )

    }

}

module.exports = ExperimentsValidator
