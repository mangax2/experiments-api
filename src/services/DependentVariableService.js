import db from "../db/DbManager"
import AppUtil from "./utility/AppUtil"
import AppError from "./utility/AppError"
import DependentVariablesValidator from "../validations/DependentVariablesValidator"
import log4js from "log4js"

const logger = log4js.getLogger('DependentVariableService')

class DependentVariableService {

    constructor() {
        this._validator = new DependentVariablesValidator()
    }

    batchCreateDependentVariables(dependentVariables) {
        return this._validator.validate(dependentVariables,'POST').then(() => {
            return db.experiments.repository().tx('createDependentVariablesTx', (t) => {
                return db.dependentVariable.batchCreate(t, dependentVariables).then(data => {
                    return AppUtil.createPostResponse(data)
                })
            })
        })
    }

    getAllDependentVariables() {
        return db.dependentVariable.all()
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

    batchUpdateDependentVariables(dependentVariables) {
        return this._validator.validate(dependentVariables,'PUT').then(() => {
            return db.experiments.repository().tx('updateDependentVariablesTx', (t) => {
                return db.dependentVariable.batchUpdate(t, dependentVariables).then(data => {
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
