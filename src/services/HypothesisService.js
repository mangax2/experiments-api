/**
 * Created by kprat1 on 12/10/16.
 */
import db from "../db/DbManager"
import AppError from "./utility/AppError"
import AppUtil from "./utility/AppUtil"
import log4js from "log4js"
import HypothesisValidator from '../validations/HypothesisValidator'
import ExperimentsService from './ExperimentsService'
const logger = log4js.getLogger('HypothesisService')


class HypothesisService {

    constructor() {
        this._validator = new HypothesisValidator()
        this._experimentService = new ExperimentsService()
    }

    createHypothesis(hypotheses) {
        return this.validateHypothesis(hypotheses).then(()=> {
            return db.hypothesis.batchCreate(hypotheses)
        })

    }

    validateHypothesis(hypotheses) {
        return this._validator.validate(hypotheses).then(()=> {
            return Promise.all(hypotheses.map((hypothesis)=> {
                return this._experimentService.getExperimentById(hypothesis.experimentId).then(()=> {
                    return this.getHypothesisByExperimentAndDescriptionAndType(hypothesis.experimentId, hypothesis.description, hypothesis.isNull).then((hypothesisObj)=> {
                        if (hypothesisObj)
                            throw AppError.badRequest("Exact hypothesis already exist For the experimentId: " + hypothesis.experimentId)
                    })
                })


            }))
        })


    }

    getAllHypothesis() {
        return db.hypothesis.all()
    }

    getHypothesesByExperimentId(experimentId) {
        return db.experiments.find(experimentId).then((data) => {
            if (!data) {
                throw AppError.notFound('Experiment Not Found for requested experimentId')
            } else {
                return db.hypothesis.findByExperimentId(experimentId)

            }
        })

    }


    getHypothesisById(id) {
        return db.hypothesis.find(id).then((hypothesis)=> {
            if (!hypothesis) {
                throw AppError.notFound("Hypothesis Not Found")
            } else {
                return hypothesis
            }
        })
    }

    deleteHypothesis(id) {
        return db.hypothesis.remove(id).then((hypothesis)=> {
            if (!hypothesis) {
                throw AppError.notFound("Hypothesis Not Found")
            } else {
                return id
            }
        })

    }

    getHypothesisByExperimentAndDescriptionAndType(experimentId, description, isNull) {
        return db.hypothesis.getHypothesisByExperimentAndDescriptionAndType(experimentId, description, isNull)
    }

    updateHypothesis(id, hypothesis) {
        return this._validator.validate([hypothesis]).then(()=> {
            return this.getHypothesisById(id).then(()=> {
                return this.getHypothesisByExperimentAndDescriptionAndType(hypothesis.experimentId, hypothesis.description, hypothesis.isNull).then((hypothesisObj)=> {
                    if (hypothesisObj)
                        throw AppError.badRequest("Exact hypothesis already exist For the experimentId: " + hypothesis.experimentId)
                    return this._experimentService.getExperimentById(hypothesis.experimentId).then(()=> {
                        return db.hypothesis.update(id, hypothesis)
                    })

                })
            })
        })
    }


}
module.exports = HypothesisService