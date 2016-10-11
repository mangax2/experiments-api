/**
 * Created by kprat1 on 12/10/16.
 */
import db from "../db/DbManager"
import AppError from "./utility/AppError"
import log4js from "log4js"
const logger = log4js.getLogger('HypothesisService')


class HypothesisService {

    createHypothesis() {

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

    updateHypothesis() {

    }


}


module.exports = HypothesisService