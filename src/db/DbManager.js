import promise from 'bluebird'
import experiments from '../repos/experiments'
import experimentDesign from '../repos/experimentDesign'
import factorType from '../repos/factorType'
import hypothesis from '../repos/hypothesis'
import dependentVariable from '../repos/dependentVariable'
import pgPromise from 'pg-promise'
import cfServices from '../services/utility/ServiceConfig'
import log4js from 'log4js'
const logger = log4js.getLogger('DbManager')

// pg-promise initialization options:
const options = {
    promiseLib: promise,
    extend: (obj) => {
        obj.experiments = new (experiments)(obj, pgp)
        obj.experimentDesign = new (experimentDesign)(obj, pgp)
        obj.factorType = new (factorType)(obj, pgp)
        obj.hypothesis = new (hypothesis)(obj, pgp)
        obj.dependentVariable = new (dependentVariable)(obj, pgp)
    }
}

// Database connection parameters:
const config = cfServices.experimentsDataSource
logger.debug('loaded db connection config')

const pgp = pgPromise(options)

// Create the database instance with extensions:
const db = pgp(config)
//{
//    pgp: pgp
//    db: db
//}

module.exports = db
