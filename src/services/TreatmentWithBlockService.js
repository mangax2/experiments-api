import _ from 'lodash'
import Transactional from '@monsantoit/pg-transactional'
import { dbRead } from '../db/DbManager'
import ExperimentsService from './ExperimentsService'
import TreatmentService from './TreatmentService'
import TreatmentBlockService from './TreatmentBlockService'

const { setErrorCode } = require('@monsantoit/error-decorator')()

// Error Codes 1ZXXXX
class TreatmentWithBlockService {
  constructor() {
    this.experimentsService = new ExperimentsService()
    this.treatmentService = new TreatmentService()
    this.treatmentBlockService = new TreatmentBlockService()
  }

  @setErrorCode('1Z1000')
  getTreatmentsByExperimentIdWithTemplateCheck(id, isTemplate, context) {
    return this.experimentsService.findExperimentWithTemplateCheck(id, isTemplate, context)
      .then(() => this.getTreatmentsByExperimentId(id))
  }

  @setErrorCode('1Z2000')
  getTreatmentsByExperimentId = id => dbRead.treatment.findAllByExperimentId(id)

  @setErrorCode('1Z3000')
  getTreatmentsByBySetIds = ids => dbRead.treatment.batchFindAllBySetId(ids)

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
