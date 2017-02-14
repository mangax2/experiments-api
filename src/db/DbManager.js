import config from '../../config'
import log4js from 'log4js'
const logger = log4js.getLogger('DbManager')
import promise from 'bluebird'
import pgPromise from 'pg-promise'

import combinationElement from '../repos/combinationElement'
import dependentVariable from '../repos/dependentVariable'
import experiments from '../repos/experiments'
import experimentDesign from '../repos/experimentDesign'
import experimentSummary from '../repos/experimentSummary'
import factor from '../repos/factor'
import factorLevel from '../repos/factorLevel'
import factorType from '../repos/factorType'
import group from '../repos/group'
import groupType from '../repos/groupType'
import groupValue from '../repos/groupValue'
import randomizationStrategy from '../repos/randomizationStrategy'
import treatment from '../repos/treatment'
import unit from '../repos/unit'

// pg-promise initialization options:
const options = {
    promiseLib: promise,
    extend: (obj) => {
        obj.combinationElement = new (combinationElement)(obj, pgp)
        obj.dependentVariable = new (dependentVariable)(obj, pgp)
        obj.experiments = new (experiments)(obj, pgp)
        obj.experimentDesign = new (experimentDesign)(obj, pgp)
        obj.experimentSummary = new (experimentSummary) (obj, pgp)
        obj.factor = new (factor)(obj, pgp)
        obj.factorLevel = new (factorLevel)(obj, pgp)
        obj.factorType = new (factorType)(obj, pgp)
        obj.group = new (group) (obj, pgp)
        obj.groupType = new (groupType) (obj, pgp)
        obj.groupValue = new (groupValue)(obj, pgp)
        obj.randomizationStrategy = new (randomizationStrategy) (obj, pgp)
        obj.treatment = new (treatment)(obj, pgp)
        obj.unit = new (unit) (obj, pgp)
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

// const monitor = require('pg-monitor')
// monitor.attach(options)
// monitor.setTheme('matrix')

// Create the database instance with extensions:
const db = pgp(dbConfig)

module.exports = db
