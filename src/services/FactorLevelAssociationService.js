import Transactional from '@monsantoit/pg-transactional'
import db from '../db/DbManager'
import AppUtil from './utility/AppUtil'
import FactorLevelAssociationsValidator from '../validations/FactorLevelAssociationValidator'
import setErrorDecorator from '../decorators/setErrorDecorator'

const { setErrorCode } = setErrorDecorator()

// Error Codes 1BXXXX
class FactorLevelAssociationService {
  constructor() {
    this.validator = new FactorLevelAssociationsValidator()
  }

  @setErrorCode('1B1000')
  @Transactional('getFactorLevelAssociationByExperimentId')
  static getFactorLevelAssociationByExperimentId(id, tx) {
    return db.factorLevelAssociation.findByExperimentId(id, tx)
  }

  @setErrorCode('1B2000')
  @Transactional('batchDeleteFactorLevelAssociations')
  static batchDeleteFactorLevelAssociations(ids, tx) {
    return db.factorLevelAssociation.batchRemove(ids, tx)
  }

  @setErrorCode('1B3000')
  @Transactional('batchCreateFactorLevelAssociations')
  batchCreateFactorLevelAssociations =
    (factorLevelAssociations, context, tx) =>
      this.validator.validate(factorLevelAssociations, 'POST', tx)
        .then(() => db.factorLevelAssociation.batchCreate(factorLevelAssociations, context, tx)
          .then(data => AppUtil.createPostResponse(data)))
}

module.exports = FactorLevelAssociationService
