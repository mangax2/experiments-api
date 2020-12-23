import _ from 'lodash'
import Transactional from '@monsantoit/pg-transactional'
import db from '../db/DbManager'
import BlockValidator from '../validations/BlockValidator'
import SecurityService from './SecurityService'
import AppError from './utility/AppError'

const { setErrorCode, getFullErrorCode } = require('@monsantoit/error-decorator')()

// Error Codes 21XXXX
class BlockService {
  constructor() {
    this.validator = new BlockValidator()
    this.securityService = new SecurityService()
  }

  @setErrorCode('211000')
  @Transactional('createOnlyNewBlocksByExperimentId')
  createOnlyNewBlocksByExperimentId = (experimentId, blockNames, context, tx) =>
    db.block.findByExperimentId(experimentId, tx)
      .then((blocksInDB) => {
        const inputBlockNames = _.uniqWith(blockNames, _.isEqual)
        const namesToAdd = _.filter(inputBlockNames, b =>
          _.isNil(_.find(blocksInDB, bInDB => bInDB.name === b)))

        return db.block.batchCreateByExperimentId(experimentId, namesToAdd, context, tx)
      })

  @setErrorCode('212000')
  @Transactional('removeBlocksByExperimentId')
  removeBlocksByExperimentId = (experimentId, blockNamesToKeep, tx) =>
    Promise.all([
      db.block.findByExperimentId(experimentId, tx),
      db.locationAssociation.findByExperimentId(experimentId, tx),
    ]).then(([blocksInDB, locationAssociationsInDB]) => {
      const inputBlockNames = _.uniqWith(blockNamesToKeep, _.isEqual)
      const blocksToRemove = _.filter(blocksInDB, b => !_.includes(inputBlockNames, b.name))

      const blocksToRemoveWithLocationAssociation =
        BlockService.getBlocksToRemoveWithLocationAssociation(
          blocksToRemove, locationAssociationsInDB)
      if (!_.isEmpty(blocksToRemoveWithLocationAssociation)) {
        throw AppError.badRequest('Cannot remove blocks that already have sets associated to them', blocksToRemoveWithLocationAssociation, getFullErrorCode('212001'))
      }

      return db.block.batchRemove(_.map(blocksToRemove, 'id'), tx)
    })

  static getBlocksToRemoveWithLocationAssociation = (blocksToRemove, locationAssociationsInDB) => {
    const locationBlockIds = _.map(locationAssociationsInDB, 'block_id')
    return _.filter(blocksToRemove, block => _.includes(locationBlockIds, block.id))
  }

  @setErrorCode('213000')
  @Transactional('renameBlocks')
  renameBlocks = (experimentId, isTemplate, renamedBlocks, context, tx) =>
    this.securityService.permissionsCheck(experimentId, context, isTemplate, tx)
      .then(() => this.validator.validate(renamedBlocks, 'PATCH', tx))
      .then(() => db.block.findByExperimentId(experimentId))
      .then((blocksFromDb) => {
        const blocksNotInExperiment = _.differenceBy(renamedBlocks, blocksFromDb, 'id')
        if (blocksNotInExperiment.length > 0) {
          throw AppError.badRequest('At least one block does not belong to the specified experiment', blocksNotInExperiment, getFullErrorCode('213001'))
        }
        return db.block.batchUpdate(renamedBlocks, context, tx)
      })
}

module.exports = BlockService
