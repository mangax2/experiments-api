import _ from 'lodash'
import Transactional from '@monsantoit/pg-transactional'
import db from '../db/DbManager'
import ExperimentsService from './ExperimentsService'
import TreatmentService from './TreatmentService'
import TreatmentBlockService from './TreatmentBlockService'
import BlockService from './BlockService'

const { setErrorCode } = require('@monsantoit/error-decorator')()

// TODO need to add @notifyChanges to the calls

// Error Codes 1ZXXXX
class TreatmentWithBlockService {
  constructor() {
    this.experimentService = new ExperimentsService()
    this.treatmentService = new TreatmentService()
    this.treatmentBlockService = new TreatmentBlockService()
    this.blockService = new BlockService()
  }

  @setErrorCode('1Z1000')
  @Transactional('getTreatmentsByExperimentIdWithTemplateCheck')
  getTreatmentsByExperimentIdWithTemplateCheck(id, isTemplate, context, tx) {
    return this.experimentService.getExperimentById(id, isTemplate, context, tx)
      .then(() => this.getTreatmentsByExperimentId(id, tx))
  }

  @setErrorCode('1Z2000')
  @Transactional('getTreatmentsByExperimentId')
  getTreatmentsByExperimentId(id, tx) {
    return Promise.all([db.treatment.findAllByExperimentId(id, tx),
      this.treatmentBlockService.getTreatmentBlocksByExperimentId(id, tx)],
    ).then(([treatments, treatmentBlocks]) => _.map(treatments, (t) => {
      const blocks = _.filter(treatmentBlocks, tb => tb.treatment_id === t.id)
      return this.addBlockInfoToTreatment(t, blocks)
    }))
  }

  @setErrorCode('1Z3000')
  @Transactional('getTreatmentsByBySetId')
  getTreatmentsByBySetId(id, tx) {
    return Promise.all([db.treatment.batchFindAllBySetId(id, tx),
      this.treatmentBlockService.getTreatmentBlocksBySetId(id, tx)])
      .then(([treatments, treatmentBlocks]) => _.map(treatments, (t) => {
        const blocks = _.filter(treatmentBlocks, tb => tb.treatment_id === t.id)
        return this.addBlockInfoToTreatment(t, blocks)
      }))
  }

  @setErrorCode('1Z4000')
  addBlockInfoToTreatment = (treatment, blocks) => {
    treatment.in_all_blocks = false
    treatment.block = ''
    if (blocks.length > 1) {
      treatment.in_all_blocks = true
    } else if (blocks.length === 1) {
      treatment.block = blocks[0].name
    }
    return treatment
  }

  @setErrorCode('1Z5000')
  @Transactional('updateBlocksInfoByExperimentId')
  updateBlocksInfoByExperimentId(experimentId, treatments, context, tx) {
    const blockNames = _.map(_.filter(treatments, t => t.experimentId === experimentId), 'block')
    return this.blockService.updateBlockNamesByExperimentId(experimentId, blockNames, context, tx)
  }

  // TODO there is nothing to do with delete treatments, treatment block will be deleted
  // TODO block table clean up will happen after everything else

  // TODO create block and treatment block first, so we have the treatment block id
  @setErrorCode('1Z5000')
  @Transactional('createTreatments')
  createTreatments(experimentId, treatments, context, tx) {
    return this.treatmentService.batchCreateTreatments(treatments, context, tx)
      .then(() => this.treatmentBlockService.createTreatmentBlocksByExperimentId(experimentId,
        treatments, context, tx))
  }

  @setErrorCode('1Z5000')
  @Transactional('updateTreatments')
  updateTreatments(experimentId, treatments, context, tx) {
    return this.treatmentService.batchUpdateTreatments(treatments, context, tx)
      .then(() => this.treatmentBlockService.updateTreatmentBlocksByExperimentId(
        experimentId, treatments, context, tx))
  }
}

module.exports = TreatmentWithBlockService
