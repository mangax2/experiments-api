import promise from 'bluebird'
import pgPromise from 'pg-promise'
import { setDbInstance } from '@monsantoit/pg-transactional'
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
import configurator from '../configs/configurator'
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
if (!process.env.VAULT_ENV) {
  options.noLocking = true
}

// Database connection parameters:
const dbWriteConfig = {
  type: 'conn',
  application_name: `experiments-api-${process.env.VAULT_ENV}`,
}
const dbReadConfig = {
  type: 'conn',
  application_name: `experiments-api-${process.env.VAULT_ENV}-ro`,
}

// Setup database config if not running unit tests
if (process.env.VAULT_ENV) {
  dbWriteConfig.host = configurator.get('database.host')
  dbWriteConfig.port = configurator.get('database.port')
  dbWriteConfig.database = configurator.get('database.name')
  dbWriteConfig.min = configurator.get('database.min')
  dbWriteConfig.max = configurator.get('database.max')
  dbWriteConfig.idleTimeoutMillis = configurator.get('database.idleTimeout')
  dbWriteConfig.ssl = { ca: Buffer.from(configurator.get('database.ca'), 'base64').toString() }
  dbWriteConfig.user = configurator.get('database.appUser')
  dbWriteConfig.password = configurator.get('database.appUserPassword')

  dbReadConfig.host = configurator.get('databaseRo.host')
  dbReadConfig.port = configurator.get('databaseRo.port')
  dbReadConfig.database = configurator.get('databaseRo.name')
  dbReadConfig.min = configurator.get('databaseRo.min')
  dbReadConfig.max = configurator.get('databaseRo.max')
  dbReadConfig.idleTimeoutMillis = configurator.get('databaseRo.idleTimeout')
  dbReadConfig.ssl = { ca: Buffer.from(configurator.get('databaseRo.ca'), 'base64').toString() }
  dbReadConfig.user = configurator.get('databaseRo.appUser')
  dbReadConfig.password = configurator.get('databaseRo.appUserPassword')

  console.info('loaded db connection config')
}

const pgp = pgPromise(options)

// Create the database instance with extensions:
export const dbWrite = pgp(dbWriteConfig)
export const dbRead = pgp(dbReadConfig)

setDbInstance(dbWrite)
