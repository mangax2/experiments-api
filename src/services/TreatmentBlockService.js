import _ from 'lodash'
import Transactional from '@monsantoit/pg-transactional'
import db from '../db/DbManager'
import AppError from './utility/AppError'
import BlockService from './BlockService'
import LocationAssociationWithBlockService from './LocationAssociationWithBlockService'

const { getFullErrorCode, setErrorCode } = require('@monsantoit/error-decorator')()

const areTreatmentBlocksEqual = (tb, tbInDB) =>
  tbInDB.treatment_id === tb.treatmentId && tbInDB.block_id === tb.blockId

const areTreatmentBlocksNearlyEqual = (tb, tbInDB) =>
  tbInDB.treatment_id === tb.treatmentId && !tbInDB.used

const findAndHandleMatch = (requestTb, databaseTbs, matchingFunc, isUpdateNeeded) => {
  const matchingDbTb = _.find(databaseTbs,
    databaseTb => matchingFunc(requestTb, databaseTb))

  if (matchingDbTb) {
    matchingDbTb.used = true
    requestTb.id = matchingDbTb.id
    requestTb.shouldBeUpdated = isUpdateNeeded(requestTb, matchingDbTb)
  }
}

const isUpdateNeededForExactMatch = (tb, tbInDb) => tb.numPerRep !== tbInDb.num_per_rep

// Error Codes 1VXXXX
class TreatmentBlockService {
  constructor(
    blockService = new BlockService(),
    locAssocService = new LocationAssociationWithBlockService(),
    dbRepos = db,
  ) {
    this.blockService = blockService
    this.locationAssocWithBlockService = locAssocService
    this.db = dbRepos
  }

  @setErrorCode('1V1000')
  @Transactional('getTreatmentBlocksByExperimentId')
  getTreatmentBlocksByExperimentId = (id, tx) => db.block.findByExperimentId(id, tx)
    .then(blocks => (_.isEmpty(blocks) ? Promise.resolve([]) :
      db.treatmentBlock.batchFindByBlockIds(_.map(blocks, 'id'), tx)
        .then(treatmentBlocks => this.getTreatmentBlocksWithBlockInfo(treatmentBlocks, blocks))))

  @setErrorCode('1V2000')
  @Transactional('getTreatmentBlocksBySetId')
  getTreatmentBlocksBySetId = (setId, tx) =>
    this.locationAssocWithBlockService.getBySetId(setId, tx)
      .then(locAssociation => (_.isNil(locAssociation) ? Promise.resolve([]) :
        tx.batch([db.block.findByBlockId(locAssociation.block_id, tx),
          db.treatmentBlock.findByBlockId(locAssociation.block_id, tx)])
          .then(([block, treatmentBlocks]) =>
            this.getTreatmentBlocksWithBlockInfo(treatmentBlocks, [block]))
      ))

  @setErrorCode('1VK000')
  @Transactional('getTreatmentBlocksByTreatmentIds')
  getTreatmentBlocksByTreatmentIds = (treatmentIds, tx) =>
    (_.isEmpty(treatmentIds) ? Promise.resolve([]) :
      db.treatmentBlock.batchFindByTreatmentIds(treatmentIds, tx)
        .then(treatmentBlocks =>
          db.block.batchFindByBlockIds(_.uniq(_.map(treatmentBlocks, 'block_id')), tx)
            .then(blocks => this.getTreatmentBlocksWithBlockInfo(treatmentBlocks, blocks)),
        ))

  @setErrorCode('1VL000')
  @Transactional('getTreatmentBlocksByIds')
  getTreatmentBlocksByIds = (ids, tx) =>
    (_.isEmpty(ids) ? Promise.resolve([]) :
      db.treatmentBlock.batchFindByIds(ids, tx)
        .then(treatmentBlocks =>
          db.block.batchFindByBlockIds(_.uniq(_.map(treatmentBlocks, 'block_id')), tx)
            .then(blocks => this.getTreatmentBlocksWithBlockInfo(treatmentBlocks, blocks)),
        )
    )

  @setErrorCode('1V3000')
  getTreatmentBlocksWithBlockInfo = (treatmentBlocks, blocks) => _.map(treatmentBlocks, (tb) => {
    const block = _.find(blocks, b => b.id === tb.block_id)
    return { ...tb, name: block.name }
  })

