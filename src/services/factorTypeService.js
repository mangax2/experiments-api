import db from "../db/DbManager";
import FactorTypesValidator from "../validations/FactorTypesValidator";
import AppError from "./utility/AppError";
class FactorTypeService {
    constructor() {
        this._validator = new FactorTypesValidator()
    }

    createFactorType(factorType, created_user_id) {
        return this._validator.validate([factorType]).then(() => {
            return db.factorType.repository().tx('createFactorType', (tx) => {
                return db.factorType.create(tx, factorType, created_user_id)
            })
        })
    }

    getAllFactorTypes() {
        return db.factorType.all()
    }

    getFactorTypeById(id) {
        return db.factorType.find(id).then((data) => {
            if (!data) {
                throw AppError.notFound('Factor Type Not Found')
            } else {
                return data
            }
        })
    }

    updateFactorType(id, factorType, modified_user_id) {
        return this._validator.validate([factorType]).then(() => {
            return db.factorType.repository().tx('updateFactorType', (tx) => {
                return db.factorType.update(tx, id, factorType, modified_user_id).then((data) => {
                    if (!data) {
                        throw AppError.notFound('Factor Type Not Found')
                    } else {
                        return data
                    }
                })
            })
        })
    }

    deleteFactorType(id) {
        return db.factorType.repository().tx('deleteFactorType', (tx) => {
            return db.factorType.delete(tx, id).then((data) => {
                if (!data) {
                    throw AppError.notFound('Factor Type Not Found')
                } else {
                    return data
                }
            })
        })
    }
}

module.exports = FactorTypeService