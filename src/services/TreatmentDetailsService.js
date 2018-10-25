import _ from 'lodash'
import Transactional from '@monsantoit/pg-transactional'
import TreatmentService from './TreatmentService'
import CombinationElementService from './CombinationElementService'
import FactorLevelService from './FactorLevelService'
import FactorService from './FactorService'
import SecurityService from './SecurityService'
import AppUtil from './utility/AppUtil'
import { notifyChanges } from '../decorators/notifyChanges'

const { setErrorCode } = require('@monsantoit/error-decorator')()

// Error Codes 1QXXXX
class TreatmentDetailsService {
  constructor() {
    this.treatmentService = new TreatmentService()
    this.combinationElementService = new CombinationElementService()
    this.factorService = new FactorService()
    this.securityService = new SecurityService()
  }

  @setErrorCode('1Q1000')
  @Transactional('getAllTreatmentDetails')
  getAllTreatmentDetails(experimentId, isTemplate, context, tx) {
    return Promise.all([
      this.treatmentService.getTreatmentsByExperimentId(experimentId, isTemplate, context, tx),
      this.combinationElementService.getCombinationElementsByExperimentId(experimentId, tx),
      FactorLevelService.getFactorLevelsByExperimentIdNoExistenceCheck(experimentId, tx),
      this.factorService.getFactorsByExperimentId(experimentId, isTemplate, context, tx),
    ]).then((fullTreatmentDetails) => {
      const groupedFactors = _.groupBy(fullTreatmentDetails[3], 'id')

      const groupedFactorLevels = _.groupBy(_.map(fullTreatmentDetails[2], level => ({
        id: level.id,
        items: level.value ? level.value.items : [],
        factor_id: level.factor_id,
        factor_name: groupedFactors[level.factor_id][0].name,
      })), 'id')

      const groupedCombinationElements = _.groupBy(
        _.map(fullTreatmentDetails[1], combinationElement => ({
          id: combinationElement.id,
          treatment_id: combinationElement.treatment_id,
          factor_id: groupedFactorLevels[combinationElement.factor_level_id][0].factor_id,
          factor_name: groupedFactorLevels[combinationElement.factor_level_id][0].factor_name,
          factor_level: _.omit(groupedFactorLevels[combinationElement.factor_level_id][0], ['factor_id', 'factor_name']),
        })), 'treatment_id')

      return _.map(fullTreatmentDetails[0], treatment => ({
        id: treatment.id,
        treatment_number: treatment.treatment_number,
        is_control: treatment.is_control,
        notes: treatment.notes,
        combination_elements: _.map(groupedCombinationElements[treatment.id], ce => _.omit(ce, ['treatment_id'])),
      }))
    })
  }

  @notifyChanges('update', 0)
  @setErrorCode('1Q2000')
  @Transactional('manageAllTreatmentDetails')
  manageAllTreatmentDetails(experimentId, treatmentDetailsObj, context, isTemplate, tx) {
    return this.securityService.permissionsCheck(experimentId, context, isTemplate, tx).then(() => {
      TreatmentDetailsService.populateExperimentId(treatmentDetailsObj.updates, experimentId)
      TreatmentDetailsService.populateExperimentId(treatmentDetailsObj.adds, experimentId)
      return this.deleteTreatments(treatmentDetailsObj.deletes, context, tx)
        .then(() => this.updateTreatments(treatmentDetailsObj.updates, context, tx)
          .then(() => this.createTreatments(treatmentDetailsObj.adds, context, tx)
            .then(() => AppUtil.createCompositePostResponse())))
    })
  }

