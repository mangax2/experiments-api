import express from 'express'
import log4js from 'log4js'
import pt from 'promise-timeout'
import CombinationElementService from '../services/CombinationElementService'
import DependentVariableService from '../services/DependentVariableService'
import DocumentationService from '../services/DocumentationService'
import DesignSpecificationDetailService from '../services/DesignSpecificationDetailService'
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
import RefDesignSpecificationService from '../services/RefDesignSpecificationService'
import GroupExperimentalUnitCompositeService from '../services/GroupExperimentalUnitCompositeService'
import UnitTypeService from '../services/UnitTypeService'
import UnitSpecificationService from '../services/UnitSpecificationService'
import UnitSpecificationDetailService from '../services/UnitSpecificationDetailService'
import KafkaProducer from '../services/kafka/KafkaProducer'


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
  return new ExperimentsService().manageExperiments(experiments, req.query, req.context)
    .then(id => res.json(id))
    .catch(err => next(err))
})
router.put('/experiments/:id', (req, res, next) => {
  const id = req.params.id
  const experiment = req.body
  return new ExperimentsService().updateExperiment(id, experiment, req.context, false)
    .then(value => res.json(value))
    .catch(err => next(err))
})
router.get('/experiments', (req, res, next) => {
  new ExperimentsService().getExperiments(req.query, false, req.context)
    .then(experiments => res.json(experiments))
    .catch(err => next(err))
})
router.get('/experiments/:id', (req, res, next) => {
  new ExperimentsService().getExperimentById(req.params.id, false)
    .then(experiment => res.json(experiment))
    .catch(err => next(err))
})

router.get('/experiments/:id/permissions', (req, res, next) => {
  new SecurityService().permissionsCheck(req.params.id, req.context, false)
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
  return new DependentVariableService().getDependentVariablesByExperimentId(id, false)
    .then(dependentVariables => res.json(dependentVariables))
    .catch(err => next(err))
})

router.get('/dependent-variables', (req, res, next) => {
  new DependentVariableService().getAllDependentVariables()
    .then(dependentVariables => res.json(dependentVariables))
    .catch(err => next(err))
})
router.get('/dependent-variables/:id', (req, res, next) => {
  new DependentVariableService().getDependentVariableById(req.params.id, req.context)
    .then(dependentVariable => res.json(dependentVariable))
    .catch(err => next(err))
})

router.post('/experiments/:id/variables', (req, res, next) => new FactorDependentCompositeService().persistAllVariables(req.body, req.params.id, req.context, false)
  .then(success => res.json(success))
  .catch(err => next(err)))
router.post('/templates/:id/variables', (req, res, next) => new FactorDependentCompositeService().persistAllVariables(req.body, req.params.id, req.context, true)
  .then(success => res.json(success))
  .catch(err => next(err)))
router.get('/experiments/:id/variables', (req, res, next) => new FactorDependentCompositeService().getAllVariablesByExperimentId(req.params.id, false, req.context)
  .then(success => res.json(success))
  .catch(err => next(err)))

router.get('/factors', (req, res, next) => new FactorService().getAllFactors()
  .then(factors => res.json(factors))
  .catch(err => next(err)))
router.get('/experiments/:id/factors', (req, res, next) => new FactorService().getFactorsByExperimentId(req.params.id, false)
  .then(factors => res.json(factors))
  .catch(err => next(err)))
router.get('/factors/:id', (req, res, next) => new FactorService().getFactorById(req.params.id, req.context)
  .then(factors => res.json(factors))
  .catch(err => next(err)))
router.get('/factors', (req, res, next) => new FactorService().getAllFactors()
  .then(factors => res.json(factors))
  .catch(err => next(err)))

router.get('/factor-levels', (req, res, next) => new FactorLevelService().getAllFactorLevels()
  .then(factorLevels => res.json(factorLevels))
  .catch(err => next(err)))
router.get('/factors/:id/factor-levels', (req, res, next) => new FactorLevelService().getFactorLevelsByFactorId(req.params.id, req.context)
  .then(factorLevels => res.json(factorLevels))
  .catch(err => next(err)))
router.get('/factor-levels/:id', (req, res, next) => new FactorLevelService().getFactorLevelById(req.params.id, req.context)
  .then(factorLevel => res.json(factorLevel))
  .catch(err => next(err)))
