import db from "../db/DbManager"
import AppUtil from "./utility/AppUtil"
import AppError from "./utility/AppError"
// import DependentVariablesValidator from "../validations/DependentVariablesValidator"
import * as _ from 'lodash'

import ExperimentsService from './ExperimentsService'
import FactorLevelService from "./FactorLevelService"
import FactorService from "./factorService"
import DependentVariableService from "./DependentVariableService"
import FactorTypeService from './factorTypeService'

import log4js from "log4js"
const logger = log4js.getLogger('FactorDependentCompositeService')

class FactorDependentCompositeService {

    constructor() {
        // this._validator = new DependentVariablesValidator()
        this._experimentService = new ExperimentsService()
        this._factorLevelService = new FactorLevelService()
        this._factorService = new FactorService()
        this._dependentVariableService = new DependentVariableService()
        this._factorTypeService = new FactorTypeService()
    }

    getAllVariablesByExperimentId(experimentId){
        return Promise.all(
            [
                this._factorService.getFactorsByExperimentId(experimentId).then((values) => {
                    return Promise.all(_.map(values, (value) => { return this._factorLevelService.getFactorLevelsByFactorId(value.id)})).then((levels) => {
                        return [values, levels]
                    })
                }),
                this._dependentVariableService.getDependentVariablesByExperimentId(experimentId),
                this._factorTypeService.getAllFactorTypes()
            ]
        ).then((value) => {
            const object = {
                independent: [],
                exogenous: [],
                dependent: []
            }

            const variables = _.map(value[0][0], (variable, index)=>{
                const levels = _.map(value[0][1][index], (level) => { return level.value})
                const type = _.find(value[2], {id: variable.ref_factor_type_id}).type.toLowerCase()
                return {name: variable.name, type: type, levels: levels}
            })

            _.each(variables, (variable) => {
                object[variable.type].push(variable)
            })

            object.dependent = _.map(value[1], (dependentVariable) => {
                return {name: dependentVariable.name, required: dependentVariable.required}
            })

            return object
        })
    }
}

module.exports = FactorDependentCompositeService
