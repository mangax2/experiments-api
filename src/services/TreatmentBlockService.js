import _ from 'lodash'
import Transactional from '@monsantoit/pg-transactional'
import db from '../db/DbManager'
import BlockService from './BlockService'

const { setErrorCode } = require('@monsantoit/error-decorator')()

// Error Codes 1VXXXX
class TreatmentBlockService {
  constructor() {
    this.blockService = new BlockService()
  }

  @setErrorCode('1V1000')
  @Transactional('getTreatmentBlocksByExperimentId')
  getTreatmentBlocksByExperimentId = (id, tx) => db.block.findByExperimentId(id, tx)
    .then(blocks => (_.isEmpty(blocks) ? [] :
      db.treatmentBlock.batchFindByBlockIds(_.map(blocks, 'id'), tx)
        .then(treatmentBlocks => this.addBlockInfoToTreatmentBlocks(treatmentBlocks, blocks))))

  @setErrorCode('1V2000')
  @Transactional('getTreatmentBlocksBySetId')
  getTreatmentBlocksBySetId = (setId, tx) =>
    db.locationAssociation.findBySetId(setId, tx)
      .then(locAssociation => (_.isNil(locAssociation) ? [] :
        Promise.all([db.block.batchFindByBlockIds(locAssociation.block_id, tx),
          db.treatmentBlock.batchFindByBlockIds(locAssociation.block_id, tx)])
          .then(([blocks, treatmentBlocks]) =>
            this.addBlockInfoToTreatmentBlocks(treatmentBlocks, blocks))))


  @setErrorCode('1V3000')
  addBlockInfoToTreatmentBlocks = (treatmentBlocks, blocks) => _.map(treatmentBlocks, (tb) => {
    const block = _.find(blocks, b => b.id === tb.block_id)
    return { ...tb, name: _.isNil(block) ? null : block.name }
  })


  // TODO handle in all block
  @setErrorCode('1V4000')
  @Transactional('createTreatmentBlocksByExperimentId')
  createTreatmentBlocksByExperimentId = (experimentId, treatments, context, tx) =>
    db.block.findByExperimentId(experimentId).then((blocks) => {
      const noBlockTreatments = _.filter(treatments,
        t => _.isNil(_.find(blocks, b => b.name === t.block)))
      if (!_.isEmpty(noBlockTreatments)) {
        return db.block.batchCreateByExperimentId(experimentId, _.map(noBlockTreatments, 'block'), context, tx)
          .then(db.block.findByExperimentId(experimentId)
            .then(updatedBlocksInDB =>
              this.batchCreateTreatmentBlocks(treatments, updatedBlocksInDB, context, tx)),
          )
      }
      return this.batchCreateTreatmentBlocks(treatments, blocks, context, tx)
    })

  @setErrorCode('1V5000')
  @Transactional('batchCreateTreatmentBlocks')
  batchCreateTreatmentBlocks = (treatments, blocks, context, tx) => {
    const treatmentBlocks = _.map(treatments, (t) => {
      const block = _.find(blocks, b => b.name === t.block)
      return { blockId: block.id, treatmentId: t.id }
    })

    return db.treatmentBlock.batchCreate(treatmentBlocks, context, tx)
  }

  // TODO handle in all block
  @setErrorCode('1V6000')
  @Transactional('updateTreatmentBlocksByExperimentId')
  updateTreatmentBlocksByExperimentId = (experimentId, treatments, context, tx) =>
    Promise.all([db.block.findByExperimentId(experimentId),
      db.treatmentBlock.batchFindByTreatmentIds(_.map(treatments, 'id')),
    ]).then(([blocks, treatmentBlocks]) => {
      const noBlockTreatments = _.filter(treatments,
        t => _.isNil(_.find(blocks, b => b.name === t.block)))
      if (!_.isEmpty(noBlockTreatments)) {
        return db.block.batchCreateByExperimentId(experimentId, _.map(noBlockTreatments, 'block'), context, tx)
          .then(() => db.block.findByExperimentId(experimentId)
            .then(updatedBlocksInDB => this.batchUpdateTreatmentBlocks(treatments,
              treatmentBlocks, updatedBlocksInDB, context, tx)))
      }

      return this.batchUpdateTreatmentBlocks(treatments, treatmentBlocks, blocks, context, tx)
    })

  @setErrorCode('1V7000')
  @Transactional('batchUpdateTreatmentBlocks')
  batchUpdateTreatmentBlocks = (treatments, treatmentBlocks, blocks, context, tx) => {
    const [adds, updates] = _.partition(treatments, t =>
      _.isNil(_.find(treatmentBlocks, tb => tb.treatment_id === t.id)))

    return Promise.all([
      db.treatmentBlock.batchCreate(this.assembleNewTreatmentBlocks(adds, blocks), context, tx),
      db.treatmentBlock.batchUpdate(
        this.assembleTreatmentBlocks(updates, treatmentBlocks, blocks), context, tx),
    ])
  }

  @setErrorCode('1V8000')
  assembleTreatmentBlocks = (treatments, treatmentBlocks, blocks) =>
    _.compact(_.map(treatments, (t) => {
      const treatmentBlock = _.find(treatmentBlocks, tb => tb.treatment_id === t.id)
      const block = _.find(blocks, b => b.name === t.block)
      if (!_.isNil(treatmentBlock) && !_.isNil(block)) {
        return {
          id: treatmentBlock.id,
          treatmentId: t.id,
          blockId: block.id,
        }
      }
      return null
    }))

  @setErrorCode('1V9000')
  assembleNewTreatmentBlocks = (treatments, blocks) =>
    _.compact(_.map(treatments, (t) => {
      const block = _.find(blocks, b => b.name === t.block)
      if (!_.isNil(block)) {
        return {
          treatmentId: t.id,
          blockId: block.id,
        }
      }
      return null
    }))
}


module.exports = TreatmentBlockService
