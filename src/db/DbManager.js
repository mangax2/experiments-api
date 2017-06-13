import promise from 'bluebird'
import pgPromise from 'pg-promise'
import log4js from 'log4js'
import config from '../../config'
import CombinationElement from '../repos/combinationElement'
import DependentVariable from '../repos/dependentVariable'
import DesignSpecificationDetail from '../repos/designSpecificationDetail'
import Duplication from '../repos/duplication'
import Experiments from '../repos/experiments'
import ExperimentDesign from '../repos/experimentDesign'
import ExperimentSummary from '../repos/experimentSummary'
import Factor from '../repos/factor'
import FactorLevel from '../repos/factorLevel'
import FactorType from '../repos/factorType'
import Group from '../repos/group'
import GroupType from '../repos/groupType'
import GroupValue from '../repos/groupValue'
import Owner from '../repos/owner'
import RefDataSource from '../repos/refDataSource'
import RefDataSourceType from '../repos/refDataSourceType'
import RefDesignSpecification from '../repos/refDesignSpecification'
import Treatment from '../repos/treatment'
import Unit from '../repos/unit'
import UnitSpecification from '../repos/unitSpecification'
import UnitSpecificationDetail from '../repos/unitSpecificationDetail'
import UnitType from '../repos/unitType'

const logger = log4js.getLogger('DbManager')

// pg-promise initialization options:
const options = {

  promiseLib: promise,
  extend: (obj) => {
    obj.combinationElement = new (CombinationElement)(obj, pgp)
    obj.dependentVariable = new (DependentVariable)(obj, pgp)
    obj.designSpecificationDetail = new (DesignSpecificationDetail)(obj, pgp)
    obj.duplication = new (Duplication)(obj, pgp)
    obj.experiments = new (Experiments)(obj, pgp)
    obj.experimentDesign = new (ExperimentDesign)(obj, pgp)
    obj.experimentSummary = new (ExperimentSummary)(obj, pgp)
    obj.factor = new (Factor)(obj, pgp)
    obj.factorLevel = new (FactorLevel)(obj, pgp)
    obj.factorType = new (FactorType)(obj, pgp)
    obj.group = new (Group)(obj, pgp)
    obj.groupType = new (GroupType)(obj, pgp)
    obj.groupValue = new (GroupValue)(obj, pgp)
    obj.owner = new (Owner)(obj, pgp)
    obj.refDataSource = new (RefDataSource)(obj, pgp)
    obj.refDataSourceType = new (RefDataSourceType)(obj, pgp)
    obj.refDesignSpecification = new (RefDesignSpecification)(obj, pgp)
    obj.treatment = new (Treatment)(obj, pgp)
    obj.unit = new (Unit)(obj, pgp)
    obj.unitSpecification = new (UnitSpecification)(obj, pgp)
    obj.unitSpecificationDetail = new (UnitSpecificationDetail)(obj, pgp)
    obj.unitType = new (UnitType)(obj, pgp)
  },
}

// Without this option, mocking parts of pg-promise in tests is not possible
if (config.node_env === 'UNITTEST' || config.node_env === 'test') {
  options.noLocking = true
}

// Database connection parameters:

let dbConfig = {}

// Setup database config if not running unit tests
if (config.node_env !== 'UNITTEST') {
  // eslint-disable-next-line global-require
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
