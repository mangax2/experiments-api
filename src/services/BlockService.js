import _ from 'lodash'
import Transactional from '@monsantoit/pg-transactional'
import db from '../db/DbManager'

const { setErrorCode } = require('@monsantoit/error-decorator')()

// TODO need to add @notifyChanges to the calls

// Error Codes 21XXXX
class BlockService {
  @setErrorCode('211000')
  @Transactional('updateBlocksByExperimentId')
  updateBlockNamesByExperimentId = (experimentId, blockNames, context, tx) =>
    db.block.findByExperimentId(experimentId).then((blocksInDB) => {
      const inputBlockNames = _.uniqWith(blockNames, _.isEqual)
      const namesToAdd = _.filter(inputBlockNames, b =>
        _.isNil(_.find(blocksInDB, bInDB => bInDB.name === b)))
      const deleteBlocks = _.filter(blocksInDB,
        b => _.isNil(_.find(inputBlockNames, name => name === b.name)))

      const createPromise = _.isEmpty(namesToAdd) ?
        null : db.block.batchCreateByExperimentId(experimentId, namesToAdd, context, tx)
      const deletePromise = _.isEmpty(deleteBlocks) ?
        null : db.block.batchRemove(_.map(deleteBlocks, 'id'), context, tx)

      const promises = _.compact([createPromise, deletePromise])
      return _.isEmpty(promises) ? Promise.resolve() : Promise.all(promises)
    })
}

module.exports = BlockService
