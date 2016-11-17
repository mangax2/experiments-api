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

    getAllTreatmentDetails(experimentId) {
        return this._treatmentService.getTreatmentsByExperimentId(experimentId).then((treatments)=> {
            return Promise.all(this._getCombinationElementsPromises(treatments)).then((dataArray)=> {
                return _.map(treatments, (treatment, index)=> {
                    treatment.combinationElements = dataArray[index]
                    return treatment
                })
            })
        })
    }

    _getCombinationElementsPromises(treatments) {
        return _.map(treatments, (treatment)=> {
            return this._combinationElementService.getCombinationElementsByTreatmentId(treatment.id)
        })
    }

    @Transactional("manageAllTreatmentDetails")
    manageAllTreatmentDetails(treatmentDetailsObj, context, tx) {
        return Promise.all(_.map(treatmentDetailsObj.deletes, (id)=> {
            return this._treatmentService.deleteTreatment(id, tx)
        })).then(()=> {
            return this._createTreatments(treatmentDetailsObj.adds, context, tx).then(()=> {
                return this._updateTreatments(treatmentDetailsObj.updates, context, tx).then(()=> AppUtil.createCompositePostResponse())
            })
        })
    }

    _createTreatments(treatmentAdds, context, tx) {
        if (_.isUndefined(treatmentAdds) || treatmentAdds.length == 0) {
            return Promise.resolve()
        }

        return this._treatmentService.batchCreateTreatments(treatmentAdds, context, tx).then((treatmentRespObjs)=> {
            const combinationElements =
                _.filter(
                    _.flatMap(treatmentAdds, (treatment, index)=> {
                        _.forEach(treatment.combinationElements, (element) => {
                            element.treatmentId = treatmentRespObjs[index].id
                        })
                        return treatment.combinationElements
                    }), (element) =>  !_.isUndefined(element))
            if (combinationElements.length == 0) {
                return Promise.resolve()
            }
            return this._combinationElementService.batchCreateCombinationElements(combinationElements, context, tx)
        })
    }

    _updateTreatments(treatmentUpdates, context, tx) {
        if (_.isUndefined(treatmentUpdates) || treatmentUpdates.length == 0) {
            return Promise.resolve()
        }
        return this._treatmentService.batchUpdateTreatments(treatmentUpdates, context, tx).then(() => {
            return this._deleteCombinationElements(treatmentUpdates, tx).then(()=> {
                return Promise.all([this.createCombinationElements(treatmentUpdates, context, tx),
                    this._updateCombinationElements(treatmentUpdates, context, tx)])
            })
        })
    }

    createCombinationElements(treatmentUpdatesFromUI, context, tx) {
        const combinationElements = _.map(treatmentUpdatesFromUI, (treatmentFromUI)=> {
            const newElements = _.filter(treatmentFromUI.combinationElements, (combObj)=> {
                return _.isUndefined(combObj.id)
            })

            _.forEach(newElements, (element) => {
                element.treatmentId = treatmentFromUI.id
            })

            return newElements
        })
        const combinationElementsArray= _.flatten(combinationElements)
         if(combinationElementsArray.length==0){
            return Promise.resolve()
         }
        return this._combinationElementService.batchCreateCombinationElements(combinationElementsArray, context, tx)
    }

    _deleteCombinationElements(treatmentUpdates, tx) {
        return Promise.all(_.map(treatmentUpdates, (treatmentUpdate, index)=> {
            return this._combinationElementService.getCombinationElementsByTreatmentId(treatmentUpdate.id, tx).then((objs) => {
                const combinationElementsIdsFromDB = _.map(objs, (obj) => obj.id)
                const combinationElementsIdsFromUI = _.map(treatmentUpdates[index].combinationElements, (obj)=> {
                    return obj.id
                })

                return Promise.all(_.map(_.difference(combinationElementsIdsFromDB, combinationElementsIdsFromUI), (id)=> {
                    return this._combinationElementService.deleteCombinationElement(id, tx)
                }))
            })
        }))
    }

    _updateCombinationElements(treatmentUpdatesFromUI, context, tx) {
        const combinationElementsWithIdsFromUI = _.flatten(_.map(treatmentUpdatesFromUI, (treatmentFromUI)=> {
            const existingElements = _.filter(treatmentFromUI.combinationElements, (combObj)=> {
                return !_.isUndefined(combObj.id)
            })

            _.forEach(existingElements, (element) => {
                element.treatmentId = treatmentFromUI.id
            })

            return existingElements
        }))

        if (combinationElementsWithIdsFromUI.length == 0) {
            return Promise.resolve()
        }
        return this._combinationElementService.batchUpdateCombinationElements(combinationElementsWithIdsFromUI, context, tx)
    }
}

module.exports = TreatmentDetailsService
