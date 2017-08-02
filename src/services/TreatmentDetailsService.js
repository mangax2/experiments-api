import _ from 'lodash'
import TreatmentService from './TreatmentService'
import CombinationElementService from './CombinationElementService'
import SecurityService from './SecurityService'

import AppUtil from './utility/AppUtil'
import Transactional from '../decorators/transactional'

class TreatmentDetailsService {
  constructor() {
    this.treatmentService = new TreatmentService()
    this.combinationElementService = new CombinationElementService()
    this.securityService = new SecurityService()
  }

  @Transactional('getAllTreatmentDetails')
  getAllTreatmentDetails(experimentId, isTemplate, tx) {
    return this.treatmentService.getTreatmentsByExperimentId(experimentId, isTemplate, tx)
      .then((treatments) => {
        const treatmentIds = _.map(treatments, t => t.id)
        return this.combinationElementService.batchGetCombinationElementsByTreatmentIdsNoValidate(
          treatmentIds,
          tx)
          .then(treatmentCombinationElements => _.map(treatments, (treatment, treatmentIndex) => {
            treatment.combinationElements = treatmentCombinationElements[treatmentIndex]
            return treatment
          }))
      })
  }

  @Transactional('manageAllTreatmentDetails')
  manageAllTreatmentDetails(experimentId, treatmentDetailsObj, context, isTemplate, tx) {
    return this.securityService.permissionsCheck(experimentId, context, isTemplate, tx).then(() => {
      TreatmentDetailsService.populateExperimentId(treatmentDetailsObj.updates, experimentId)
      TreatmentDetailsService.populateExperimentId(treatmentDetailsObj.adds, experimentId)
      return this.deleteTreatments(treatmentDetailsObj.deletes, tx)
        .then(() => this.updateTreatments(treatmentDetailsObj.updates, context, tx)
          .then(() => this.createTreatments(treatmentDetailsObj.adds, context, tx)
            .then(() => AppUtil.createCompositePostResponse())))
    })
  }

  static populateExperimentId(treatments, experimentId) {
    _.forEach(treatments, (t) => {
      t.experimentId = Number(experimentId)
    })
  }

  deleteTreatments(treatmentIdsToDelete, tx) {
    if (_.compact(treatmentIdsToDelete).length === 0) {
      return Promise.resolve()
    }
    return this.treatmentService.batchDeleteTreatments(treatmentIdsToDelete, tx)
  }

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

  assembleBatchCreateCombinationElementsRequestFromAdds(treatments, treatmentIds) {
    this.appendParentTreatmentIdsToCombinationElements(treatments, treatmentIds)
    return this.removeUndefinedElements(
      this.extractCombinationElementsFromTreatments(treatments),
    )
  }

  appendParentTreatmentIdsToCombinationElements = (treatments, treatmentIds) => {
    _.forEach(treatments, (treatment, index) => {
      _.forEach(treatment.combinationElements, (element) => {
        element.treatmentId = treatmentIds[index]
      })
    })
  }

  extractCombinationElementsFromTreatments = treatments =>
    _.flatMap(treatments, treatment => treatment.combinationElements)

  removeUndefinedElements = elements => _.filter(elements, element => !_.isUndefined(element))

  updateTreatments(treatmentUpdates, context, tx) {
    if (_.compact(treatmentUpdates).length === 0) {
      return Promise.resolve()
    }
    return this.treatmentService.batchUpdateTreatments(treatmentUpdates, context, tx)
      .then(() => this.deleteCombinationElements(treatmentUpdates, tx)
        .then(() => this.createAndUpdateCombinationElements(treatmentUpdates, context, tx)))
  }

  deleteCombinationElements(treatmentUpdates, tx) {
    return this.identifyCombinationElementIdsForDelete(treatmentUpdates, tx)
      .then((idsForDeletion) => {
        if (idsForDeletion.length === 0) {
          return Promise.resolve()
        }
        return this.combinationElementService.batchDeleteCombinationElements(idsForDeletion, tx)
      })
  }

  identifyCombinationElementIdsForDelete(treatments, tx) {
    const treatmentIds = _.map(treatments, treatment => treatment.id)

    return this.combinationElementService.batchGetCombinationElementsByTreatmentIds(
      treatmentIds, tx)
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

  assembleBatchCreateCombinationElementsRequestFromUpdates = treatments =>
    _.flatMap(treatments, (treatment) => {
      const newElements = _.filter(treatment.combinationElements, combObj =>
        _.isUndefined(combObj.id),
      )

      return _.forEach(newElements, (element) => {
        element.treatmentId = treatment.id
      })
    })

  assembleBatchUpdateCombinationElementsRequestFromUpdates = treatmentUpdates =>
    _.flatMap(treatmentUpdates, (treatmentUpdate) => {
      const existingElements = _.filter(treatmentUpdate.combinationElements, combinationElement =>
        !_.isUndefined(combinationElement.id),
      )

      return _.forEach(existingElements, (element) => {
        element.treatmentId = treatmentUpdate.id
      })
    })

  createCombinationElements(combinationElements, context, tx) {
    if (combinationElements.length === 0) {
      return Promise.resolve()
    }
    return this.combinationElementService.batchCreateCombinationElements(
      combinationElements, context, tx)
  }

  updateCombinationElements(combinationElements, context, tx) {
    if (combinationElements.length === 0) {
      return Promise.resolve()
    }
    return this.combinationElementService.batchUpdateCombinationElements(
      combinationElements, context, tx)
  }
}

module.exports = TreatmentDetailsService
