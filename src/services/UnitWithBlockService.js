import _ from 'lodash'
import Transactional from '@monsantoit/pg-transactional'
import db from '../db/DbManager'
import ExperimentsService from './ExperimentsService'
import TreatmentBlockService from './TreatmentBlockService'
import ExperimentalUnitService from './ExperimentalUnitService'

const { setErrorCode } = require('@monsantoit/error-decorator')()

// Error Codes 20XXXX
class UnitWithBlockService {
  constructor() {
    this.experimentService = new ExperimentsService()
    this.experimentalUnitService = new ExperimentalUnitService()
    this.treatmentBlockService = new TreatmentBlockService()
  }

  @setErrorCode('201000')
  @Transactional('getUnitsFromTemplateByExperimentId')
  getUnitsFromTemplateByExperimentId(id, context, tx) {
    return this.experimentService.getExperimentById(id, true, context, tx)
      .then(() => this.getExperimentalUnitsByExperimentId(id, tx))
  }

  @setErrorCode('202000')
  @Transactional('getUnitsFromExperimentByExperimentId')
  getUnitsFromExperimentByExperimentId(id, context, tx) {
    return this.experimentService.getExperimentById(id, false, context, tx)
      .then(() => this.getExperimentalUnitsByExperimentId(id, tx))
  }

  @setErrorCode('203000')
  @Transactional('getExperimentalUnitsByExperimentId')
  getExperimentalUnitsByExperimentId(id, tx) {
    return tx.batch([db.unit.findAllByExperimentId(id, tx),
      this.treatmentBlockService.getTreatmentBlocksByExperimentId(id, tx)])
      .then(([units, treatmentBlocks]) => this.addBlockInfoToUnit(units, treatmentBlocks))
  }

  @setErrorCode('204000')
  @Transactional('getExperimentalUnitsBySetIds')
  getExperimentalUnitsBySetIds(ids, tx) {
    return db.unit.batchFindAllBySetIds(ids, tx)
      .then(units =>
        this.treatmentBlockService.getTreatmentBlocksByIds(_.map(units, 'treatment_block_id'), tx)
          .then(treatmentBlocks => this.addBlockInfoToUnit(units, treatmentBlocks)),
      )
  }

  @setErrorCode('205000')
  addBlockInfoToUnit = (units, treatmentBlocks) => _.map(units, (unit) => {
    const block = _.find(treatmentBlocks, tb => tb.id === unit.treatment_block_id)
    unit.block = _.isNil(block) ? '' : block.name
    return unit
  })

  addTreatmentBlocksToUnits = (units, treatmentBlocks) => _.map(units, (unit) => {
    const treatmentBlockId = this.findTreatmentBlockId(unit, treatmentBlocks)
    return ({ ...unit, treatmentBlockId })
  })

  findTreatmentBlockId = (unit, treatmentBlocks) => {
    const treatmentBlock = _.find(treatmentBlocks,
      tb => tb.treatment_id === unit.treatmentId && tb.name === unit.block)
    return treatmentBlock ? treatmentBlock.id : null
  }
}

module.exports = UnitWithBlockService
