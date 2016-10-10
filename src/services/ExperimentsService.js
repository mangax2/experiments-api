'use strict'
const db = require('../db/DbManager')
const AppUtil = require('./utility/AppUtil')
const AppError = require('./utility/AppError')
const ExperimentsValidator = require('../validations/ExperimentsValidator')
const log4js = require('log4js')
const logger = log4js.getLogger('ExperimentsService')

class ExperimentsService {

    createExperiment(experiments) {
        return this.validator().validate(experiments).then(() => {
            return   Promise.all(experiments.map(exp =>
                db.experimentDesign.find(exp.refExperimentDesignId).then((d) =>{
                    if (!d) {
                        logger.error('Invalid refExperimentDesignId')
                        throw   AppError.badRequest('Invalid refExperimentDesignId')
                    }
                })
            )).then(() => {
                return db.experiments.repository().tx('tx1', (t) => {
                    return Promise.all(experiments.map(ex =>
                        db.experiments.create(t, ex)
                    )).then(data => {
                        return AppUtil.createPostResponse(data)
                    })
                })
            })
        })
    }

    getAllExperiments() {
        return db.experiments.all()
    }

    getExperimentById(id) {
        return db.experiments.find(id).then((data) => {
            if (!data) {
                logger.error('Experiment Not Found for requested experimentId'+id)
                throw   AppError.notFound('Experiment Not Found for requested experimentId')
            }
            else {
                return data
            }
        })
    }

    updateExperiment(id, experiment) {
        return new ExperimentsValidator().validate([experiment]).then(() => {
            return db.experiments.update(id, experiment).then((data) => {
                if (!data) {
                    logger.error("Experiment Not Found to Update for id= "+id)
                    throw   AppError.notFound('Experiment Not Found to Update')
                } else {
                    return data
                }
            })
        })
    }

    deleteExperiment(id) {
        return db.experiments.remove(id).then((data) => {
            if (!data) {
                logger.error("Experiment Not Found for requested experimentId= "+id)
                throw   AppError.notFound('Experiment Not Found for requested experimentId')
            }
            else {
                return data
            }
        })
    }

    validator(){
        new ExperimentsValidator()
    }
}

module.exports = ExperimentsService
