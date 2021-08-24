import Transactional from '@monsantoit/pg-transactional'
import { dbRead, dbWrite } from '../db/DbManager'
import AppUtil from './utility/AppUtil'
import OwnerValidator from '../validations/OwnerValidator'

const { setErrorCode } = require('@monsantoit/error-decorator')()

// Error Codes 1JXXXX
class OwnerService {
  constructor() {
    this.validator = new OwnerValidator()
  }

  @setErrorCode('1J1000')
  @Transactional('batchCreateOwners')
  batchCreateOwners(experimentsOwners, context, tx) {
    return this.validator.validate(experimentsOwners, 'POST', context)
      .then(() => dbWrite.owner.batchCreate(experimentsOwners, context, tx)
        .then(data => AppUtil.createPostResponse(data)))
  }

  @setErrorCode('1J2000')
  getOwnersByExperimentId = id => dbRead.owner.findByExperimentId(id)

  @setErrorCode('1J3000')
  getOwnersByExperimentIds = ids => dbRead.owner.batchFindByExperimentIds(ids)

  @setErrorCode('1J4000')
  @Transactional('batchUpdateOwners')
  batchUpdateOwners(experimentsOwners, context, tx) {
    return this.validator.validate(experimentsOwners, 'PUT', context)
      .then(() => dbWrite.owner.batchUpdate(experimentsOwners, context, tx)
        .then(data => AppUtil.createPutResponse(data)))
  }
}

module.exports = OwnerService
