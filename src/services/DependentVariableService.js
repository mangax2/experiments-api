import db from "../db/DbManager"
import AppUtil from "./utility/AppUtil"
import AppError from "./utility/AppError"
import DependentVariablesValidator from "../validations/DependentVariablesValidator"
import ExperimentsService from './ExperimentsService'

import log4js from "log4js"

const logger = log4js.getLogger('DependentVariableService')

class DependentVariableService {

    constructor() {
        this._validator = new DependentVariablesValidator()
        this._experimentService = new ExperimentsService()
    }

    batchCreateDependentVariables(dependentVariables, context) {
        return this._validator.validate(dependentVariables,'POST').then(() => {
            return db.dependentVariable.repository().tx('createDependentVariablesTx', (t) => {
                return db.dependentVariable.batchCreate(t, dependentVariables, context).then(data => {
                    return AppUtil.createPostResponse(data)
                })
            })
        })
    }

    getAllDependentVariables() {
        return db.dependentVariable.all()
    }

    getDependentVariablesByExperimentId(experimentId) {
        return this._experimentService.getExperimentById(experimentId).then(()=> {
            return db.dependentVariable.findByExperimentId(experimentId)
        })
    }

    getDependentVariableById(id) {
        return db.dependentVariable.find(id).then((data) => {
            if (!data) {
                logger.error('Dependent Variable Not Found for requested id = ' + id)
                throw AppError.notFound('Dependent Variable Not Found for requested id')
            }
            else {
                return data
            }
        })
    }

    batchUpdateDependentVariables(dependentVariables, context) {
        return this._validator.validate(dependentVariables,'PUT').then(() => {
            return db.dependentVariable.repository().tx('updateDependentVariablesTx', (t) => {
                return db.dependentVariable.batchUpdate(t, dependentVariables, context).then(data => {
                    return AppUtil.createPutResponse(data)
                })
            })
        })
    }

    deleteDependentVariable(id) {
        return db.dependentVariable.remove(id).then((data) => {
            if (!data) {
                logger.error("Dependent Variable Not Found for requested id = " + id)
                throw AppError.notFound('Dependent Variable Not Found for requested id')
            }
            else {
                return data
            }
        })
    }


}

module.exports = DependentVariableService
