import db from '../db/DbManager'
import AppUtil from './utility/AppUtil'
import AppError from './utility/AppError'
import Transactional from '../decorators/transactional'

class DuplicationService {
  @Transactional('DuplicateExperiment')
  static duplicateExperiment(body, context, tx) {
    if (body && body.id) {
      return db.duplication.duplicateExperiment(body.id, context, tx)
        .then((newExperimentId) => {
          if (newExperimentId) {
            return AppUtil.createPostResponse([newExperimentId])
          }
          throw AppError.badRequest(`Experiment Not Found To Duplicate For Id: ${body.id}`)
        })
    }
    throw AppError.badRequest('Body must contain an experiment id to duplicate')
  }
}

module.exports = DuplicationService
