import promise from 'bluebird'
import pgPromise from 'pg-promise'
import log4js from 'log4js'
import config from '../../config'
import CombinationElement from '../repos/combinationElement'
import DependentVariable from '../repos/dependentVariable'
import DesignSpecificationDetail from '../repos/designSpecificationDetail'
import Duplication from '../repos/duplication'
import EnvisionDatasets from '../repos/envisionDatasets'
import Experiments from '../repos/experiments'
import ExperimentDesign from '../repos/experimentDesign'
import ExperimentSummary from '../repos/experimentSummary'
import Factor from '../repos/factor'
import FactorLevel from '../repos/factorLevel'
import FactorLevelAssociation from '../repos/factorLevelAssociation'
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
import Comment from '../repos/comment'

const logger = log4js.getLogger('DbManager')

// pg-promise initialization options:
const options = {

  promiseLib: promise,
  extend: (obj) => {
    obj.combinationElement = CombinationElement(obj, pgp)
    obj.dependentVariable = DependentVariable(obj, pgp)
    obj.designSpecificationDetail = DesignSpecificationDetail(obj, pgp)
    obj.duplication = Duplication(obj, pgp)
    obj.experiments = Experiments(obj, pgp)
    obj.envisionDatasets = EnvisionDatasets(obj, pgp)
    obj.experimentDesign = ExperimentDesign(obj, pgp)
    obj.experimentSummary = ExperimentSummary(obj, pgp)
    obj.factor = Factor(obj, pgp)
    obj.factorLevel = FactorLevel(obj, pgp)
    obj.factorLevelAssociation = FactorLevelAssociation(obj, pgp)
    obj.factorType = FactorType(obj, pgp)
    obj.group = Group(obj, pgp)
    obj.groupType = GroupType(obj, pgp)
    obj.groupValue = GroupValue(obj, pgp)
    obj.owner = Owner(obj, pgp)
    obj.refDataSource = RefDataSource(obj, pgp)
    obj.refDataSourceType = RefDataSourceType(obj, pgp)
    obj.refDesignSpecification = RefDesignSpecification(obj, pgp)
    obj.treatment = Treatment(obj, pgp)
    obj.unit = Unit(obj, pgp)
    obj.unitSpecification = UnitSpecification(obj, pgp)
    obj.unitSpecificationDetail = UnitSpecificationDetail(obj, pgp)
    obj.unitType = UnitType(obj, pgp)
    obj.comment = Comment(obj, pgp)
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
