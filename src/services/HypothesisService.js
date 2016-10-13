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

    createHypothesis(hypotheses) {

        return Promise.all(hypotheses.map((hypothesis)=> {
            return new HypothesisValidator().validate([hypothesis]).then(()=> {
                return new ExperimentsService().getExperimentById(hypothesis.experimentId).then(()=> {
                    return this.getHypothesisByExperimentAndDescriptionAndType(hypothesis.experimentId, hypothesis.description, hypothesis.isNull).then((hypothesisObj)=> {
                        if(hypothesisObj)
                            throw AppError.badRequest("Exact hypothesis already exist For the experimentId: "+hypothesis.experimentId)
                        return db.hypothesis.create(hypothesis)
                    })
                })

            })

        }))

    }

    getAllHypothesis() {
        return db.hypothesis.all()
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

    getHypothesisByExperimentAndDescriptionAndType(experimentId,description,isNull){
        return db.hypothesis.getHypothesisByExperimentAndDescriptionAndType(experimentId,description,isNull)
    }

    updateHypothesis(id,hypothesis) {
        return new HypothesisValidator().validate([hypothesis]).then(()=> {
            return this.getHypothesisById(id).then(()=> {
                return this.getHypothesisByExperimentAndDescriptionAndType(hypothesis.experimentId, hypothesis.description, hypothesis.isNull).then((hypothesisObj)=> {
                    if (hypothesisObj)
                        throw AppError.badRequest("Exact hypothesis already exist For the experimentId: " + hypothesis.experimentId)
                    return new ExperimentsService().getExperimentById(hypothesis.experimentId).then(()=> {
                        return db.hypothesis.update(id, hypothesis)
                    })

                })
            })
        })
    }


}
module.exports = HypothesisService