import promise from 'bluebird'
import pgPromise from 'pg-promise'
import { setDbInstance } from '@monsantoit/pg-transactional'
import config from '../../config'
import CombinationElement from '../repos/combinationElement'
import DependentVariable from '../repos/dependentVariable'
import DesignSpecificationDetail from '../repos/designSpecificationDetail'
import Duplication from '../repos/duplication'
import Experiments from '../repos/experiments'
import ExperimentSummary from '../repos/experimentSummary'
import Factor from '../repos/factor'
import FactorLevel from '../repos/factorLevel'
import FactorLevelAssociation from '../repos/factorLevelAssociation'
import FactorLevelDetails from '../repos/factorLevelDetails'
import FactorPropertiesForLevel from '../repos/factorPropertiesForLevel'
import FactorType from '../repos/factorType'
import LocationAssociation from '../repos/locationAssociation'
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
import GraphQLAudit from '../repos/graphqlAudit'
import AnalysisModel from '../repos/analysisModel'
import Block from '../repos/block'
import TreatmentBlock from '../repos/treatmentBlock'
import configurator from '../config/configurator'
import TreatmentVariableLevelDetails from '../repos/treatmentFactorLevelDetails'
import TreatmentVariableLevelFlatDetails from '../repos/treatmentFactorLevelFlatDetails'

// pg-promise initialization options:
const options = {

  promiseLib: promise,
  extend: (obj) => {
    obj.combinationElement = CombinationElement(obj, pgp)
    obj.dependentVariable = DependentVariable(obj, pgp)
    obj.designSpecificationDetail = DesignSpecificationDetail(obj, pgp)
    obj.duplication = Duplication(obj, pgp)
    obj.experiments = Experiments(obj, pgp)
    obj.experimentSummary = ExperimentSummary(obj, pgp)
    obj.factor = Factor(obj, pgp)
    obj.factorLevel = FactorLevel(obj, pgp)
    obj.factorLevelAssociation = FactorLevelAssociation(obj, pgp)
    obj.factorLevelDetails = FactorLevelDetails(obj, pgp)
    obj.factorPropertiesForLevel = FactorPropertiesForLevel(obj, pgp)
    obj.factorType = FactorType(obj, pgp)
    obj.graphqlAudit = GraphQLAudit(obj, pgp)
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
    obj.locationAssociation = LocationAssociation(obj, pgp)
    obj.analysisModel = AnalysisModel(obj, pgp)
    obj.block = Block(obj, pgp)
    obj.treatmentBlock = TreatmentBlock(obj, pgp)
    obj.treatmentVariableLevelDetails = TreatmentVariableLevelDetails(obj, pgp)
    obj.treatmentVariableLevelFlatDetails = TreatmentVariableLevelFlatDetails(obj, pgp)
  },
}

// Without this option, mocking parts of pg-promise in tests is not possible
if (config.node_env === 'UNITTEST' || config.node_env === 'test') {
  options.noLocking = true
}

// Database connection parameters:
const dbWriteConfig = {
  type: 'conn',
  application_name: `experiments-api-${config.node_env}`,
}
const dbReadConfig = {
  type: 'conn',
  application_name: `experiments-api-${config.node_env}-ro`,
}

// Setup database config if not running unit tests
if (config.node_env !== 'UNITTEST') {
  dbWriteConfig.host = configurator.get('databaseHost')
  dbWriteConfig.port = configurator.get('databasePort')
  dbWriteConfig.database = configurator.get('databaseName')
  dbWriteConfig.min = configurator.get('databaseMin')
  dbWriteConfig.max = configurator.get('databaseMax')
  dbWriteConfig.idleTimeoutMillis = configurator.get('databaseIdleTimeout')
  dbWriteConfig.ssl = { ca: Buffer.from(configurator.get('databaseCa'), 'base64').toString() }
  dbWriteConfig.user = configurator.get('databaseAppUser')
  dbWriteConfig.password = configurator.get('databaseAppUserPassword')

  dbReadConfig.host = configurator.get('databaseRoHost')
  dbReadConfig.port = configurator.get('databaseRoPort')
  dbReadConfig.database = configurator.get('databaseRoName')
  dbReadConfig.min = configurator.get('databaseRoMin')
  dbReadConfig.max = configurator.get('databaseRoMax')
  dbReadConfig.idleTimeoutMillis = configurator.get('databaseRoIdleTimeout')
  dbReadConfig.ssl = { ca: Buffer.from(configurator.get('databaseRoCa'), 'base64').toString() }
  dbReadConfig.user = configurator.get('databaseRoAppUser')
  dbReadConfig.password = configurator.get('databaseRoAppUserPassword')

  console.info('loaded db connection config')
}

const pgp = pgPromise(options)

// Create the database instance with extensions:
export const dbWrite = pgp(dbWriteConfig)
export const dbRead = pgp(dbReadConfig)

setDbInstance(dbWrite)
