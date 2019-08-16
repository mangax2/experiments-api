import _ from 'lodash'
import Transactional from '@monsantoit/pg-transactional'
import db from '../db/DbManager'
import AppError from './utility/AppError'
import BlockService from './BlockService'
import LocationAssociationWithBlockService from './LocationAssociationWithBlockService'

const { getFullErrorCode, setErrorCode } = require('@monsantoit/error-decorator')()

// Error Codes 1VXXXX
class TreatmentBlockService {
  constructor() {
    this.blockService = new BlockService()
    this.locationAssocWithBlockService = new LocationAssociationWithBlockService()
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
    db.treatmentBlock.batchFindByTreatmentIds(treatmentIds, tx)
      .then(treatmentBlocks =>
        db.block.batchFindByBlockIds(_.uniq(_.map(treatmentBlocks, 'block_id')), tx)
          .then(blocks => this.getTreatmentBlocksWithBlockInfo(treatmentBlocks, blocks)),
      )

  @setErrorCode('1V3000')
  getTreatmentBlocksWithBlockInfo = (treatmentBlocks, blocks) => _.map(treatmentBlocks, (tb) => {
    const block = _.find(blocks, b => b.id === tb.block_id)
    return { ...tb, name: _.isNil(block) ? null : block.name }
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
    if (_.isEmpty(treatments)) {
      return Promise.resolve([])
    }

    const [allBlockTM, oneBlockTM] = _.partition(treatments, t => t.inAllBlocks)
    const treatmentBlocks = _.concat(this.assembleNewTreatmentBlocks(oneBlockTM, blocks),
      this.assembleNewInAllTreatmentBlocks(allBlockTM, blocks))

    return db.treatmentBlock.batchCreate(treatmentBlocks, context, tx)
  }

  @setErrorCode('1V6000')
  @Transactional('handleTreatmentBlocksForExistingTreatments')
  handleTreatmentBlocksForExistingTreatments = (experimentId, treatments, context, tx) =>
    tx.batch([db.block.findByExperimentId(experimentId, tx),
      db.treatmentBlock.batchFindByTreatmentIds(_.map(treatments, 'id'))])
      .then(([blocks, tbsInDB]) => {
        const [tmWithNoTBs, tmWithTBs] = _.partition(treatments, t =>
          _.isNil(this.findTBByTreatmentId(tbsInDB, t.id)))
        const removes = this.getTBsToRemoveForExistingTreatments(tmWithTBs, tbsInDB, blocks)
        const addsFromUpdatedTBs = this.getNewTBsForExistingTreatments(tmWithTBs, tbsInDB, blocks)

        return db.treatmentBlock.batchRemove(removes)
          .then((removalResponse) => {
            const tbs = _.filter(tbsInDB, tb =>
              _.isNil(_.find(removalResponse, r => r.id === tb.id)))
            return this.batchUpdateOneBlockTreatmentBlocks(tmWithTBs, tbs, blocks, context, tx)
              .then(() => db.treatmentBlock.batchCreate(addsFromUpdatedTBs, context, tx))
              .then(() => this.createTreatmentBlocks(tmWithNoTBs, blocks, context, tx))
          })
      })

  @setErrorCode('1V7000')
  getTBsToRemoveForExistingTreatments = (treatments, existingTBs, blocks) => {
    const oneBlockTBs = this.getTBsToRemoveForOneBlockTreatments(treatments, existingTBs)
    const allBlockTBs = this.getTBsToRemoveForAllBlockTreatments(treatments, existingTBs, blocks)
    return _.map(_.concat(oneBlockTBs, allBlockTBs), 'id')
  }

  @setErrorCode('1V8000')
  getTBsToRemoveForOneBlockTreatments = (treatments, existingTBs) => {
    const oneBlockTMs = _.filter(treatments, t => !t.inAllBlocks)
    return _.compact(
      _.flatMap(oneBlockTMs, (tm) => {
        const treatmentBlocks = _.filter(existingTBs, tb => tb.treatment_id === tm.id)

        if (treatmentBlocks && treatmentBlocks.length > 1) {
          return _.tail(treatmentBlocks)
        }
        return null
      }))
  }

  @setErrorCode('1V9000')
  getTBsToRemoveForAllBlockTreatments = (treatments, existingTBs, blocks) => {
    const { newAllBlockTBs, existingAllBlockTBs } =
      this.getExistingAndNewAllBlockTBs(treatments, existingTBs, blocks)
    return _.filter(existingAllBlockTBs, existingTB =>
      _.isNil(
        _.find(newAllBlockTBs, tb => this.treatmentBlocksEqual(tb, existingTB))))
  }

  @setErrorCode('1VA000')
  getNewTBsForExistingTreatments = (treatments, existingTBs, blocks) => {
    const { newAllBlockTBs, existingAllBlockTBs } =
      this.getExistingAndNewAllBlockTBs(treatments, existingTBs, blocks)
    return _.filter(newAllBlockTBs, newTB =>
      _.isNil(
        _.find(existingAllBlockTBs, tb => this.treatmentBlocksEqual(newTB, tb))))
  }

  @setErrorCode('1VB000')
  getExistingAndNewAllBlockTBs = (treatments, existingTBs, blocks) => {
    const allBlockTMs = _.filter(treatments, t => t.inAllBlocks)
    const newAllBlockTBs = this.assembleNewInAllTreatmentBlocks(allBlockTMs, blocks)
    const existingAllBlockTBs = _.filter(existingTBs, tb =>
      !_.isNil(_.find(allBlockTMs, t => t.id === tb.treatment_id)))
    return { newAllBlockTBs, existingAllBlockTBs }
  }

  @setErrorCode('1VC000')
  @Transactional('batchUpdateOneBlockTreatmentBlocks')
  batchUpdateOneBlockTreatmentBlocks = (treatments, treatmentBlocks, blocks, context, tx) => {
    const oneBlockTMs = _.filter(treatments, t => !t.inAllBlocks)
    const oneBlockTBs = this.assembleTBsForExistingTreatments(oneBlockTMs, treatmentBlocks, blocks)
    return db.treatmentBlock.batchUpdate(oneBlockTBs, context, tx)
  }

  @setErrorCode('1VD000')
  assembleTBsForExistingTreatments = (treatments, treatmentBlocks, blocks) =>
    _.compact(_.map(treatments, (t) => {
      const treatmentBlock = this.findTBByTreatmentId(treatmentBlocks, t.id)
      const block = _.find(blocks, b => b.name === t.block)
      if (!_.isNil(treatmentBlock) && !_.isNil(block) && treatmentBlock.block_id !== block.id) {
        return {
          id: treatmentBlock.id,
          treatmentId: t.id,
          blockId: block.id,
        }
      }
      return null
    }))

  @setErrorCode('1VE000')
  assembleNewTreatmentBlocks = (treatments, blocks) =>
    _.compact(_.map(treatments, (t) => {
      const block = _.find(blocks, b => b.name === t.block)
      return (_.isNil(block) ? null : {
        treatmentId: t.id,
        blockId: block.id,
      })
    }))

  @setErrorCode('1VF000')
  assembleNewInAllTreatmentBlocks = (allBlockTreatments, blocks) =>
    _.flatMap(allBlockTreatments, t => _.map(blocks, b => ({
      treatmentId: t.id,
      blockId: b.id,
    }),
    ))

  @setErrorCode('1VG000')
  treatmentBlocksEqual = (tb, tbInDB) =>
    tbInDB.treatment_id === tb.treatmentId && tbInDB.block_id === tb.blockId

  @setErrorCode('1VH000')
  findTBByTreatmentId = (treatmentBlocks, treatmentId) =>
    _.find(treatmentBlocks, tb => tb.treatment_id === treatmentId)

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
