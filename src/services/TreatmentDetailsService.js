import TreatmentService from './TreatmentService'
import CombinationElementService from './CombinationElementService'
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
                return _.map(treatments, (treatment,index)=> {
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
                return this._updateTreatments(treatmentDetailsObj.updates, context, tx)
            })
        })
    }

    _createTreatments(treatmentAdds, context, tx){
        if(treatmentAdds.length == 0){
            return Promise.resolve()
        }

        return this._treatmentService.batchCreateTreatments(treatmentAdds, context, tx).then((treatmentRespObjs)=> {
            const combinationElements = _.map(treatmentAdds, (treatment, index)=> {
                _.forEach(treatment.combinationElements, (element) => {
                    element.treatmentId = treatmentRespObjs[index].id
                })
                return treatment.combinationElements
            })
            return this._combinationElementService.batchCreateCombinationElements(_.flatten(combinationElements), context, tx)
        })
    }

    _updateTreatments(treatmentUpdates, context, tx){
        if(treatmentUpdates.length == 0){
            return Promise.resolve()
        }
        return this._treatmentService.batchUpdateTreatments(treatmentUpdates, context, tx).then((treatmentRespObjs)=> {
            return this._deleteCombinationElements(treatmentRespObjs, treatmentUpdates, tx).then(()=> {
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

        return this._combinationElementService.batchCreateCombinationElements(_.flatten(combinationElements), context, tx)
    }

    _deleteCombinationElements(treatmentRespObjs, treatmentUpdatesFromUI, tx) {
        return Promise.all(_.map(treatmentRespObjs, (treatmentRespObj, index)=> {
            return this._combinationElementService.getCombinationElementsByTreatmentId(treatmentRespObj.id, tx).then((objs) => {
                const combinationElementsIdsFromDB = _.map(objs, (obj) => obj.id)
                const combinationElementsIdsFromUI = _.map(treatmentUpdatesFromUI[index].combinationElements, (obj)=> {return obj.id})

                return Promise.all(_.map(_.difference(combinationElementsIdsFromDB, combinationElementsIdsFromUI), (id)=> {
                    return this._combinationElementService.deleteCombinationElement(id, tx)
                }))
            })
        }))
    }

    _updateCombinationElements(treatmentUpdatesFromUI, context, tx) {
        const combinationElementsWithIdsFromUI = _.map(treatmentUpdatesFromUI, (treatmentFromUI)=> {
            const existingElements = _.filter(treatmentFromUI.combinationElements, (combObj)=> {
                return !_.isUndefined(combObj.id)
            })

            _.forEach(existingElements, (element) => {
                element.treatmentId = treatmentFromUI.id
            })

            return existingElements
        })
        return this._combinationElementService.batchUpdateCombinationElements(_.flatten(combinationElementsWithIdsFromUI), context, tx)
    }
}

export default TreatmentDetailsService
