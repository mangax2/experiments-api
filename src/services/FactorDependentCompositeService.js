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
        return db.tx('getAllVariablesByExperimentId', (t) => {
            return Promise.all(
                [
                    this._factorService.getFactorsByExperimentId(experimentId).then((values) => {
                        return Promise.all(_.map(values, (value) => { return this._factorLevelService.getFactorLevelsByFactorId(value.id)})).then((levels) => {
                            return [values, _.flatten(levels)]
                        })
                    }),
                    this._dependentVariableService.getDependentVariablesByExperimentId(experimentId),
                    this._factorTypeService.getAllFactorTypes()
                ]
            ).then((value) => {
                const object = {
                    independentVariables: [],
                    exogenousVariables: [],
                    dependentVariables: []
                }

                _.map(value[2], (factorType) => {
                    const id = factorType.id
                    const type = factorType.type

                    const factorsByType = _.filter(value[0][0], (factor)=> {
                        return factor.ref_factor_type_id == id
                    })

                    const typeVariables = _.map(factorsByType, (factor) => {
                        const factorId = factor.id

                        const levelsByFactor = _.filter(value[0][1], (level) => {
                            return level.factor_id === factorId
                        })

                        const levelValues = _.map(levelsByFactor, (level) => {
                            return level.value
                        })

                        return {name: factor.name, levels: levelValues}
                    })

                    switch(type){
                        case 'Independent':
                            object.independentVariables = typeVariables
                            break
                        case 'Exogenous':
                            object.exogenousVariables = typeVariables
                    }
                })

                const dependentVariables = _.map(value[1], (dependentVariable) => {
                    return {name: dependentVariable.name, required: dependentVariable.required}
                })

                object.dependentVariables = dependentVariables

                return object
            }).catch((err) => {
                console.log(err)
            })

        })
    }
}

module.exports = FactorDependentCompositeService
