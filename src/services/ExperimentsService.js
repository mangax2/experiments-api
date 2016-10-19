import db from "../db/DbManager"
import AppUtil from "./utility/AppUtil"
import AppError from "./utility/AppError"
import ExperimentsValidator from "../validations/ExperimentsValidator"
import log4js from "log4js"

const logger = log4js.getLogger('ExperimentsService')

class ExperimentsService {

    constructor() {
        this._validator = new ExperimentsValidator()
    }

    createExperiment(experiments) {
        return this._validator.validate(experiments).then(() => {
            return db.experiments.repository().tx('tx1', (t) => {
                return Promise.all(experiments.map(ex =>
                    db.experiments.create(t, ex)
                )).then(data => {
                    return AppUtil.createPostResponse(data)
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
                logger.error('Experiment Not Found for requested experimentId = ' + id)
                throw AppError.notFound('Experiment Not Found for requested experimentId')
            }
            else {
                return data
            }
        })
    }

    updateExperiment(id, experiment) {
        return this._validator.validate([experiment]).then(() => {
            return db.experiments.update(id, experiment).then((data) => {
                if (!data) {
                    logger.error("Experiment Not Found to Update for id = " + id)
                    throw AppError.notFound('Experiment Not Found to Update')
                } else {
                    return data
                }
            })
        })
    }

    deleteExperiment(id) {
        return db.experiments.remove(id).then((data) => {
            if (!data) {
                logger.error("Experiment Not Found for requested experimentId = " + id)
                throw AppError.notFound('Experiment Not Found for requested experimentId')
            }
            else {
                return data
            }
        })
    }

    // validator() {
    //     return new ExperimentsValidator()
    // }
}

module.exports = ExperimentsService
