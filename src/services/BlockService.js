import _ from 'lodash'
import Transactional from '@monsantoit/pg-transactional'
import db from '../db/DbManager'

const { setErrorCode } = require('@monsantoit/error-decorator')()

// Error Codes 21XXXX
class BlockService {
  @setErrorCode('211000')
  @Transactional('createBlocksByExperimentId')
  createBlocksByExperimentId = (experimentId, blockNames, context, tx) =>
    db.block.findByExperimentId(experimentId, tx)
      .then((blocksInDB) => {
        const inputBlockNames = _.uniqWith(blockNames, _.isEqual)
        const namesToAdd = _.filter(inputBlockNames, b =>
          _.isNil(_.find(blocksInDB, bInDB => bInDB.name === b)))

        return db.block.batchCreateByExperimentId(experimentId, namesToAdd, context, tx)
      })

  @setErrorCode('212000')
  @Transactional('removeBlocksByExperimentId')
  removeBlocksByExperimentId = (experimentId, blockNames, tx) =>
    db.block.findByExperimentId(experimentId, tx)
      .then((blocksInDB) => {
        const inputBlockNames = _.uniqWith(blockNames, _.isEqual)
        const blocksToRemove = _.filter(blocksInDB, b => !_.includes(inputBlockNames, b.name))

        return db.block.batchRemove(_.map(blocksToRemove, 'id'), tx)
      })
}

module.exports = BlockService
