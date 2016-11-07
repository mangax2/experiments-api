import promise from 'bluebird'
import experiments from '../repos/experiments'
import experimentDesign from '../repos/experimentDesign'
import factor from '../repos/factor'
import factorLevel from '../repos/factorLevel'
import factorType from '../repos/factorType'
import hypothesis from '../repos/hypothesis'
import dependentVariable from '../repos/dependentVariable'
import pgPromise from 'pg-promise'
import log4js from 'log4js'
const logger = log4js.getLogger('DbManager')
import config from '../../config'

// pg-promise initialization options:
const options = {
    promiseLib: promise,
    extend: (obj) => {
        obj.experiments = new (experiments)(obj, pgp)
        obj.experimentDesign = new (experimentDesign)(obj, pgp)
        obj.factor = new (factor)(obj, pgp)
        obj.factorLevel = new (factorLevel)(obj, pgp)
        obj.factorType = new (factorType)(obj, pgp)
        obj.hypothesis = new (hypothesis)(obj, pgp)
        obj.dependentVariable = new (dependentVariable)(obj, pgp)
    }
}

// Without this option, mocking parts of pg-promise in tests is not possible
if (config.node_env== 'UNITTEST') {
    options.noLocking = true
}

// Database connection parameters:

let dbConfig = {}

// Setup database config if not running unit tests
if(config.node_env !== 'UNITTEST'){
    const cfServices = require('../services/utility/ServiceConfig')
    dbConfig = cfServices.experimentsDataSource
    logger.debug('loaded db connection config')
}
// const config = cfServices.experimentsDataSource
// logger.debug('loaded db connection config')

const pgp = pgPromise(options)

// Create the database instance with extensions:
const db = pgp(dbConfig)

module.exports = db
