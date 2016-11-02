import * as _ from 'lodash'
import FactorLevelService from "./FactorLevelService"
import FactorService from "./factorService"
import DependentVariableService from "./DependentVariableService"
import FactorTypeService from './factorTypeService'

import log4js from "log4js"
const logger = log4js.getLogger('FactorDependentCompositeService')

class FactorDependentCompositeService {

    constructor() {
        this._factorLevelService = new FactorLevelService()
        this._factorService = new FactorService()
        this._dependentVariableService = new DependentVariableService()
        this._factorTypeService = new FactorTypeService()
    }

    _getFactorsWithLevels(experimentId){
        return this._getFactors(experimentId).then((factors) => {
            return this._getFactorLevels(factors).then((levels) => {
                return {factors: _.flatten(factors), levels: _.flatten(levels)}
            })
        })
    }

    _getFactors(experimentId){
        return this._factorService.getFactorsByExperimentId(experimentId)
    }

    _getFactorLevels(factors){
        return Promise.all(_.map(factors, (factor) => { return this._factorLevelService.getFactorLevelsByFactorId(factor.id)}))
    }

    getAllVariablesByExperimentId(experimentId){
        return Promise.all(
            [
                this._getFactorsWithLevels(experimentId),
                this._factorTypeService.getAllFactorTypes(),
                this._dependentVariableService.getDependentVariablesByExperimentId(experimentId)
            ]
        ).then((value) => {
            const variablesObject = {
                independent: [],
                exogenous: [],
                dependent: []
            }

            const variables = _.map(value[0].factors, (variable)=>{
                const levels = _.filter(value[0].levels, (level) => { return level.factor_id == variable.id})
                const levelValues = _.map(levels, (level) => { return level.value})

                const type = _.find(value[1], {id: variable.ref_factor_type_id}).type.toLowerCase()
                return {name: variable.name, type: type, levels: levelValues}
            })

            _.each(variables, (variable) => {
                const type = variable.type
                delete variable['type']
                variablesObject[type].push(variable)
            })

            variablesObject.dependent = _.map(value[2], (dependentVariable) => {
                return {name: dependentVariable.name, required: dependentVariable.required}
            })

            return variablesObject
        })
    }
}

module.exports = FactorDependentCompositeService
