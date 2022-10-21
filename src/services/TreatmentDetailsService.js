import _ from 'lodash'
import Transactional from '@monsantoit/pg-transactional'
import TreatmentService from './TreatmentService'
import CombinationElementService from './CombinationElementService'
import FactorLevelService from './FactorLevelService'
import FactorService from './FactorService'
import SecurityService from './SecurityService'
import AppUtil from './utility/AppUtil'
import { notifyChanges } from '../decorators/notifyChanges'
import TreatmentValidator from '../validations/TreatmentValidator'
import TreatmentWithBlockService from './TreatmentWithBlockService'
import BlockService from './BlockService'
import ExperimentsService from './ExperimentsService'

const { setErrorCode } = require('@monsantoit/error-decorator')()

const formatTreatmentsWithNewBlocksStructure = (treatments) => {
  if (!_.some(treatments, 'blocks')) {
    const allBlocksInRequest = _.uniq(_.map(_.filter(treatments, t => !t.inAllBlocks), 'block'))

    _.forEach(treatments, (t) => {
      if (t.inAllBlocks) {
        t.blocks = _.map(allBlocksInRequest, blockName => ({ name: blockName, numPerRep: 1 }))
      } else {
        t.blocks = [{ name: t.block, numPerRep: 1 }]
      }
      delete t.block
      delete t.inAllBlocks
    })
  }
}

// Error Codes 1QXXXX
class TreatmentDetailsService {
  constructor() {
    this.blockService = new BlockService()
    this.treatmentWithBlockService = new TreatmentWithBlockService()
    this.treatmentService = new TreatmentService()
    this.combinationElementService = new CombinationElementService()
    this.experimentsService = new ExperimentsService()
    this.securityService = new SecurityService()
    this.validator = new TreatmentValidator()
  }

  @setErrorCode('1Q1000')
  getAllTreatmentDetails = async (experimentId, isTemplate, context) => {
    await this.experimentsService.findExperimentWithTemplateCheck(
      experimentId, isTemplate, context,
    )
    const [treatments, combinationElements, factorLevels, factors] = await Promise.all([
      this.treatmentWithBlockService.getTreatmentsByExperimentId(experimentId),
      this.combinationElementService.getCombinationElementsByExperimentId(experimentId),
      FactorLevelService.getFactorLevelsByExperimentIdNoExistenceCheck(experimentId),
      FactorService.getFactorsByExperimentIdNoExistenceCheck(experimentId),
    ])
    const groupedFactors = _.groupBy(factors, 'id')

    const groupedFactorLevels = _.groupBy(_.map(factorLevels, level => ({
      id: level.id,
      items: level.value ? level.value.items : [],
      factor_id: level.factor_id,
      factor_name: groupedFactors[level.factor_id][0].name,
    })), 'id')

    const groupedCombinationElements = _.groupBy(
      _.map(combinationElements, combinationElement => ({
        id: combinationElement.id,
        treatment_id: combinationElement.treatment_id,
        treatmentVariableId: groupedFactorLevels[combinationElement.factor_level_id][0].factor_id,
        treatmentVariableName:
          groupedFactorLevels[combinationElement.factor_level_id][0].factor_name,
        treatmentVariableLevel: _.omit(groupedFactorLevels[combinationElement.factor_level_id][0], ['factor_id', 'factor_name']),
      })), 'treatment_id')

    return _.map(treatments, treatment => ({
      id: treatment.id,
      experiment_id: treatment.experiment_id,
      treatment_number: treatment.treatment_number,
      blocks: treatment.blocks,
      notes: treatment.notes,
      control_types: treatment.control_types || [],
      created_date: treatment.created_date,
      created_user_id: treatment.created_user_id,
      modified_date: treatment.modified_date,
      modified_user_id: treatment.modified_user_id,
      combination_elements: _.map(groupedCombinationElements[treatment.id], ce => _.omit(ce, ['treatment_id'])),
    }))
  }

  stringifyBlock = treatments => _.map(treatments, (t) => {
    const block = _.isNil(t.block) ? null : _.toString(t.block)
    return {
      ...t,
      block,
    }
  })

