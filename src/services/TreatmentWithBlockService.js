import _ from 'lodash'
import Transactional from '@monsantoit/pg-transactional'
import db from '../db/DbManager'
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
  @Transactional('getTreatmentsByExperimentIdWithTemplateCheck')
  getTreatmentsByExperimentIdWithTemplateCheck(id, isTemplate, context, tx) {
    return this.experimentsService.findExperimentWithTemplateCheck(id, isTemplate, context, tx)
      .then(() => this.getTreatmentsByExperimentId(id, tx))
  }

  @setErrorCode('1Z2000')
  @Transactional('getTreatmentsByExperimentId')
  getTreatmentsByExperimentId = (id, tx) => db.treatment.findAllByExperimentId(id, tx)

  @setErrorCode('1Z3000')
  @Transactional('getTreatmentsByBySetIds')
  getTreatmentsByBySetIds = (ids, tx) =>
    db.treatment.batchFindAllBySetId(ids, tx)

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
