import db from '../db/DbManager'
import AppUtil from './utility/AppUtil'
import FactorLevelAssociationsValidator from '../validations/FactorLevelAssociationValidator'
import Transactional from '../decorators/transactional'

class FactorLevelAssociationService {
  constructor() {
    this.validator = new FactorLevelAssociationsValidator()
  }

  @Transactional('getFactorLevelAssociationByExperimentId')
  static getFactorLevelAssociationByExperimentId(id, tx) {
    return db.factorLevelAssociation.findByExperimentId(id, tx)
  }

  @Transactional('batchDeleteFactorLevelAssociations')
  static batchDeleteFactorLevelAssociations(ids, tx) {
    return db.factorLevelAssociation.batchRemove(ids, tx)
  }

  @Transactional('batchCreateFactorLevelAssociations')
  batchCreateFactorLevelAssociations =
    (factorLevelAssociations, context, tx) =>
      this.validator.validate(factorLevelAssociations, 'POST', tx)
        .then(() => db.factorLevelAssociation.batchCreate(factorLevelAssociations, context, tx)
          .then(data => AppUtil.createPostResponse(data)))
}

module.exports = FactorLevelAssociationService