  @setErrorCode('1V4000')
  @Transactional('createTreatmentBlocksByExperimentId')
  createTreatmentBlocksByExperimentId = (experimentId, treatments, context, tx) =>
    db.block.findByExperimentId(experimentId, tx).then(blocks =>
      this.createTreatmentBlocks(treatments, blocks, context, tx),
    )

  @setErrorCode('1V5000')
  @Transactional('createTreatmentBlocks')
  createTreatmentBlocks = (treatments, blocks, context, tx) => {
    if (_.isEmpty(treatments) || _.isEmpty(blocks)) {
      return Promise.resolve([])
    }

    const treatmentBlocks = this.createTreatmentBlockModels(treatments, blocks)

    return db.treatmentBlock.batchCreate(treatmentBlocks, context, tx)
  }

  @setErrorCode('1V6000')
  @Transactional('persistTreatmentBlocksForExistingTreatments')
  persistTreatmentBlocksForExistingTreatments = (experimentId, treatments, context, tx) =>
    tx.batch([this.db.block.findByExperimentId(experimentId, tx),
      this.db.treatmentBlock.batchFindByTreatmentIds(_.map(treatments, 'id'), tx)])
      .then(([blocks, tbsInDB]) => {
        const treatmentBlocksFromRequest = this.createTreatmentBlockModels(treatments, blocks)
        const { creates, updates, deletes } =
          this.splitTreatmentBlocksToActions(treatmentBlocksFromRequest, tbsInDB)

        return this.db.treatmentBlock.batchRemove(_.map(deletes, 'id'), tx)
          .then(() => this.db.treatmentBlock.batchUpdate(updates, context, tx))
          .then(() => this.db.treatmentBlock.batchCreate(creates, context, tx))
      })

  @setErrorCode('1V7000')
  createTreatmentBlockModels = (treatments, blocks) => {
    const blockNameToIdMap = {}
    _.forEach(blocks, (block) => { blockNameToIdMap[block.name] = block.id })
    return _.flatMap(treatments, t => _.map(t.blocks, tb => ({
      blockId: blockNameToIdMap[tb.name],
      treatmentId: t.id,
      numPerRep: tb.numPerRep,
    })))
  }

  @setErrorCode('1V8000')
  splitTreatmentBlocksToActions = (requestTbs, dbTbs) => {
    _.forEach(requestTbs, requestTb =>
      findAndHandleMatch(requestTb, dbTbs, areTreatmentBlocksEqual, isUpdateNeededForExactMatch))

    _.forEach(_.filter(requestTbs, tb => !tb.id), requestTb =>
      findAndHandleMatch(requestTb, dbTbs, areTreatmentBlocksNearlyEqual, () => true))

    return {
      creates: _.filter(requestTbs, tb => !tb.id),
      updates: _.filter(requestTbs, 'shouldBeUpdated'),
      deletes: _.filter(dbTbs, tb => !tb.used),
    }
  }

  @setErrorCode('1VI000')
  @Transactional('getTreatmentDetailsBySetId')
  getTreatmentDetailsBySetId = (setId, tx) => {
    if (setId) {
      return this.getTreatmentBlocksBySetId(setId, tx).then((treatmentBlocks) => {
        const treatmentIds = _.uniq(_.map(treatmentBlocks, 'treatment_id'))

        if (treatmentIds && treatmentIds.length > 0) {
          return db.treatment.batchFindAllTreatmentLevelDetails(treatmentIds, tx)
            .then(this.mapTreatmentLevelsToOutputFormat)
        }

        throw AppError.notFound(`No treatments found for set id: ${setId}.`, undefined, getFullErrorCode('1VI001'))
      })
    }

    throw AppError.badRequest('A setId is required', undefined, getFullErrorCode('1VI002'))
  }

  @setErrorCode('1VJ000')
  mapTreatmentLevelsToOutputFormat = (response) => {
    const groupedValues = _.groupBy(response, 'treatment_id')

    return _.map(groupedValues, (treatmentDetails, treatmentId) => (
      {
        treatmentId: Number(treatmentId),
        factorLevels: _.map(treatmentDetails, detail => ({
          items: detail.value.items,
          factorName: detail.name,
        })),
      }))
  }
}


module.exports = TreatmentBlockService
