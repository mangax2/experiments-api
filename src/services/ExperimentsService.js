import db from "../db/DbManager"
import AppUtil from "./utility/AppUtil"
import AppError from "./utility/AppError"
import ExperimentsValidator from "../validations/ExperimentsValidator"
import log4js from "log4js"
import Transactional from '../decorators/transactional'
import _ from 'lodash'


const logger = log4js.getLogger('ExperimentsService')

class ExperimentsService {

    constructor() {
        this._validator = new ExperimentsValidator()
    }

    @Transactional('batchCreateExperiments')
    batchCreateExperiments(experiments, context, tx) {
        return this._validator.validate(experiments, 'POST', tx).then(() => {
            return db.experiments.batchCreate(experiments, context, tx).then((data) => {
                return AppUtil.createPostResponse(data)
            })
        })
    }

    getExperiments(query) {
        if(this._isFilterRequest(query) === true){
           return this._getExperimentsByFilters(query)
        } else{
            return this._getAllExperiments()
        }
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
        return this._validator.validate([experiment], 'PUT').then(() => {
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

    _isFilterRequest(query) {
        const allowedFilters = ['tags.name', 'tags.value']
        return !_.isEmpty(query) && _.intersection(Object.keys(query), allowedFilters).length > 0
    }
    _getExperimentsByFilters(query){
        return this._validator.validate([query], 'FILTER').then(()=> {
            const lowerCaseTagNames =  this._toLowerCaseArray(query['tags.name'])
            const lowerCaseTagValues = this._toLowerCaseArray(query['tags.value'])
            return db.experiments.findExperimentsByTags(lowerCaseTagNames, lowerCaseTagValues)
        })
    }

    _getAllExperiments(){
        return db.experiments.all()
    }

    _toLowerCaseArray(queryStringValue){
        return queryStringValue? _.map(queryStringValue.split(','), _.toLower ): []
    }
}

module.exports = ExperimentsService
