import db from '../db/DbManager'
import AppUtil from './utility/AppUtil'
import AppError from './utility/AppError'
import Transactional from '../decorators/transactional'
import TagService from './TagService'

class DuplicationService {

  constructor() {
    this.tagService = new TagService()
  }

  @Transactional('DuplicateExperiment')
  duplicateExperiment(body, context, tx) {
    if (body && body.id) {
      return db.duplication.duplicateExperiment(body.id, context, tx)
        .then((newExperimentIdObject) => {
          if (newExperimentIdObject) {
            return this.tagService.copyTags(body.id, newExperimentIdObject.id, context)
              .then(() => AppUtil.createPostResponse([newExperimentIdObject])).catch(() => {
                throw AppError.badRequest('Duplications Failed, Tagging API returned error')
              })
          }
          throw AppError.badRequest(`Experiment Not Found To Duplicate For Id: ${body.id}`)
        })
    }
    throw AppError.badRequest('Body must contain an experiment id to duplicate')
  }
}

module.exports = DuplicationService