  @notifyChanges('update', 0, 3)
  @setErrorCode('1QI000')
  @Transactional('handleAllTreatments')
  handleAllTreatments = async (experimentIdStr, inputTreatments, context, isTemplate, tx) => {
    const experimentId = _.toNumber(experimentIdStr)
    await Promise.all([
      this.securityService.permissionsCheck(experimentId, context, isTemplate),
      this.validator.validateBlockValue(inputTreatments),
    ])

    const result = await this.getAllTreatmentDetails(experimentIdStr, isTemplate, context)
    const treatments = this.stringifyBlock(inputTreatments)

    formatTreatmentsWithNewBlocksStructure(treatments)

    const blockNames = _.uniq(_.flatMap(treatments, t => _.map(t.blocks, 'name')))

    const newBlocks = await this.blockService.createOnlyNewBlocksByExperimentId(
      experimentId, blockNames, context, tx)

    const dbTreatments = _.sortBy(result, 'treatment_number')
    const sortedTreatments = _.sortBy(treatments, 'treatmentNumber')

    if (dbTreatments.length === 0 && sortedTreatments.length > 0) {
      TreatmentDetailsService.populateExperimentId(sortedTreatments, experimentId)
      await this.createTreatments(experimentId, sortedTreatments, newBlocks, context, tx)
      await this.blockService.removeBlocksByExperimentId(experimentId, blockNames, tx)
    } else if (dbTreatments.length > 0 && sortedTreatments.length === 0) {
      await this.deleteTreatments(_.map(dbTreatments, 'id'), context, tx)
      await this.blockService.removeBlocksByExperimentId(experimentId, blockNames, tx)
    } else if (sortedTreatments.length > 0 && dbTreatments.length > 0) {
      _.forEach(dbTreatments, (treatment) => {
        treatment.sortedFactorLevelIds = _.join(_.map(treatment.combination_elements, ce => ce.factor_level.id).sort(), ',')
        treatment.used = false
      })

      _.forEach(sortedTreatments, (treatment) => {
        treatment.sortedFactorLevelIds = _.join(_.map(treatment.combinationElements, 'factorLevelId').sort(), ',')
      })

      const dbTreatmentSortedFactorLevelIds = _.map(dbTreatments, 'sortedFactorLevelIds')
      const [updatesToCheck, adds] = _.partition(sortedTreatments, t =>
        dbTreatmentSortedFactorLevelIds.includes(t.sortedFactorLevelIds))

      const updates = this.getUpdates(updatesToCheck, adds, dbTreatments)
      const deletes = this.getDeletes(dbTreatments)

      TreatmentDetailsService.populateExperimentId(updates, experimentId)
      TreatmentDetailsService.populateExperimentId(adds, experimentId)
      await this.deleteTreatments(deletes, context, tx)
      await this.updateTreatments(experimentId, updates, newBlocks, context, tx)
      await this.createTreatments(experimentId, adds, newBlocks, context, tx)
      await this.blockService.removeBlocksByExperimentId(experimentId, blockNames, tx)
    }

    return AppUtil.createNoContentResponse()
  }

  getUpdates = (updatesToCheck, adds, dbTreatments) => {
    const updates = []
    _.forEach(updatesToCheck, (updateTreatment) => {
      const dbTreatment = _.find(dbTreatments, treatment =>
        treatment.sortedFactorLevelIds === updateTreatment.sortedFactorLevelIds
        && treatment.used === false,
      )

      if (dbTreatment === undefined) {
        adds.push(updateTreatment)
      } else {
        updateTreatment.id = dbTreatment.id
        dbTreatment.used = true

        _.forEach(updateTreatment.combinationElements, (ce) => {
          const dbCombination = _.find(dbTreatment.combination_elements,
            dbCE => dbCE.factor_level.id === ce.factorLevelId)
          ce.id = dbCombination.id
        })

        updates.push(updateTreatment)
      }
    })
    return updates
  }

  getDeletes = (dbTreatments) => {
    const deletes = []
    _.forEach(dbTreatments, (treatment) => {
      if (treatment.used === false) {
        deletes.push(treatment.id)
      }
    })
    return deletes
  }

  @setErrorCode('1Q3000')
  static populateExperimentId(treatments, experimentId) {
    _.forEach(treatments, (t) => {
      t.experimentId = experimentId
    })
  }

  @setErrorCode('1Q4000')
  deleteTreatments(treatmentIdsToDelete, context, tx) {
    if (_.compact(treatmentIdsToDelete).length === 0) {
      return Promise.resolve()
    }
    return this.treatmentService.batchDeleteTreatments(treatmentIdsToDelete, context, tx)
  }

  @setErrorCode('1Q5000')
  async createTreatments(experimentId, treatmentAdds, newBlocks, context, tx) {
    if (_.compact(treatmentAdds).length > 0) {
      const createTreatmentsResponses = await this.treatmentWithBlockService.createTreatments(
        experimentId, treatmentAdds, newBlocks, context, tx)

      const newTreatmentIds = _.map(createTreatmentsResponses, response => response.id)
      return this.createCombinationElements(
        this.assembleBatchCreateCombinationElementsRequestFromAdds(treatmentAdds, newTreatmentIds),
        context,
        tx,
      )
    }
    return undefined
  }

