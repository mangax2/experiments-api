import TreatmentService from './TreatmentService'
import CombinationElementService from './CombinationElementService'
import AppUtil from './utility/AppUtil'
import _ from 'lodash'
import Transactional from '../decorators/transactional'

class TreatmentDetailsService {

    constructor() {
        this._treatmentService = new TreatmentService()
        this._combinationElementService = new CombinationElementService()
    }

    @Transactional("getAllTreatmentDetails")
    getAllTreatmentDetails(experimentId, tx) {
        return this._treatmentService.getTreatmentsByExperimentIdNoValidate(experimentId, tx).then((treatments)=> {
            const treatmentIds = _.map(treatments, (t) => t.id)
            return this._combinationElementService.batchGetCombinationElementsByTreatmentIdsNoValidate(treatmentIds, tx).then((treatmentCombinationElements) => {
                return _.map(treatments, (treatment, treatmentIndex) => {
                    treatment.combinationElements = treatmentCombinationElements[treatmentIndex]
                    return treatment
                })
            })
        })
    }

    @Transactional("manageAllTreatmentDetails")
    manageAllTreatmentDetails(treatmentDetailsObj, context, tx) {
        return this._deleteTreatments(treatmentDetailsObj.deletes, tx).then(() => {
            return this._updateTreatments(treatmentDetailsObj.updates, context, tx).then(() => {
                return this._createTreatments(treatmentDetailsObj.adds, context, tx).then(() => {
                    return AppUtil.createCompositePostResponse()
                })
            })
        })
    }

    _deleteTreatments(treatmentIdsToDelete, tx) {
        if (_.isUndefined(treatmentIdsToDelete) || treatmentIdsToDelete.length == 0) {
            return Promise.resolve()
        }
        return this._treatmentService.batchDeleteTreatments(treatmentIdsToDelete, tx)
    }

    _createTreatments(treatmentAdds, context, tx) {
        if (_.isUndefined(treatmentAdds) || treatmentAdds.length == 0) {
            return Promise.resolve()
        }

        return this._treatmentService.batchCreateTreatments(treatmentAdds, context, tx).then((createTreatmentsResponses)=> {
            const newTreatmentIds = _.map(createTreatmentsResponses, (response) => response.id)
            return this._createCombinationElements(
                this._assembleBatchCreateCombinationElementsRequestFromAdds(treatmentAdds, newTreatmentIds),
                context,
                tx
            )
        })
    }

    _assembleBatchCreateCombinationElementsRequestFromAdds(treatments, treatmentIds) {
        this._appendParentTreatmentIdsToCombinationElements(treatments, treatmentIds)
        return this._removeUndefinedElements(
            this._extractCombinationElementsFromTreatments(treatments)
        )
    }

    _appendParentTreatmentIdsToCombinationElements(treatments, treatmentIds) {
        _.forEach(treatments, (treatment, index)=> {
            _.forEach(treatment.combinationElements, (element) => {
                element.treatmentId = treatmentIds[index]
            })
        })
    }

    _extractCombinationElementsFromTreatments(treatments) {
        return _.flatMap(treatments, (treatment) => treatment.combinationElements)
    }

    _removeUndefinedElements(elements) {
        return _.filter(elements, (element) => !_.isUndefined(element))
    }

    _updateTreatments(treatmentUpdates, context, tx) {
        if (_.isUndefined(treatmentUpdates) || treatmentUpdates.length == 0) {
            return Promise.resolve()
        }
        return this._treatmentService.batchUpdateTreatments(treatmentUpdates, context, tx).then(() => {
            return this._deleteCombinationElements(treatmentUpdates, tx).then(()=> {
                return this._createAndUpdateCombinationElements(treatmentUpdates, context, tx)
            })
        })
    }

    _deleteCombinationElements(treatmentUpdates, tx) {
        return this._identifyCombinationElementIdsForDelete(treatmentUpdates, tx).then((idsForDeletion) => {
            if (idsForDeletion.length == 0) {
                return Promise.resolve()
            }
            return this._combinationElementService.batchDeleteCombinationElements(idsForDeletion, tx)
        })
    }

    _identifyCombinationElementIdsForDelete(treatments, tx) {
        const treatmentIds = _.map(treatments, (treatment) => treatment.id)
        return this._combinationElementService.batchGetCombinationElementsByTreatmentIds(treatmentIds, tx).then((currentCombinationElementsByTreatment) => {
            return _.flatMap(currentCombinationElementsByTreatment, (curCombinationElements, index) => {
                const currentCombinationElements = _.map(curCombinationElements, (curCombinationElement) => curCombinationElement.id)
                const newCombinationElements = _.map(treatments[index].combinationElements, (combinationElement) => combinationElement.id)
                return _.difference(currentCombinationElements, newCombinationElements)
            })
        })
    }

    _createAndUpdateCombinationElements(treatmentUpdates, context, tx) {
        return this._updateCombinationElements(
            this._assembleBatchUpdateCombinationElementsRequestFromUpdates(treatmentUpdates),
            context,
            tx).then(() => {
            return this._createCombinationElements(
                this._assembleBatchCreateCombinationElementsRequestFromUpdates(treatmentUpdates),
                context,
                tx)
        })
    }

    _assembleBatchCreateCombinationElementsRequestFromUpdates(treatments) {
        return _.flatMap(treatments, (treatment)=> {
            const newElements = _.filter(treatment.combinationElements, (combObj)=> {
                return _.isUndefined(combObj.id)
            })

            return _.forEach(newElements, (element) => {
                element.treatmentId = treatment.id
            })
        })
    }

    _assembleBatchUpdateCombinationElementsRequestFromUpdates(treatmentUpdates) {
        return _.flatMap(treatmentUpdates, (treatmentUpdate)=> {
            const existingElements = _.filter(treatmentUpdate.combinationElements, (combinationElement)=> {
                return !_.isUndefined(combinationElement.id)
            })

            return _.forEach(existingElements, (element) => {
                element.treatmentId = treatmentUpdate.id
            })
        })
    }

    _createCombinationElements(combinationElements, context, tx) {
        if (combinationElements.length == 0) {
            return Promise.resolve()
        }
        return this._combinationElementService.batchCreateCombinationElements(
            combinationElements, context, tx)
    }

    _updateCombinationElements(combinationElements, context, tx) {
        if (combinationElements.length == 0) {
            return Promise.resolve()
        }
        return this._combinationElementService.batchUpdateCombinationElements(
            combinationElements, context, tx)
    }
}

module.exports = TreatmentDetailsService
