const _ = require('lodash')
const log4js = require('log4js')
const logger = log4js.getLogger('SchemaValidator')

export class ReferentialIntegrityService {
    getById(id, entity){
        return entity.find(id)
    }

    getByBusinessKey(keys, entity){
        return entity.findByBusinessKey(keys)
        // switch(entity){
            // case "ref_experiment_design":
            //     return db.experimentDesign.find(id)
            // case "experiment":
            //     return db.experiment.find(id)
            // case "factor_type":
            //     return db.factorType.find(id)
            // case "hypothesis":
            //     return db.hypothesis.find(id)
            // default:
            //     throw AppError.badRequest("Unknown Entity")
        // }
    }
}

module.exports = ReferentialIntegrityService