router.get('/experiments/:id/composites/treatments', (req, res, next) => new TreatmentDetailsService().getAllTreatmentDetails(req.params.id, false)
  .then(value => res.json(value))
  .catch(err => next(err)))
router.post('/experiments/:id/composites/treatments', (req, res, next) => new TreatmentDetailsService().manageAllTreatmentDetails(req.params.id, req.body, req.context, false)
  .then(value => res.json(value))
  .catch(err => next(err)))

router.get('/design-specification-details/:id', (req, res, next) => new DesignSpecificationDetailService().getDesignSpecificationDetailById(req.params.id, req.context)
  .then(value => res.json(value))
  .catch(err => next(err)))

router.get('/experiments/:id/treatments', (req, res, next) => new TreatmentService().getTreatmentsByExperimentId(req.params.id, false)
  .then(treatments => res.json(treatments))
  .catch(err => next(err)))
router.get('/treatments/:id', (req, res, next) => new TreatmentService().getTreatmentById(req.params.id, req.context)
  .then(treatment => res.json(treatment))
  .catch(err => next(err)))

router.get('/treatments/:id/combination-elements', (req, res, next) => new CombinationElementService().getCombinationElementsByTreatmentId(req.params.id, req.context)
  .then(combinationElements => res.json(combinationElements))
  .catch(err => next(err)))
router.get('/combination-elements/:id', (req, res, next) => new CombinationElementService().getCombinationElementById(req.params.id, req.context)
  .then(combinationElements => res.json(combinationElements))
  .catch(err => next(err)))

router.get('/experiments/:id/experimental-units', (req, res, next) => new ExperimentalUnitService().getExperimentalUnitsByExperimentId(req.params.id, false)
  .then(experimentalUnits => res.json(experimentalUnits))
  .catch(err => next(err)))
router.get('/treatments/:id/experimental-units', (req, res, next) => new ExperimentalUnitService().getExperimentalUnitsByTreatmentId(req.params.id, req.context)
  .then(experimentalUnits => res.json(experimentalUnits))
  .catch(err => next(err)))
router.get('/experimental-units/:id', (req, res, next) => new ExperimentalUnitService().getExperimentalUnitById(req.params.id, req.context)
  .then(experimentalUnit => res.json(experimentalUnit))
  .catch(err => next(err)))
router.patch('/experiments/:id/experimental-units', (req, res, next) => new ExperimentalUnitService().batchPartialUpdateExperimentalUnits(req.body, req.context)
  .then(value => res.json(value))
  .catch(err => next(err)))

router.get('/experiments/:id/summary', (req, res, next) => new ExperimentSummaryService().getExperimentSummaryById(req.params.id, false, req.context)
  .then(summary => res.json(summary))
  .catch(err => next(err)))

router.get('/group-values/:id', (req, res, next) => new GroupValueService().getGroupValueById(req.params.id, req.context)
  .then(groupValue => res.json(groupValue))
  .catch(err => next(err)))

router.get('/experiments/:id/groups', (req, res, next) => new GroupService().getGroupsByExperimentId(req.params.id, false)
  .then(factors => res.json(factors))
  .catch(err => next(err)))

router.patch('/experiments/:id/groups', (req, res, next) => new GroupService().partiallyUpdateGroup(req.body, req.context)
  .then(factors => res.json(factors))
  .catch(err => next(err)))

router.get('/groups/:id', (req, res, next) => new GroupService().getGroupById(req.params.id, req.context)
  .then(factors => res.json(factors))
  .catch(err => next(err)))

router.get('/group-types', (req, res, next) => new GroupTypeService().getAllGroupTypes()
  .then(groupTypes => res.json(groupTypes))
  .catch(err => next(err)))
router.get('/group-types/:id', (req, res, next) => new GroupTypeService().getGroupTypeById(req.params.id, req.context)
  .then(groupType => res.json(groupType))
  .catch(err => next(err)))

router.post('/experiments/:id/composites/group-experimental-units', (req, res, next) => new GroupExperimentalUnitCompositeService().saveGroupAndUnitDetails(req.params.id, req.body, req.context, false)
  .then(value => res.json(value))
  .catch(err => next(err)))
router.get('/experiments/:id/composites/group-experimental-units', (req, res, next) => new GroupExperimentalUnitCompositeService().getGroupAndUnitDetails(req.params.id, false)
  .then(value => res.json(value))
  .catch(err => next(err)))

