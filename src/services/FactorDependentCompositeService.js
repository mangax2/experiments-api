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

    persistAllVariables(experimentVariables) {
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
                            this._factorService.batchCreateFactors(independentVariables, tx).then((ids) => {
                                return Promise.all(_.map(independentVariables, (factor, factorIndex) => {
                                    const levels = FactorDependentCompositeService._mapLevelDTO2DbEntity(
                                        factor.levels,
                                        ids[factorIndex].id)
                                    return this._factorLevelService.batchCreateFactorLevels(levels, tx)
                                }))
                            }),
                            this._factorService.batchCreateFactors(exogenousVariables, tx).then((ids) => {
                                return Promise.all(_.map(exogenousVariables, (factor, factorIndex) => {
                                    const levels = FactorDependentCompositeService._mapLevelDTO2DbEntity(
                                        factor.levels,
                                        ids[factorIndex].id)
                                    return this._factorLevelService.batchCreateFactorLevels(levels, tx)
                                }))
                            })
                        ]
                    )
                }),
                this._dependentVariableService.deleteDependentVariablesForExperimentId(experimentId, tx).then(() => {
                    return this._dependentVariableService.batchCreateDependentVariables(dependentVariables, tx)
                })
            ]).then(() => { return "success" })
        })
    }

    getAllVariablesByExperimentId(experimentId) {
        return db.tx('getAllVariablesByExperimentId', (t) => {
            return Promise.all(
                [
                    this._factorService.getFactorsByExperimentId(experimentId).then((values) => {
                        return Promise.all(_.map(values, (value) => {
                            return this._factorLevelService.getFactorLevelsByFactorId(value.id)
                        })).then((levels) => {
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

                    switch (type) {
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
