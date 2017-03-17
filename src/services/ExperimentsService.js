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

    getExperiments(queryString) {
        if (this._isFilterRequest(queryString) === true) {
            return this._getExperimentsByFilters(queryString)
        } else {
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
                return this._tagService.getTagsByExperimentId(id, tx).then((dbTags) => {
                    data["tags"] = dbTags
                    return data
                })
            }
        })
    }

    @Transactional('updateExperiment')
    updateExperiment(id, experiment, context, tx) {
        return this._validator.validate([experiment], 'PUT', tx).then(() => {
            return db.experiments.update(id, experiment, context, tx).then((data) => {
                if (!data) {
                    logger.error("Experiment Not Found to Update for id = " + id)
                    throw AppError.notFound('Experiment Not Found to Update')
                } else {
                    return this._tagService.deleteTagsForExperimentId(id, tx).then(() => {
                        const tags = this._assignExperimentIdToTags([id], [experiment])
                        if (tags.length > 0) {
                            return this._tagService.batchCreateTags(tags, context, tx).then(() => {
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

    _getExperimentsByFilters(queryString) {
        return this._validator.validate([queryString], 'FILTER').then(() => {
            const lowerCaseTagNames = this._toLowerCaseArray(queryString['tags.name'])
            const lowerCaseTagValues = this._toLowerCaseArray(queryString['tags.value'])
            return db.experiments.findExperimentsByTags(lowerCaseTagNames, lowerCaseTagValues)
        })
    }

    _getAllExperiments() {
        return db.experiments.all()
    }

    _assignExperimentIdToTags(experimentIds, experiments) {
        return _.compact(_.flatMap(experimentIds, (id, index) => {
            const tags = experiments[index].tags
            if(tags && tags.length > 0){
                _.forEach(tags, function(tag) {
                    tag.experimentId = id
                    tag.name = tag.name.toLowerCase()
                    tag.value = tag.value.toLowerCase()
                })
            }
            return experiments[index].tags
        }))
    }

    _isFilterRequest(queryString) {
        const allowedFilters = ['tags.name', 'tags.value']
        return !_.isEmpty(queryString) && _.intersection(Object.keys(queryString), allowedFilters).length > 0
    }

    _toLowerCaseArray(queryStringValue) {
        return queryStringValue ? _.map(queryStringValue.split(','), _.toLower) : []
    }
}

module.exports = ExperimentsService