  @setErrorCode('1Q6000')
  assembleBatchCreateCombinationElementsRequestFromAdds(treatments, treatmentIds) {
    this.appendParentTreatmentIdsToCombinationElements(treatments, treatmentIds)
    return this.removeUndefinedElements(
      this.extractCombinationElementsFromTreatments(treatments),
    )
  }

  @setErrorCode('1Q7000')
  appendParentTreatmentIdsToCombinationElements = (treatments, treatmentIds) => {
    _.forEach(treatments, (treatment, index) => {
      _.forEach(treatment.combinationElements, (element) => {
        element.treatmentId = treatmentIds[index]
      })
    })
  }

  @setErrorCode('1Q8000')
  extractCombinationElementsFromTreatments = treatments =>
    _.flatMap(treatments, treatment => treatment.combinationElements)

  @setErrorCode('1Q9000')
  removeUndefinedElements = elements => _.filter(elements, element => !_.isUndefined(element))

  @setErrorCode('1QA000')
  updateTreatments = async (experimentId, treatmentUpdates, newBlocks, context, tx) => {
    if (_.compact(treatmentUpdates).length === 0) {
      return Promise.resolve()
    }
    await this.treatmentWithBlockService.updateTreatments(
      experimentId, treatmentUpdates, newBlocks, context, tx)
    await this.deleteCombinationElements(treatmentUpdates, context, tx)
    return this.createAndUpdateCombinationElements(treatmentUpdates, context, tx)
  }

  @setErrorCode('1QB000')
  deleteCombinationElements(treatmentUpdates, context, tx) {
    return this.identifyCombinationElementIdsForDelete(treatmentUpdates, context)
      .then((idsForDeletion) => {
        if (idsForDeletion.length === 0) {
          return Promise.resolve()
        }
        return this.combinationElementService.batchDeleteCombinationElements(idsForDeletion,
          context, tx)
      })
  }

  @setErrorCode('1QC000')
  identifyCombinationElementIdsForDelete(treatments, context) {
    const treatmentIds = _.map(treatments, treatment => treatment.id)

    return this.combinationElementService.batchGetCombinationElementsByTreatmentIds(
      treatmentIds, context)
      .then(currentCombinationElementsByTreatment =>
        _.flatMap(currentCombinationElementsByTreatment, (curCombinationElements, index) => {
          const currentCombinationElements = _.map(curCombinationElements, curCombinationElement =>
            curCombinationElement.id,
          )
          const newCombinationElements =
            _.map(treatments[index].combinationElements, cE => cE.id)
          return _.difference(currentCombinationElements, newCombinationElements)
        }))
  }

  @setErrorCode('1QD000')
  createAndUpdateCombinationElements = async (treatmentUpdates, context, tx) => {
    const updates = await this.updateCombinationElements(
      this.assembleBatchUpdateCombinationElementsRequestFromUpdates(treatmentUpdates),
      context,
      tx,
    )

    const creates = await this.createCombinationElements(
      this.assembleBatchCreateCombinationElementsRequestFromUpdates(treatmentUpdates),
      context,
      tx)

    return [creates, updates]
  }

  @setErrorCode('1QE000')
  assembleBatchCreateCombinationElementsRequestFromUpdates = treatments =>
    _.flatMap(treatments, (treatment) => {
      const newElements = _.filter(treatment.combinationElements, combObj =>
        _.isUndefined(combObj.id),
      )

      return _.forEach(newElements, (element) => {
        element.treatmentId = treatment.id
      })
    })

  @setErrorCode('1QF000')
  assembleBatchUpdateCombinationElementsRequestFromUpdates = treatmentUpdates =>
    _.flatMap(treatmentUpdates, (treatmentUpdate) => {
      const existingElements = _.filter(treatmentUpdate.combinationElements, combinationElement =>
        !_.isUndefined(combinationElement.id),
      )

      return _.forEach(existingElements, (element) => {
        element.treatmentId = treatmentUpdate.id
      })
    })

  @setErrorCode('1QG000')
  createCombinationElements(combinationElements, context, tx) {
    if (combinationElements.length === 0) {
      return Promise.resolve()
    }
    return this.combinationElementService.batchCreateCombinationElements(
      combinationElements, context, tx)
  }

  @setErrorCode('1QH000')
  updateCombinationElements(combinationElements, context, tx) {
    if (combinationElements.length === 0) {
      return Promise.resolve()
    }
    return this.combinationElementService.batchUpdateCombinationElements(
      combinationElements, context, tx)
  }
}

module.exports = TreatmentDetailsService
