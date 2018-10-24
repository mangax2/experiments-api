import Transactional from '@monsantoit/pg-transactional'
import db from '../db/DbManager'
import AppUtil from './utility/AppUtil'
import OwnerValidator from '../validations/OwnerValidator'
import setErrorDecorator from '../decorators/setErrorDecorator'

const { setErrorCode } = setErrorDecorator()

// Error Codes 1JXXXX
class OwnerService {
  constructor() {
    this.validator = new OwnerValidator()
  }

  @setErrorCode('1J1000')
  @Transactional('batchCreateOwners')
  batchCreateOwners(experimentsOwners, context, tx) {
    return this.validator.validate(experimentsOwners, 'POST', tx, context)
      .then(() => db.owner.batchCreate(experimentsOwners, context, tx)
        .then(data => AppUtil.createPostResponse(data)))
  }

  @setErrorCode('1J2000')
  @Transactional('getOwnersByExperimentId')
  getOwnersByExperimentId = (id, tx) => db.owner.findByExperimentId(id, tx)

  @setErrorCode('1J3000')
  @Transactional('getOwnersByExperimentIds')
  getOwnersByExperimentIds = (ids, tx) => db.owner.batchFindByExperimentIds(ids, tx)

  @setErrorCode('1J4000')
  @Transactional('batchUpdateOwners')
  batchUpdateOwners(experimentsOwners, context, tx) {
    return this.validator.validate(experimentsOwners, 'PUT', tx, context)
      .then(() => db.owner.batchUpdate(experimentsOwners, context, tx)
        .then(data => AppUtil.createPutResponse(data)))
  }
}

module.exports = OwnerService
