/**
 * Created by kprat1 on 15/11/16.
 */
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
                    const combinationElements = dataArray[index]
                    treatment.combinationElements = combinationElements
                    return treatment
                })
            })
        })
    }

    _getCombinationElementsPromises(treatments) {
        const promises = _.map(treatments, (treatment)=> {
            return this._combinationElementService.getCombinationElementsByTreatmentId(treatment.id)
        })

        return promises
    }

    @Transactional("manageAllTreatmentDetails")
    manageAllTreatmentDetails(treatmentDetailsObj, context, tx) {
        return Promise.all(_.map(treatmentDetailsObj.deletes, (id)=> {
            return this._treatmentService.deleteTreatment(id, tx)
        })).then(()=> {
            const treatmentAdds = treatmentDetailsObj.adds
            return this._treatmentService.batchCreateTreatments(treatmentAdds, context, tx).then((treatmentRespObjs)=> {
                const combinationElements = _.map(treatmentAdds, (treatment, index)=> {
                    treatment.combinationElement.treatmentId = treatmentRespObjs[index].id
                    return treatment.combinationElement
                })
                return this._combinationElementService.batchCreateCombinationElements(combinationElements, context, tx)
            }).then(()=> {
                const treatmentUpdatesFromUI = treatmentDetailsObj.updates
                this._treatmentService.batchUpdateTreatments(treatmentUpdatesFromUI, context, tx).then((treatmentRespObjs)=> {
                    return this._deleteCombinationElements(treatmentRespObjs, treatmentUpdatesFromUI, tx).then(()=> {
                        return Promise.all([this.createCombinationElements(treatmentUpdatesFromUI, context, tx),
                            this._updateCombinationElements(treatmentUpdatesFromUI, context, tx)])
                    })
                })
            })
        })


    }

    createCombinationElements(treatmentUpdatesFromUI, context, tx) {
        const combinationElements = _.map(treatmentUpdatesFromUI, (treatmentFromUI)=> {
            return _.filter(treatmentFromUI.combinationElements, (combObj)=> {
                return _.isUndefined(combObj.id)
            })

        })

        return this._combinationElementService.batchCreateCombinationElements(_.flatten(combinationElements), context, tx)
    }

    _deleteCombinationElements(treatmentRespObjs, treatmentUpdatesFromUI, tx) {
        return _.map(treatmentRespObjs, (treatmentRespObj, index)=> {
            const combinationElementsIdsFromDB = _.map(this._combinationElementService.getCombinationElementsByTreatmentId(treatmentRespObj.id), (obj)=> obj.id)
            const combinationElementsIdsFromUI = _.map(treatmentUpdatesFromUI[index], (obj)=> obj.id)
            return Promise.all(_.map(_.difference(combinationElementsIdsFromDB, combinationElementsIdsFromUI), (id)=> {
                return this._combinationElementService.deleteCombinationElement(id, tx)
            }))
        })
    }

    _updateCombinationElements(treatmentUpdatesFromUI, context, tx) {
        const combinationElementsWithIdsFromUI = _.map(treatmentUpdatesFromUI, (treatmentFromUI)=> {
            return _.filter(treatmentFromUI.combinationElements, (combObj)=> {
                return _.isDefined(combObj.id)
            })

        })
        return this._combinationElementService.batchUpdateCombinationElements(_.flatten(combinationElementsWithIdsFromUI), context, tx)
    }


}

export default TreatmentDetailsService
