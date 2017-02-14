import db from "../db/DbManager"
import AppError from "./utility/AppError"
import log4js from "log4js"

const logger = log4js.getLogger('GroupTypeService')

class GroupTypeService {

    getGroupTypeById(id) {
        return db.groupType.find(id).then((data) => {
            if(!data) {
                logger.error('Group Type Not Found for requested id = ' + id)
                throw AppError.notFound('Group Type Not Found for requested id')
            }
            else {
                return data
            }
        })
    }

    getAllGroupTypes() {
        return db.groupType.all()
    }
}

module.exports = GroupTypeService