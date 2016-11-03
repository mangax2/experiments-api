import db from "../db/DbManager"
import AppError from "./utility/AppError"
import AppUtil from "./utility/AppUtil"
import HypothesisValidator from '../validations/HypothesisValidator'
import ExperimentsService from './ExperimentsService'

class HypothesisService {
    constructor() {
        this._validator = new HypothesisValidator()
        this._experimentService = new ExperimentsService()
    }

    createHypothesis(hypotheses, context) {
        return this.validateHypothesis(hypotheses).then(()=> {
            return db.hypothesis.batchCreate(hypotheses, context).then(data => {
                return AppUtil.createPostResponse(data)
            })
        })
    }

    validateHypothesis(hypotheses) {
        return this._validator.validate(hypotheses)
    }

    getAllHypothesis() {
        return db.hypothesis.all()
    }

    getHypothesesByExperimentId(experimentId) {
        return this._experimentService.getExperimentById(experimentId).then(()=> {
            return db.hypothesis.findByExperimentId(experimentId)
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

    updateHypothesis(id, hypothesis, context) {
        const hypothesisRequestObj=hypothesis
        hypothesisRequestObj.id=id
        return this._validator.validate([hypothesisRequestObj]).then(()=> {
            return this.getHypothesisById(id).then(()=> {
                return db.hypothesis.update(id, hypothesis, context)
            })
        })
    }
}

module.exports = HypothesisService
