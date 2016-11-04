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

            const factors = _.map(value[0].factors, (factor)=>{
                const levels = _.filter(value[0].levels, (level) => { return level.factor_id == factor.id})
                const levelValues = _.map(levels, (level) => { return level.value})

                const type = _.find(value[1], {id: factor.ref_factor_type_id}).type.toLowerCase()
                return {name: factor.name, type: type, levels: levelValues}
            })

            _.each(factors, (factor) => {
                const type = factor.type
                delete factor['type']
                variablesObject[type].push(factor)
            })

            variablesObject.dependent = _.map(value[2], (dependentVariable) => {
                return {name: dependentVariable.name, required: dependentVariable.required}
            })

            return variablesObject
        })
    }

    /**
     * @return {number}
     */
    static get INDEPENDENT_VARIABLE_TYPE_ID() {
        return 1
    }

    /**
     * @return {number}
     */
    static get EXOGENOUS_VARIABLE_TYPE_ID() {
        return 2
    }

    static _mapIndependentVariableDTO2DbEntity(independentVariables, experimentId) {
        return _.map(independentVariables, (independentVariable) => {
            independentVariable.refFactorTypeId =
                FactorDependentCompositeService.INDEPENDENT_VARIABLE_TYPE_ID
            independentVariable.experimentId = experimentId
            independentVariable.userId = 'CHANGE_ME'
            return independentVariable
        })
    }

    static _mapExogenousVariableDTO2DbEntity(independentVariables, experimentId) {
        return _.map(independentVariables, (independentVariable) => {
            independentVariable.refFactorTypeId =
                FactorDependentCompositeService.EXOGENOUS_VARIABLE_TYPE_ID
            independentVariable.experimentId = experimentId
            independentVariable.userId = 'CHANGE_ME'
            return independentVariable
        })
    }

    static _mapLevelDTO2DbEntity(levels, factorId) {
        return _.map(levels, (level) => {
            return {
                value: level,
                factorId: factorId,
                userId: 'CHANGE_ME'
            }
        })
    }

    static _mapDependentVariableDTO2DbEntity(dependentVariables, experimentId) {
        return _.map(dependentVariables, (dependentVariable) => {
            dependentVariable.experimentId = experimentId
            dependentVariable.userId = 'CHANGE_ME'
            return dependentVariable
        })
    }

    persistAllVariables(experimentVariables, context) {
        return db.tx('persistAllVariables', (tx) => {

            const experimentId = experimentVariables.experimentId

            const independentVariables = FactorDependentCompositeService._mapIndependentVariableDTO2DbEntity(
                experimentVariables.independentVariables,
                experimentId
            )

            const exogenousVariables = FactorDependentCompositeService._mapExogenousVariableDTO2DbEntity(
                experimentVariables.exogenousVariables,
                experimentId
            )

            const dependentVariables = FactorDependentCompositeService._mapDependentVariableDTO2DbEntity(
                experimentVariables.dependentVariables,
                experimentId
            )

            return Promise.all([
                this._factorService.deleteFactorsForExperimentId(experimentId, tx).then(() => {
                    return Promise.all(
                        [
                            this._factorService.batchCreateFactors(independentVariables, context, tx).then((ids) => {
                                return Promise.all(_.map(independentVariables, (factor, factorIndex) => {
                                    const levels = FactorDependentCompositeService._mapLevelDTO2DbEntity(
                                        factor.levels,
                                        ids[factorIndex].id)
                                    return this._factorLevelService.batchCreateFactorLevels(levels, context, tx)
                                }))
                            }),
                            this._factorService.batchCreateFactors(exogenousVariables, context, tx).then((ids) => {
                                return Promise.all(_.map(exogenousVariables, (factor, factorIndex) => {
                                    const levels = FactorDependentCompositeService._mapLevelDTO2DbEntity(
                                        factor.levels,
                                        ids[factorIndex].id)
                                    return this._factorLevelService.batchCreateFactorLevels(levels, context, tx)
                                }))
                            })
                        ]
                    )
                }),
                this._dependentVariableService.deleteDependentVariablesForExperimentId(experimentId, tx).then(() => {
                    return this._dependentVariableService.batchCreateDependentVariables(dependentVariables, context, tx)
                })
            ]).then(() => { return "success" })
        })
    }
}

module.exports = FactorDependentCompositeService
