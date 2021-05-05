import _ from 'lodash'
import Transactional from '@monsantoit/pg-transactional'
import db from '../db/DbManager'
import ExperimentsService from './ExperimentsService'
import TreatmentService from './TreatmentService'
import TreatmentBlockService from './TreatmentBlockService'
import BlockService from './BlockService'

const { setErrorCode } = require('@monsantoit/error-decorator')()

// Error Codes 1ZXXXX
class TreatmentWithBlockService {
  constructor() {
    this.experimentsService = new ExperimentsService()
    this.treatmentService = new TreatmentService()
    this.treatmentBlockService = new TreatmentBlockService()
    this.blockService = new BlockService()
  }

  @setErrorCode('1Z1000')
  @Transactional('getTreatmentsByExperimentIdWithTemplateCheck')
  getTreatmentsByExperimentIdWithTemplateCheck(id, isTemplate, context, tx) {
    return this.experimentsService.findExperimentWithTemplateCheck(id, isTemplate, context, tx)
      .then(() => this.getTreatmentsByExperimentId(id, tx))
  }

  @setErrorCode('1Z2000')
  @Transactional('getTreatmentsByExperimentId')
  getTreatmentsByExperimentId(id, tx) {
    return tx.batch([db.treatment.findAllByExperimentId(id, tx),
      this.treatmentBlockService.getTreatmentBlocksByExperimentId(id, tx)])
      .then(([treatments, treatmentBlocks]) =>
        this.getTreatmentsWithBlockInfo(treatments, treatmentBlocks))
  }

  @setErrorCode('1Z3000')
  @Transactional('getTreatmentsByBySetIds')
  getTreatmentsByBySetIds = (ids, tx) =>
    db.treatment.batchFindAllBySetId(ids, tx)
      .then((treatments) => {
        const uniqTreatments = _.uniqBy(treatments, 'id')
        return this.treatmentBlockService.getTreatmentBlocksByTreatmentIds(_.map(uniqTreatments, 'id'), tx)
          .then(treatmentBlocks => this.getTreatmentsWithBlockInfo(uniqTreatments, treatmentBlocks))
      })

  @setErrorCode('1Z4000')
  getTreatmentsWithBlockInfo = (treatments, treatmentBlocks) => _.map(treatments, (t) => {
    const treatmentTBs = _.filter(treatmentBlocks, tb => tb.treatment_id === t.id)
    return this.associateBlockInfoToTreatment(t, treatmentTBs)
  })

  @setErrorCode('1Z5000')
  associateBlockInfoToTreatment = (treatment, treatmentBlocks) => ({
    ...treatment,
    /* TODO: when we support multiple blocks in the UI,
    inAllBlocks may need to be evaluated differently */
    inAllBlocks: treatmentBlocks.length > 1,
    block: treatmentBlocks.length === 1 ? treatmentBlocks[0].name : null,
    blockId: treatmentBlocks.length === 1 ? treatmentBlocks[0].block_id : null,
    blocks: treatmentBlocks.length >= 1 ? treatmentBlocks.map(
      tb => ({ name: tb.name, blockId: tb.block_id, numPerRep: tb.num_per_rep })) : [],
  })

  @setErrorCode('1Z6000')
  @Transactional('createTreatments')
  createTreatments(experimentId, treatments, context, tx) {
    return this.treatmentService.batchCreateTreatments(treatments, context, tx)
      .then((responses) => {
        const newTreatments = _.map(responses, (r, index) => ({ ...treatments[index], id: r.id }))
        return this.treatmentBlockService.createTreatmentBlocksByExperimentId(experimentId,
          newTreatments, context, tx)
          .then(() => responses)
      })
  }

  @setErrorCode('1Z7000')
  @Transactional('updateTreatments')
  updateTreatments = async (experimentId, treatments, context, tx) => {
    await this.treatmentService.batchUpdateTreatments(treatments, context, tx)
    return this.treatmentBlockService.persistTreatmentBlocksForExistingTreatments(
      experimentId, treatments, context, tx)
  }
}

module.exports = TreatmentWithBlockService