router.get('/experiments/:id/advanced-parameters', (req, res, next) => new DesignSpecificationDetailService().getAdvancedParameters(req.params.id, false)
  .then(value => res.json(value))
  .catch(err => next(err)))

router.get('/experiments/:id/design-specification-details/', (req, res, next) => new DesignSpecificationDetailService().getDesignSpecificationDetailsByExperimentId(req.params.id, false)
  .then(values => res.json(values))
  .catch(err => next(err)))
router.post('/experiments/:id/design-specification-details', (req, res, next) => new DesignSpecificationDetailService().manageAllDesignSpecificationDetails(req.body, req.params.id, req.context, false)
  .then(value => res.json(value))
  .catch(err => next(err)))

router.post('/experiments/:id/composites/design-group-experimental-units', (req, res, next) => new GroupExperimentalUnitCompositeService().saveDesignSpecsAndGroupUnitDetails(req.params.id, req.body, req.context, false)
  .then(value => res.json(value))
  .catch(err => next(err)))

router.get('/unit-types', (req, res, next) => new UnitTypeService().getAllUnitTypes()
  .then(values => res.json(values))
  .catch(err => next(err)))
router.get('/unit-types/:id', (req, res, next) => new UnitTypeService().getUnitTypeById(req.params.id, req.context)
  .then(value => res.json(value))
  .catch(err => next(err)))

router.get('/experiments/:id/unit-specification-details/', (req, res, next) => new UnitSpecificationDetailService().getUnitSpecificationDetailsByExperimentId(req.params.id, false)
  .then(values => res.json(values))
  .catch(err => next(err)))

router.get('/unit-specifications', (req, res, next) => new UnitSpecificationService().getAllUnitSpecifications()
  .then(values => res.json(values))
  .catch(err => next(err)))
router.get('/unit-specifications/:id', (req, res, next) => new UnitSpecificationService().getUnitSpecificationById(req.params.id, req.context)
  .then(value => res.json(value))
  .catch(err => next(err)))
router.get('/unit-specification-details/:id', (req, res, next) => new UnitSpecificationDetailService().getUnitSpecificationDetailById(req.params.id, req.context)
  .then(value => res.json(value))
  .catch(err => next(err)))
router.post('/experiments/:id/composites/unit-specification-details', (req, res, next) => new UnitSpecificationDetailService().manageAllUnitSpecificationDetails(req.params.id, req.body, req.context, false)
  .then(value => res.json(value))
  .catch(err => next(err)))

router.get('/ref-data-source-types', (req, res, next) => new RefDataSourceTypeService().getRefDataSourceTypesWithDataSources()
  .then(value => res.json(value))
  .catch(err => next(err)))

router.get('/ref-design-specifications', (req, res, next) => new RefDesignSpecificationService().getAllRefDesignSpecs()
  .then(value => res.json(value))
  .catch(err => next(err)))

router.get('/ref-design-specifications/:id', (req, res, next) => new RefDesignSpecificationService().getDesignSpecById(req.params.id, req.context)
  .then(value => res.json(value))
  .catch(err => next(err)))

router.get('/sets/:setId/treatment-details', (req, res, next) => new ExperimentalUnitService().getTreatmentDetailsBySetId(req.params.setId)
  .then(value => res.json(value))
  .catch(err => next(err)))

router.get('/set-entries', (req, res, next) => new ExperimentalUnitService().getExperimentalUnitInfoBySetId(req.query.setId)
  .then(value => res.json(value))
  .catch(err => next(err)))

router.post('/set-entries', (req, res, next) => new ExperimentalUnitService().getExperimentalUnitInfoBySetEntryId(req.body)
  .then(value => res.json(value))
  .catch(err => next(err)))

router.post('/templates', (req, res, next) => new ExperimentsService().manageTemplates(req.body, req.query, req.context)
  .then(value => res.json(value))
  .catch(err => next(err)))
router.get('/templates', (req, res, next) => {
  new ExperimentsService().getExperiments(req.query, true, req.context)
    .then(templates => res.json(templates))
    .catch(err => next(err))
})
router.get('/templates/:id', (req, res, next) => {
  new ExperimentsService().getExperimentById(req.params.id, true)
    .then(template => res.json(template))
    .catch(err => next(err))
})
router.put('/templates/:id', (req, res, next) => {
  const id = req.params.id
  const experiment = req.body
  return new ExperimentsService().updateExperiment(id, experiment, req.context, true)
    .then(value => res.json(value))
    .catch(err => next(err))
})

