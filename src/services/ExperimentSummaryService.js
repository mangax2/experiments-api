import db from "../db/DbManager"
import AppError from "./utility/AppError"
import log4js from "log4js"

const logger = log4js.getLogger('ExperimentSummaryService')

class ExperimentSummaryService {

    getExperimentSummaryById(id) {
        return db.experimentSummary.find(id).then((data) => {
            if(!data) {
                logger.error('Experiment Summary Not Found for requested experimentId = ' + id)
                throw AppError.notFound('Experiment Summary Not Found for requested experimentId')
            }
            else {
                return data
            }
        })
    }
}

module.exports = ExperimentSummaryService