import _ from 'lodash'
import db from '../db/DbManager'
import AppUtil from './utility/AppUtil'
import AppError from './utility/AppError'
import Transactional from '../decorators/transactional'
import TagService from './TagService'

class DuplicationService {

  constructor() {
    this.tagService = new TagService()
  }

  @Transactional('DuplicateExperiments')
  duplicateExperiments(body, context, tx) {
    const promiseArrays = []
    if (body && body.ids && body.ids.length > 0 && Number(body.numberOfCopies) > 0) {
      _.forEach(body.ids, (id) => {
        for (let i = 0; i < body.numberOfCopies; i += 1) {
          promiseArrays.push(this.duplicateExperiment(id, context, tx))
        }
      })
      return Promise.all(promiseArrays)
        .then(idObjects => AppUtil.createPostResponse(idObjects))
    }
    throw AppError.badRequest('Body must contain at least one experiment id to duplicate and the number of copies to make.')
  }

  @Transactional('DuplicateExperiment')
  duplicateExperiment(id, context, tx) {
    return db.duplication.duplicateExperiment(id, context, tx)
      .then((newExperimentIdObject) => {
        if (newExperimentIdObject) {
          return this.tagService.copyTags(id, newExperimentIdObject.id, context)
            .then(() => newExperimentIdObject).catch(() => {
              throw AppError.badRequest('Duplications Failed, Tagging API returned error')
            })
        }
        throw AppError.badRequest(`Experiment Not Found To Duplicate For Id: ${id}`)
      })
  }
}

module.exports = DuplicationService
