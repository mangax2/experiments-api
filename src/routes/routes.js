import express from 'express'
import log4js from 'log4js'
import CombinationElementService from '../services/CombinationElementService'
import DependentVariableService from '../services/DependentVariableService'
import DocumentationService from '../services/DocumentationService'
import ExperimentalUnitService from '../services/ExperimentalUnitService'
import ExperimentsService from '../services/ExperimentsService'
import ExperimentDesignService from '../services/ExperimentDesignService'
import ExperimentSummaryService from '../services/ExperimentSummaryService'
import FactorDependentCompositeService from '../services/FactorDependentCompositeService'
import FactorLevelService from '../services/FactorLevelService'
import FactorService from '../services/FactorService'
import FactorTypeService from '../services/FactorTypeService'
import GroupValueService from '../services/GroupValueService'
import SecurityService from '../services/SecurityService'
import TreatmentService from '../services/TreatmentService'
import TreatmentDetailsService from '../services/TreatmentDetailsService'
import GroupService from '../services/GroupService'
import GroupTypeService from '../services/GroupTypeService'
import RefDataSourceTypeService from '../services/RefDataSourceTypeService'
import GroupExperimentalUnitCompositeService from '../services/GroupExperimentalUnitCompositeService'
import UnitTypeService from '../services/UnitTypeService'
import UnitSpecificationService from '../services/UnitSpecificationService'
import UnitSpecificationDetailService from '../services/UnitSpecificationDetailService'

const logger = log4js.getLogger('Router')
const router = express.Router()

router.get('/ping', (req, res) => {
  logger.debug(`the user for /ping url is ${req.userProfile.id}`)
  return res.json({ message: 'Received Ping request: Experiments API !!!' })
})

router.get('/experiment-designs', (req, res, next) => new ExperimentDesignService().getAllExperimentDesigns()
  .then(r => res.json(r))
  .catch(err => next(err)))
router.get('/experiment-designs/:id', (req, res, next) => {
  const id = req.params.id
  return new ExperimentDesignService().getExperimentDesignById(id)
    .then(design => res.json(design))
    .catch(err => next(err))
})

router.post('/experiments', (req, res, next) => {
  const experiments = req.body
  return new ExperimentsService().batchCreateExperiments(experiments, req.context)
    .then(id => res.json(id))
    .catch(err => next(err))
})
router.put('/experiments/:id', (req, res, next) => {
  const id = req.params.id
  const experiment = req.body
  return new ExperimentsService().updateExperiment(id, experiment, req.context)
    .then(value => res.json(value))
    .catch(err => next(err))
})
router.get('/experiments', (req, res, next) => {
  new ExperimentsService().getExperiments(req.query)
    .then(experiments => res.json(experiments))
    .catch(err => next(err))
})
router.get('/experiments/:id', (req, res, next) => {
  new ExperimentsService().getExperimentById(req.params.id)
    .then(experiment => res.json(experiment))
    .catch(err => next(err))
})

router.get('/experiments/:id/permissions', (req, res, next) => {
  new SecurityService().getUserPermissionsForExperiment(req.params.id, req.context)
    .then(permissions => res.json(permissions))
    .catch(err => next(err))
})

router.get('/factor-types', (req, res, next) => new FactorTypeService().getAllFactorTypes()
  .then(r => res.json(r))
  .catch(err => next(err)))
router.get('/factor-types/:id', (req, res, next) => {
  const id = req.params.id
  return new FactorTypeService().getFactorTypeById(id)
    .then(r => res.json(r))
    .catch(err => next(err))
})

router.get('/experiments/:id/dependent-variables', (req, res, next) => {
  const id = req.params.id
  return new DependentVariableService().getDependentVariablesByExperimentId(id)
    .then(dependentVariables => res.json(dependentVariables))
    .catch(err => next(err))
})

