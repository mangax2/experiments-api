import db from "../db/DbManager"
import AppUtil from "./utility/AppUtil"
import AppError from "./utility/AppError"
import ExperimentsValidator from "../validations/ExperimentsValidator"
import log4js from "log4js"
import Transactional from '../decorators/transactional'

const logger = log4js.getLogger('ExperimentsService')

class ExperimentsService {

    constructor() {
        this._validator = new ExperimentsValidator()
    }

    createExperiment(experiments, context) {
        return this._validator.validate(experiments).then(() => {
            return db.experiments.repository().tx('tx1', (t) => {
                // This could be a problem when we start to pass multiple experiments
                return Promise.all(experiments.map(ex =>
                    db.experiments.create(t, ex, context)
                )).then(data => {
                    return AppUtil.createPostResponse(data)
                })
            })
        })
    }

    //FOR PARTIAL UPDATE SUPPORT:
    //
    // createExperiment(experiments, context) {
    //     return this._validator.validate(experiments,'POST').then(() => {
    //         return db.experiments.repository().tx('tx1', (t) => {
    //             return Promise.all(experiments.map(ex =>
    //                 db.experiments.create(t, ex, context)
    //             )).then(data => {
    //                 return AppUtil.createPostResponse(data)
    //             })
    //         })
    //     })
    // }

    getAllExperiments() {
        return db.experiments.all()
    }

    @Transactional('getExperimentById')
    getExperimentById(id, tx) {
        return db.experiments.find(id, tx).then((data) => {
            if (!data) {
                logger.error('Experiment Not Found for requested experimentId = ' + id)
                throw AppError.notFound('Experiment Not Found for requested experimentId')
            }
            else {
                return data
            }
        })
    }

    updateExperiment(id, experiment, context) {
        return this._validator.validate([experiment]).then(() => {
            return db.experiments.update(id, experiment, context).then((data) => {
                if (!data) {
                    logger.error("Experiment Not Found to Update for id = " + id)
                    throw AppError.notFound('Experiment Not Found to Update')
                } else {
                    return data
                }
            })
        })
    }

    //FOR PARTIAL UPDATE SUPPORT:
    //
    // updateExperiment(id, experiment, context) {
    //     return this._validator.validate([experiment], 'PUT').then(() => {
    //         return db.experiments.update(id, experiment, context).then((data) => {
    //             if (!data) {
    //                 logger.error("Experiment Not Found to Update for id = " + id)
    //                 throw AppError.notFound('Experiment Not Found to Update')
    //             } else {
    //                 return data
    //             }
    //         })
    //     })
    // }

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
}

module.exports = ExperimentsService