  @notifyChanges('update', 0, 3)
  @setErrorCode('1QI000')
  @Transactional('handleAllTreatments')
  handleAllTreatments(experimentId, treatments, context, isTemplate, tx) {
    return this.securityService.permissionsCheck(experimentId, context, isTemplate, tx)
      .then(() => this.getAllTreatmentDetails(experimentId, isTemplate, context, tx)
        .then((result) => {
          const dbTreatments = _.sortBy(result, 'treatment_number')
          const sortedTreatments = _.sortBy(treatments, 'treatmentNumber')

          if (dbTreatments.length === 0 && sortedTreatments.length > 0) {
            return this.createTreatments(sortedTreatments, context, tx)
              .then(() => AppUtil.createNoContentResponse())
          }

          if (dbTreatments.length > 0 && sortedTreatments.length === 0) {
            return this.deleteTreatments(_.map(dbTreatments, 'id'), context, tx)
              .then(() => AppUtil.createNoContentResponse())
          }

          if (sortedTreatments.length > 0 && dbTreatments.length > 0) {
            _.forEach(dbTreatments, (treatment) => {
              treatment.sortedFactorLevelIds = _.join(_.map(treatment.combination_elements, ce => ce.factor_level.id).sort(), ',')
              treatment.used = false
            })

            _.forEach(sortedTreatments, (treatment) => {
              treatment.sortedFactorLevelIds = _.join(_.map(treatment.combinationElements, 'factorLevelId').sort(), ',')
            })

            const adds = _.differenceBy(sortedTreatments, dbTreatments, 'sortedFactorLevelIds')
            const deletes = _.map(_.differenceBy(dbTreatments, sortedTreatments, 'sortedFactorLevelIds'), 'id')

            const addFactorLevelIds = _.map(adds, 'sortedFactorLevelIds')

            _.forEach(dbTreatments, (treatment) => {
              if (deletes.includes(treatment.id)) {
                treatment.used = true
              }
            })

            const updatesToCheck = _.filter(sortedTreatments, treatment =>
              !addFactorLevelIds.includes(treatment.sortedFactorLevelIds))

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

            _.forEach(dbTreatments, (treatment) => {
              if (treatment.used === false) {
                deletes.push(treatment.id)
              }
            })

            TreatmentDetailsService.populateExperimentId(updates, experimentId)
            TreatmentDetailsService.populateExperimentId(adds, experimentId)

            return this.deleteTreatments(deletes, context, tx)
              .then(() => this.updateTreatments(updates, context, tx)
                .then(() => this.createTreatments(adds, context, tx)
                  .then(() => AppUtil.createNoContentResponse())))
          }

          return AppUtil.createNoContentResponse()
        }))
  }

  @setErrorCode('1Q3000')
  static populateExperimentId(treatments, experimentId) {
    _.forEach(treatments, (t) => {
      t.experimentId = Number(experimentId)
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
  createTreatments(treatmentAdds, context, tx) {
    if (_.compact(treatmentAdds).length === 0) {
      return Promise.resolve()
    }
    return this.treatmentService.batchCreateTreatments(treatmentAdds, context, tx)
      .then((createTreatmentsResponses) => {
        const newTreatmentIds = _.map(createTreatmentsResponses, response => response.id)
        return this.createCombinationElements(
          this.assembleBatchCreateCombinationElementsRequestFromAdds(
            treatmentAdds,
            newTreatmentIds,
          ),
          context,
          tx,
        )
      })
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
  updateTreatments(treatmentUpdates, context, tx) {
    if (_.compact(treatmentUpdates).length === 0) {
      return Promise.resolve()
    }
    return this.treatmentService.batchUpdateTreatments(treatmentUpdates, context, tx)
      .then(() => this.deleteCombinationElements(treatmentUpdates, context, tx)
        .then(() => this.createAndUpdateCombinationElements(treatmentUpdates, context, tx)))
  }

  @setErrorCode('1QB000')
  deleteCombinationElements(treatmentUpdates, context, tx) {
    return this.identifyCombinationElementIdsForDelete(treatmentUpdates, context, tx)
      .then((idsForDeletion) => {
        if (idsForDeletion.length === 0) {
          return Promise.resolve()
        }
        return this.combinationElementService.batchDeleteCombinationElements(idsForDeletion,
          context, tx)
      })
  }

  @setErrorCode('1QC000')
  identifyCombinationElementIdsForDelete(treatments, context, tx) {
    const treatmentIds = _.map(treatments, treatment => treatment.id)

    return this.combinationElementService.batchGetCombinationElementsByTreatmentIds(
      treatmentIds, context, tx)
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
  createAndUpdateCombinationElements(treatmentUpdates, context, tx) {
    return this.updateCombinationElements(
      this.assembleBatchUpdateCombinationElementsRequestFromUpdates(treatmentUpdates),
      context,
      tx,
    ).then(() => this.createCombinationElements(
      this.assembleBatchCreateCombinationElementsRequestFromUpdates(treatmentUpdates),
      context,
      tx))
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
