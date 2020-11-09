import _ from 'lodash'
import inflector from 'json-inflector'
import Transactional from '@monsantoit/pg-transactional'
import db from '../db/DbManager'
import ExperimentsService from './ExperimentsService'
import TreatmentService from './TreatmentService'
import TreatmentBlockService from './TreatmentBlockService'
import ExperimentalUnitService from './ExperimentalUnitService'

const { setErrorCode } = require('@monsantoit/error-decorator')()

// Error Codes 20XXXX
class UnitWithBlockService {
  constructor() {
    this.experimentService = new ExperimentsService()
    this.experimentalUnitService = new ExperimentalUnitService()
    this.treatmentService = new TreatmentService()
    this.treatmentBlockService = new TreatmentBlockService()
  }

  @setErrorCode('201000')
  @Transactional('getUnitsFromTemplateByExperimentId')
  getUnitsFromTemplateByExperimentId(id, context, tx) {
    return this.experimentService.findExperimentWithTemplateCheck(id, true, context, tx)
      .then(() => this.getExperimentalUnitsByExperimentId(id, tx))
      .then(mapUnitsToResponseFormat)
  }

  @setErrorCode('202000')
  @Transactional('getUnitsFromExperimentByExperimentId')
  getUnitsFromExperimentByExperimentId(id, context, tx) {
    return this.experimentService.findExperimentWithTemplateCheck(id, false, context, tx)
      .then(() => this.getExperimentalUnitsByExperimentId(id, tx))
      .then(mapUnitsToResponseFormat)
  }

  @setErrorCode('203000')
  @Transactional('getExperimentalUnitsByExperimentId')
  getExperimentalUnitsByExperimentId(id, tx) {
    return tx.batch([db.unit.findAllByExperimentId(id, tx),
      this.treatmentBlockService.getTreatmentBlocksByExperimentId(id, tx),
      this.treatmentService.batchGetTreatmentsByExperimentId(id, tx),
    ])
      .then(([units, treatmentBlocks, treatments]) =>
        this.addTreatmentInfoToUnits(
          this.addBlockInfoToUnit(units, treatmentBlocks), treatments))
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
    return {
      ...unit,
      block: block.name,
      blockId: block.block_id,
    }
  })

  addTreatmentBlocksToUnits = (units, treatmentBlocks) => _.map(units, (unit) => {
    const treatmentBlockId = this.findTreatmentBlockId(unit, treatmentBlocks)
    return ({ ...unit, treatmentBlockId })
  })

  addTreatmentInfoToUnits = (units, treatments) => _.map(units, unit =>
    ({ ...unit, treatment: this.findTreatment(unit, treatments) }))

  findTreatmentBlockId = (unit, treatmentBlocks) => {
    const treatmentBlock = _.find(treatmentBlocks,
      tb => tb.treatment_id === unit.treatmentId && tb.name === unit.block)
    return treatmentBlock ? treatmentBlock.id : null
  }

  findTreatment = (unit, treatments) => {
    const treatment = _.find(treatments,
      t => ((t.id) === (unit.treatment_id)))
    return treatment || null
  }
}

const mapUnitsToResponseFormat = units => units.map((u) => {
  const unit = inflector.transform(u, 'camelizeLower')
  return {
    block: unit.block,
    blockId: unit.blockId,
    createdDate: unit.createdDate,
    createdUserId: unit.createdUserId,
    deactivationReason: unit.deactivationReason,
    groupId: unit.groupId,
    id: unit.id,
    location: unit.location,
    modifiedDate: unit.modifiedDate,
    modifiedUserId: unit.modifiedUserId,
    rep: unit.rep,
    setEntryId: unit.setEntryId,
    treatmentId: unit.treatmentId,
    treatmentNumber: unit.treatmentNumber,
  }
})

module.exports = UnitWithBlockService
