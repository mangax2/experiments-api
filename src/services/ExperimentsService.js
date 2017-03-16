import db from "../db/DbManager"
import AppUtil from "./utility/AppUtil"
import AppError from "./utility/AppError"
import ExperimentsValidator from "../validations/ExperimentsValidator"
import TagService from "./TagService"
import log4js from "log4js"
import _ from "lodash"
import Transactional from '../decorators/transactional'

const logger = log4js.getLogger('ExperimentsService')

class ExperimentsService {

    constructor() {
        this._validator = new ExperimentsValidator()
        this._tagService = new TagService()
    }

    @Transactional('batchCreateExperiments')
    batchCreateExperiments(experiments, context, tx) {
        return this._validator.validate(experiments, 'POST', tx).then(() => {
            return db.experiments.batchCreate(experiments, context, tx).then((data) => {
                const experimentIds = _.map(data, (d) => d.id)
                const tags = this._assignExperimentIdToTags(experimentIds, experiments)
                if(tags && tags.length > 0){
                    return this._tagService.batchCreateTags(tags, context, tx).then(()=>{
                        return AppUtil.createPostResponse(data)
                    })
                }
                return AppUtil.createPostResponse(data)
            })
        })
    }

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
                return this._tagService.getTagsByExperimentId(id, tx).then((dbTags)=>{
                    data["tags"] = dbTags
                    return data
                })
            }
        })
    }

    @Transactional('updateExperiment')
    updateExperiment(id, experiment, context, tx) {
        return this._validator.validate([experiment], tx).then(() => {
            return db.experiments.update(id, experiment, context, tx).then((data) => {
                if (!data) {
                    logger.error("Experiment Not Found to Update for id = " + id)
                    throw AppError.notFound('Experiment Not Found to Update')
                } else {
                    return this._tagService.deleteTagsForExperimentId(id, tx).then(()=>{
                        const tags = this._assignExperimentIdToTags([id], [experiment])
                        if(tags.length > 0){
                            return this._tagService.batchCreateTags(tags, context, tx).then(()=>{
                                return data
                            })
                        }
                        return data
                    })

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

    _assignExperimentIdToTags(experimentIds, experiments){
        return _.compact(_.flatMap(experimentIds, (id, index)=>{
            const tags = experiments[index].tags
            if(tags && tags.length > 0){
                _.forEach(tags, function(tag){tag.experimentId = id})
            }
            return experiments[index].tags
        }))
    }
}

module.exports = ExperimentsService
