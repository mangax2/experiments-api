import db from '../db/DbManager'
import AppUtil from './utility/AppUtil'
import OwnerValidator from '../validations/OwnerValidator'
import Transactional from '../decorators/transactional'

class OwnerService {

  constructor() {
    this.validator = new OwnerValidator()
  }

  @Transactional('batchCreateTags')
  batchCreateOwners(experimentsOwners, context, tx) {
    return this.validator.validate(experimentsOwners, 'POST', tx, context)
      .then(() => db.owner.batchCreate(experimentsOwners, context, tx)
        .then(data => AppUtil.createPostResponse(data)))
  }

  @Transactional('getTagsByExperimentId')
  getOwnersByExperimentId = (id, tx) => db.owner.findByExperimentId(id, tx)

  @Transactional('getTagsByExperimentIds')
  getOwnersByExperimentIds = (ids, tx) => db.owner.batchFindByExperimentIds(ids, tx)

  @Transactional('batchUpdateTags')
  batchUpdateOwners(experimentsOwners, context, tx) {
    return this.validator.validate(experimentsOwners, 'PUT', tx, context)
      .then(() => db.owner.batchUpdate(experimentsOwners, context, tx)
        .then(data => AppUtil.createPutResponse(data)))
  }
}

module.exports = OwnerService