router.get('/templates/:id/permissions', (req, res, next) => {
  new SecurityService().permissionsCheck(req.params.id, req.context, true)
    .then(permissions => res.json(permissions))
    .catch(err => next(err))
})

router.get('/templates/:id/dependent-variables', (req, res, next) => {
  const id = req.params.id
  return new DependentVariableService().getDependentVariablesByExperimentId(id, true)
    .then(dependentVariables => res.json(dependentVariables))
    .catch(err => next(err))
})

router.get('/templates/:id/variables', (req, res, next) => new FactorDependentCompositeService().getAllVariablesByExperimentId(req.params.id, true, req.context)
  .then(success => res.json(success))
  .catch(err => next(err)))

router.get('/templates/:id/factors', (req, res, next) => new FactorService().getFactorsByExperimentId(req.params.id, true)
  .then(factors => res.json(factors))
  .catch(err => next(err)))

router.get('/templates/:id/composites/treatments', (req, res, next) => new TreatmentDetailsService().getAllTreatmentDetails(req.params.id, true)
  .then(value => res.json(value))
  .catch(err => next(err)))
router.post('/templates/:id/composites/treatments', (req, res, next) => new TreatmentDetailsService().manageAllTreatmentDetails(req.params.id, req.body, req.context, true)
  .then(value => res.json(value))
  .catch(err => next(err)))

router.get('/templates/:id/treatments', (req, res, next) => new TreatmentService().getTreatmentsByExperimentId(req.params.id, true)
  .then(treatments => res.json(treatments))
  .catch(err => next(err)))

router.get('/templates/:id/experimental-units', (req, res, next) => new ExperimentalUnitService().getExperimentalUnitsByExperimentId(req.params.id, true)
  .then(experimentalUnits => res.json(experimentalUnits))
  .catch(err => next(err)))

router.get('/templates/:id/summary', (req, res, next) => new ExperimentSummaryService().getExperimentSummaryById(req.params.id, true, req.context)
  .then(summary => res.json(summary))
  .catch(err => next(err)))

router.get('/templates/:id/groups', (req, res, next) => new GroupService().getGroupsByExperimentId(req.params.id, true)
  .then(factors => res.json(factors))
  .catch(err => next(err)))

router.post('/templates/:id/composites/group-experimental-units', (req, res, next) => new GroupExperimentalUnitCompositeService().saveGroupAndUnitDetails(req.params.id, req.body, req.context, true)
  .then(value => res.json(value))
  .catch(err => next(err)))
router.get('/templates/:id/composites/group-experimental-units', (req, res, next) => new GroupExperimentalUnitCompositeService().getGroupAndUnitDetails(req.params.id, true)
  .then(value => res.json(value))
  .catch(err => next(err)))

router.get('/templates/:id/advanced-parameters', (req, res, next) => new DesignSpecificationDetailService().getAdvancedParameters(req.params.id, true)
  .then(value => res.json(value))
  .catch(err => next(err)))

router.get('/templates/:id/design-specification-details/', (req, res, next) => new DesignSpecificationDetailService().getDesignSpecificationDetailsByExperimentId(req.params.id, true)
  .then(values => res.json(values))
  .catch(err => next(err)))
router.post('/templates/:id/design-specification-details', (req, res, next) => new DesignSpecificationDetailService().manageAllDesignSpecificationDetails(req.body, req.params.id, req.context, true)
  .then(value => res.json(value))
  .catch(err => next(err)))

router.post('/templates/:id/composites/design-group-experimental-units', (req, res, next) => new GroupExperimentalUnitCompositeService().saveDesignSpecsAndGroupUnitDetails(req.params.id, req.body, req.context, true)
  .then(value => res.json(value))
  .catch(err => next(err)))

router.get('/templates/:id/unit-specification-details/', (req, res, next) => new UnitSpecificationDetailService().getUnitSpecificationDetailsByExperimentId(req.params.id, true)
  .then(values => res.json(values))
  .catch(err => next(err)))

router.post('/templates/:id/composites/unit-specification-details', (req, res, next) => new UnitSpecificationDetailService().manageAllUnitSpecificationDetails(req.params.id, req.body, req.context, true)
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

router.post('/kafka-publish', (req, res, next) => {
  const { topic, message } = req.body
  pt.timeout(KafkaProducer.publish({ topic, message }), 8000)
    .then(result => res.json(result))
    .catch(err => next(err))
})

module.exports = router
