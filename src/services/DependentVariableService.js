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

    createDependentVariables(dependentVariables) {
        return this._validator.validate(dependentVariables).then(() => {
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

    updateDependentVariable(id, dependentVariable) {
        return this._validator.validate([dependentVariable]).then(() => {
            return db.dependentVariable.update(id, dependentVariable).then((data) => {
                if (!data) {
                    logger.error("Dependent Variable Not Found to Update for id = " + id)
                    throw AppError.notFound('Dependent Variable Not Found to Update')
                } else {
                    return data
                }
            })
        })
    }

    deleteDependentVariable(id) {
        return db.dependentVariable.remove(id).then((data) => {
            if (!data) {
                logger.error("Dependent Variable  Not Found for requested id = " + id)
                throw AppError.notFound('Dependent Variable  Not Found for requested id')
            }
            else {
                return data
            }
        })
    }


}

module.exports = DependentVariableService
