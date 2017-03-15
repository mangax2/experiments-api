import db from "../db/DbManager"
import log4js from "log4js"
const logger = log4js.getLogger('SearchService')
class SearchService{

    getExperimentIdsByTag(tag) {
        return db.tag.findExperimentIdsByTag(tag)

    }



}
module.exports = SearchService