router.get('/dependent-variables', (req, res, next) => {
  new DependentVariableService().getAllDependentVariables()
    .then(dependentVariables => res.json(dependentVariables))
    .catch(err => next(err))
})
router.get('/dependent-variables/:id', (req, res, next) => {
  new DependentVariableService().getDependentVariableById(req.params.id)
    .then(dependentVariable => res.json(dependentVariable))
    .catch(err => next(err))
})

router.post('/variables', (req, res, next) => new FactorDependentCompositeService().persistAllVariables(req.body, req.context)
  .then(success => res.json(success))
  .catch(err => next(err)))
router.get('/experiments/:id/variables', (req, res, next) => new FactorDependentCompositeService().getAllVariablesByExperimentId(req.params.id)
  .then(success => res.json(success))
  .catch(err => next(err)))

router.get('/factors', (req, res, next) => new FactorService().getAllFactors()
  .then(factors => res.json(factors))
  .catch(err => next(err)))
router.get('/experiments/:id/factors', (req, res, next) => new FactorService().getFactorsByExperimentId(req.params.id)
  .then(factors => res.json(factors))
  .catch(err => next(err)))
router.get('/factors/:id', (req, res, next) => new FactorService().getFactorById(req.params.id)
  .then(factors => res.json(factors))
  .catch(err => next(err)))
router.get('/factors', (req, res, next) => new FactorService().getAllFactors()
  .then(factors => res.json(factors))
  .catch(err => next(err)))

router.get('/factor-levels', (req, res, next) => new FactorLevelService().getAllFactorLevels()
  .then(factorLevels => res.json(factorLevels))
  .catch(err => next(err)))
router.get('/factors/:id/factor-levels', (req, res, next) => new FactorLevelService().getFactorLevelsByFactorId(req.params.id)
  .then(factorLevels => res.json(factorLevels))
  .catch(err => next(err)))
router.get('/factor-levels/:id', (req, res, next) => new FactorLevelService().getFactorLevelById(req.params.id)
  .then(factorLevel => res.json(factorLevel))
  .catch(err => next(err)))
router.get('/experiments/:id/composites/treatments', (req, res, next) => new TreatmentDetailsService().getAllTreatmentDetails(req.params.id)
  .then(value => res.json(value))
  .catch(err => next(err)))
router.post('/composites/treatments', (req, res, next) => new TreatmentDetailsService().manageAllTreatmentDetails(req.body, req.context)
  .then(value => res.json(value))
  .catch(err => next(err)))
router.get('/experiments/:id/treatments', (req, res, next) => new TreatmentService().getTreatmentsByExperimentId(req.params.id)
  .then(treatments => res.json(treatments))
  .catch(err => next(err)))
router.get('/treatments/:id', (req, res, next) => new TreatmentService().getTreatmentById(req.params.id)
  .then(treatment => res.json(treatment))
  .catch(err => next(err)))

router.get('/treatments/:id/combination-elements', (req, res, next) => new CombinationElementService().getCombinationElementsByTreatmentId(req.params.id)
  .then(combinationElements => res.json(combinationElements))
  .catch(err => next(err)))
router.get('/combination-elements/:id', (req, res, next) => new CombinationElementService().getCombinationElementById(req.params.id)
  .then(combinationElements => res.json(combinationElements))
  .catch(err => next(err)))

router.get('/experiments/:id/experimental-units', (req, res, next) => new ExperimentalUnitService().getExperimentalUnitsByExperimentId(req.params.id)
  .then(experimentalUnits => res.json(experimentalUnits))
  .catch(err => next(err)))
router.get('/treatments/:id/experimental-units', (req, res, next) => new ExperimentalUnitService().getExperimentalUnitsByTreatmentId(req.params.id)
  .then(experimentalUnits => res.json(experimentalUnits))
  .catch(err => next(err)))
router.get('/experimental-units/:id', (req, res, next) => new ExperimentalUnitService().getExperimentalUnitById(req.params.id)
  .then(experimentalUnit => res.json(experimentalUnit))
  .catch(err => next(err)))

