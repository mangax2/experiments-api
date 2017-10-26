import db from '../db/DbManager'
import Transactional from '../decorators/transactional'

class FactorLevelAssociationService {
  @Transactional('getFactorLevelAssociationByExperimentId')
  static getFactorLevelAssociationByExperimentId(id, tx) {
    return db.factorLevelAssociation.findByExperimentId(id, tx)
  }
}

module.exports = FactorLevelAssociationService
