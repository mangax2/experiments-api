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
import FactorType from '../repos/factorType'
import lambdaPerformance from '../repos/lambdaPerformance'
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
import dataSource from '../config/dataSource'
import VaultUtil from '../services/utility/VaultUtil'

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
    obj.factorType = FactorType(obj, pgp)
    obj.graphqlAudit = GraphQLAudit(obj, pgp)
    obj.lambdaPerformance = lambdaPerformance(obj, pgp)
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
  dbConfig = dataSource
  dbConfig.user = VaultUtil.dbAppUser
  dbConfig.password = VaultUtil.dbAppPassword
  console.info('loaded db connection config')
}

const pgp = pgPromise(options)

// Create the database instance with extensions:
const db = pgp(dbConfig)

setDbInstance(db)

module.exports = db
