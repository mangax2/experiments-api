import AppUtil from "./utility/AppUtil"
import * as _ from 'lodash'
import ExperimentsService from './ExperimentsService'
import FactorLevelService from "./FactorLevelService"
import FactorService from "./factorService"
import DependentVariableService from "./DependentVariableService"
import FactorTypeService from './factorTypeService'
import Transactional from '../decorators/transactional'

class FactorDependentCompositeService {

    constructor() {
        this._experimentService = new ExperimentsService()
        this._factorLevelService = new FactorLevelService()
        this._factorService = new FactorService()
        this._dependentVariableService = new DependentVariableService()
        this._factorTypeService = new FactorTypeService()
    }

    _getFactorsWithLevels(experimentId) {
        return this._getFactors(experimentId).then((factors) => {
            return this._getFactorLevels(factors).then((levels) => {
                return {factors: _.flatten(factors), levels: _.flatten(levels)}
            })
        })
    }

    _getFactors(experimentId) {
        return this._factorService.getFactorsByExperimentId(experimentId)
    }

    _getFactorLevels(factors) {
        return Promise.all(_.map(factors, (factor) => {
            return this._factorLevelService.getFactorLevelsByFactorId(factor.id)
        }))
    }

    getAllVariablesByExperimentId(experimentId) {
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

    static _mapVariableDTO2DbEntity(variables, experimentId, variableTypeId) {
        return _.map(variables, (variable) => {
            variable.refFactorTypeId = variableTypeId
            variable.experimentId = experimentId
            return variable
        })
    }

    static _mapLevelDTO2DbEntity(levels, factorId) {
        return _.map(levels, (level) => {
            return {
                value: level,
                factorId: factorId
            }
        })
    }

    static _mapDependentVariableDTO2DbEntity(dependentVariables, experimentId) {
        return _.map(dependentVariables, (dependentVariable) => {
            dependentVariable.experimentId = experimentId
            return dependentVariable
        })
    }

    static _mapIndependentAndExogenousVariableDTO2Entity(experimentId,
                                                         independentVariables,
                                                         exogenousVariables) {
        const independentVariableEntities =
            FactorDependentCompositeService._mapVariableDTO2DbEntity(
                independentVariables,
                experimentId,
                FactorDependentCompositeService.INDEPENDENT_VARIABLE_TYPE_ID
            )

        const exogenousVariableEntities =
            FactorDependentCompositeService._mapVariableDTO2DbEntity(
                exogenousVariables,
                experimentId,
                FactorDependentCompositeService.EXOGENOUS_VARIABLE_TYPE_ID
            )

        return _.concat(independentVariableEntities, exogenousVariableEntities)
    }

    static _mapVariablesDTO2LevelsEntity(variables, ids) {
        // This produces an array of arrays where each sub array represents levels of a variable
        const factorLevels = _.map(variables, (factor, factorIndex) => {
            return FactorDependentCompositeService._mapLevelDTO2DbEntity(
                factor.levels,
                ids[factorIndex].id)
        })
        // This returns an array of levels removing the sub array.
        return _.flatten(factorLevels)
    }

    _persistVariablesWithLevels(experimentId, independentAndExogenousVariables, context, tx) {
        return this._factorService.deleteFactorsForExperimentId(experimentId, tx).then(() => {
            return this._factorService.batchCreateFactors(independentAndExogenousVariables, context, tx).then((ids) => {
                return this._factorLevelService.batchCreateFactorLevels(
                    FactorDependentCompositeService._mapVariablesDTO2LevelsEntity(independentAndExogenousVariables, ids),
                    context,
                    tx)
            })
        })
    }

    _persistVariablesWithoutLevels(experimentId, dependentVariables, context, tx) {
        return this._dependentVariableService.deleteDependentVariablesForExperimentId(experimentId, tx).then(() => {
            return this._dependentVariableService.batchCreateDependentVariables(dependentVariables, context, tx)
        })
    }

    _persistVariables(experimentId,
                      independentAndExogenousVariables,
                      dependentVariables,
                      context,
                      tx) {
        return Promise.all([
            this._persistVariablesWithLevels(experimentId, independentAndExogenousVariables, context, tx),
            this._persistVariablesWithoutLevels(experimentId, dependentVariables, context, tx)
        ])
    }

    @Transactional('persistAllVariables')
    persistAllVariables(experimentVariables, context, tx) {
        const experimentId = experimentVariables.experimentId
        return this._persistVariables(
            experimentId,
            FactorDependentCompositeService._mapIndependentAndExogenousVariableDTO2Entity(
                experimentId,
                experimentVariables.independent,
                experimentVariables.exogenous
            ),
            FactorDependentCompositeService._mapDependentVariableDTO2DbEntity(
                experimentVariables.dependent,
                experimentId
            ),
            context,
            tx)
            .then(() => {
                return AppUtil.createPostResponse([{id: experimentId}])
            })
    }
}

module.exports = FactorDependentCompositeService