router.get('/experiments/:id/summary', (req, res, next) => new ExperimentSummaryService().getExperimentSummaryById(req.params.id)
  .then(summary => res.json(summary))
  .catch(err => next(err)))

router.get('/group-values/:id', (req, res, next) => new GroupValueService().getGroupValueById(req.params.id)
  .then(groupValue => res.json(groupValue))
  .catch(err => next(err)))

router.get('/experiments/:id/groups', (req, res, next) => new GroupService().getGroupsByExperimentId(req.params.id)
  .then(factors => res.json(factors))
  .catch(err => next(err)))

router.get('/groups/:id', (req, res, next) => new GroupService().getGroupById(req.params.id)
  .then(factors => res.json(factors))
  .catch(err => next(err)))

router.get('/group-types', (req, res, next) => new GroupTypeService().getAllGroupTypes()
  .then(groupTypes => res.json(groupTypes))
  .catch(err => next(err)))
router.get('/group-types/:id', (req, res, next) => new GroupTypeService().getGroupTypeById(req.params.id)
  .then(groupType => res.json(groupType))
  .catch(err => next(err)))

router.post('/experiments/:id/composites/group-experimental-units', (req, res, next) => new GroupExperimentalUnitCompositeService().saveGroupAndUnitDetails(req.params.id, req.body, req.context)
  .then(value => res.json(value))
  .catch(err => next(err)))
router.get('/experiments/:id/composites/group-experimental-units', (req, res, next) => new GroupExperimentalUnitCompositeService().getGroupAndUnitDetails(req.params.id)
  .then(value => res.json(value))
  .catch(err => next(err)))

router.get('/unit-types', (req, res, next) => new UnitTypeService().getAllUnitTypes()
  .then(values => res.json(values))
  .catch(err => next(err)))
router.get('/unit-types/:id', (req, res, next) => new UnitTypeService().getUnitTypeById(req.params.id)
  .then(value => res.json(value))
  .catch(err => next(err)))

router.get('/experiments/:id/unit-specification-details/', (req, res, next) => new UnitSpecificationDetailService().getUnitSpecificationDetailsByExperimentId(req.params.id)
  .then(values => res.json(values))
  .catch(err => next(err)))

router.get('/unit-specifications', (req, res, next) => new UnitSpecificationService().getAllUnitSpecifications()
  .then(values => res.json(values))
  .catch(err => next(err)))
router.get('/unit-specifications/:id', (req, res, next) => new UnitSpecificationService().getUnitSpecificationById(req.params.id)
  .then(value => res.json(value))
  .catch(err => next(err)))
router.get('/unit-specification-details/:id', (req, res, next) => new UnitSpecificationDetailService().getUnitSpecificationDetailById(req.params.id)
  .then(value => res.json(value))
  .catch(err => next(err)))
router.post('/composites/unit-specification-details', (req, res, next) => new UnitSpecificationDetailService().manageAllUnitSpecificationDetails(req.body, req.context)
  .then(value => res.json(value))
  .catch(err => next(err)))

router.get('/ref-data-source-types', (req, res, next) => new RefDataSourceTypeService().getRefDataSourceTypesWithDataSources()
  .then(value => res.json(value))
  .catch(err => next(err)))


router.get('/getImage/:topic/:imageName', (req, res, next) => {
  DocumentationService.getImage(req.params.topic, req.params.imageName).then((data) => {
    res.set('Content-Type', 'image/png')
    res.set('Content-Transfer-Encoding', 'binary')
    res.send(data.body)
  }).catch(err => next(err))
})
router.get('/getDoc/:fileName', (req, res, next) => {
  DocumentationService.getDoc(req.params.fileName).then((data) => {
    res.set('Content-Type', 'text/markdown')
    res.send(data.text)
  }).catch(err => next(err))
})

module.exports = router
