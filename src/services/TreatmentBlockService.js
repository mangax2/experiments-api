import _ from 'lodash'
import Transactional from '@monsantoit/pg-transactional'
import { dbRead, dbWrite } from '../db/DbManager'
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
  ) {
    this.blockService = blockService
    this.locationAssocWithBlockService = locAssocService
  }

  @setErrorCode('1V1000')
  getTreatmentBlocksByExperimentId = id => dbRead.block.findByExperimentId(id)
    .then(blocks => (_.isEmpty(blocks) ? Promise.resolve([]) :
      dbRead.treatmentBlock.batchFindByBlockIds(_.map(blocks, 'id'))
        .then(treatmentBlocks => this.getTreatmentBlocksWithBlockInfo(treatmentBlocks, blocks))))

  @setErrorCode('1V2000')
  getTreatmentBlocksBySetId = setId =>
    this.locationAssocWithBlockService.getBySetId(setId)
      .then(locAssociation => (_.isNil(locAssociation) ? Promise.resolve([]) :
        Promise.all([
          dbRead.block.findByBlockId(locAssociation.block_id),
          dbRead.treatmentBlock.findByBlockId(locAssociation.block_id),
        ]).then(([block, treatmentBlocks]) =>
          this.getTreatmentBlocksWithBlockInfo(treatmentBlocks, [block]))
      ))

  @setErrorCode('1VK000')
  getTreatmentBlocksByTreatmentIds = treatmentIds =>
    (_.isEmpty(treatmentIds) ? Promise.resolve([]) :
      dbRead.treatmentBlock.batchFindByTreatmentIds(treatmentIds)
        .then(treatmentBlocks =>
          dbRead.block.batchFind(_.uniq(_.map(treatmentBlocks, 'block_id')))
            .then(blocks => this.getTreatmentBlocksWithBlockInfo(treatmentBlocks, blocks)),
        ))

  @setErrorCode('1VL000')
  getTreatmentBlocksByIds = ids =>
    (_.isEmpty(ids) ? Promise.resolve([]) :
      dbRead.treatmentBlock.batchFindByIds(ids)
        .then(treatmentBlocks =>
          dbRead.block.batchFind(_.uniq(_.map(treatmentBlocks, 'block_id')))
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
  createTreatmentBlocksByExperimentId = async (
    experimentId,
    treatments,
    newBlocks,
    context,
    tx,
  ) => {
    const blocks = await dbRead.block.findByExperimentId(experimentId)
    return this.createTreatmentBlocks(treatments, [...blocks, ...newBlocks], context, tx)
  }

  @setErrorCode('1V5000')
  @Transactional('createTreatmentBlocks')
  createTreatmentBlocks = (treatments, blocks, context, tx) => {
    if (_.isEmpty(treatments) || _.isEmpty(blocks)) {
      return Promise.resolve([])
    }

    const treatmentBlocks = this.createTreatmentBlockModels(treatments, blocks)

    return dbWrite.treatmentBlock.batchCreate(treatmentBlocks, context, tx)
  }

  @setErrorCode('1V6000')
  @Transactional('persistTreatmentBlocksForExistingTreatments')
  persistTreatmentBlocksForExistingTreatments = async (
    experimentId,
    treatments,
    newBlocks,
    context,
    tx,
  ) => {
    const [blocksInDb, tbsInDB] = await Promise.all([
      dbRead.block.findByExperimentId(experimentId),
      dbRead.treatmentBlock.batchFindByTreatmentIds(_.map(treatments, 'id')),
    ])
    const blocks = [...blocksInDb, ...newBlocks]
    const treatmentBlocksFromRequest = this.createTreatmentBlockModels(treatments, blocks)
    const { creates, updates, deletes } =
      this.splitTreatmentBlocksToActions(treatmentBlocksFromRequest, tbsInDB)

    await dbWrite.treatmentBlock.batchRemove(_.map(deletes, 'id'), tx)
    await dbWrite.treatmentBlock.batchUpdate(updates, context, tx)
    await dbWrite.treatmentBlock.batchCreate(creates, context, tx)
  }

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
  getTreatmentDetailsBySetId = (setId) => {
    if (setId) {
      return this.getTreatmentBlocksBySetId(setId).then((treatmentBlocks) => {
        const treatmentIds = _.uniq(_.map(treatmentBlocks, 'treatment_id'))

        if (treatmentIds && treatmentIds.length > 0) {
          return dbRead.treatment.batchFindAllTreatmentLevelDetails(treatmentIds)
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
