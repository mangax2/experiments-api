import express from 'express'
import log4js from 'log4js'
import pt from 'promise-timeout'
import _ from 'lodash'
import CapacityRequestService from '../services/CapacityRequestService'
import DependentVariableService from '../services/DependentVariableService'
import DocumentationService from '../services/DocumentationService'
import DesignSpecificationDetailService from '../services/DesignSpecificationDetailService'
import EnvisionDatasetsService from '../services/EnvisionDatasetsService'
import ExperimentalUnitService from '../services/ExperimentalUnitService'
import ExperimentsService from '../services/ExperimentsService'
import ExperimentSummaryService from '../services/ExperimentSummaryService'
import FactorDependentCompositeService from '../services/FactorDependentCompositeService'
import FactorService from '../services/FactorService'
import ListsService from '../services/ListsService'
import LocationAssociationService from '../services/LocationAssociationService'
import PreferencesService from '../services/PreferencesService'
import SecurityService from '../services/SecurityService'
import TreatmentDetailsService from '../services/TreatmentDetailsService'
import RefDataSourceTypeService from '../services/RefDataSourceTypeService'
import GroupExperimentalUnitService from '../services/GroupExperimentalUnitService'
import UnitTypeService from '../services/UnitTypeService'
import UnitSpecificationService from '../services/UnitSpecificationService'
import UnitSpecificationDetailService from '../services/UnitSpecificationDetailService'
import KafkaProducer from '../services/kafka/KafkaProducer'
import { sendKafkaNotification } from '../decorators/notifyChanges'


const logger = log4js.getLogger('Router')
const router = express.Router()

router.get('/ping', (req, res) => {
  logger.debug(`the user for /ping url is ${req.userProfile.id}`)
  return res.json({ message: 'Received Ping request: Experiments API !!!' })
})

router.post('/experiments/:id/capacity-request-sync', (req, res, next) => {
  const { id } = req.params
  return new CapacityRequestService(
    new DesignSpecificationDetailService(),
    new UnitSpecificationDetailService(),
    new SecurityService())
    .syncCapacityRequestDataWithExperiment(id, req.body, req.context)
    .then(value => res.json(value))
    .catch(err => next(err))
})

router.post('/experiments', (req, res, next) => {
  const experiments = req.body
  return new ExperimentsService().manageExperiments(experiments, req.query, req.context)
    .then(id => res.json(id))
    .catch(err => next(err))
})
router.put('/experiments/:id', (req, res, next) => {
  const { id } = req.params
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
  new ExperimentsService().getExperimentById(req.params.id, false, req.context)
    .then(experiment => res.json(experiment))
    .catch(err => next(err))
})

router.get('/experiments/:id/permissions', (req, res, next) => {
  new SecurityService().permissionsCheck(req.params.id, req.context, false)
    .then(permissions => res.json(permissions))
    .catch(err => next(err))
})
router.get('/experiments/:id/response-variables', (req, res, next) => {
  const { id } = req.params
  return new DependentVariableService().getDependentVariablesByExperimentId(id, false, req.context)
    .then(dependentVariables => res.json(dependentVariables))
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
router.get('/experiments/:id/treatment-variables', (req, res, next) => new FactorService().getFactorsByExperimentId(req.params.id, false, req.context)
  .then(factors => res.json(factors))
  .catch(err => next(err)))
router.get('/experiments/:id/treatments', (req, res, next) => new TreatmentDetailsService().getAllTreatmentDetails(req.params.id, false, req.context)
  .then(value => res.json(value))
  .catch(err => next(err)))
router.patch('/experiments/:id/review', (req, res, next) => new ExperimentsService().handleReviewStatus(req.params.id, false, req.body, req.context)
  .then(() => res.sendStatus(204))
  .catch(err => next(err)))
router.put('/experiments/:id/treatments', (req, res, next) => new TreatmentDetailsService().handleAllTreatments(req.params.id, req.body, req.context, false)
  .then(result => res.json(result))
  .catch(err => next(err)))

router.get('/experiments/:id/experimental-units', (req, res, next) => new ExperimentalUnitService().getExperimentalUnitsByExperimentId(req.params.id, false, req.context)
  .then(experimentalUnits => res.json(experimentalUnits))
  .catch(err => next(err)))
router.patch('/experiments/:id/experimental-units', (req, res, next) => {
  logger.info(`[[${req.context.requestId}]] Attempting to associate units to entries for experiment "${req.params.id}". Values: ${JSON.stringify(req.body)}`)
  return new ExperimentalUnitService().batchPartialUpdateExperimentalUnits(req.body, req.context)
    .then((value) => {
      logger.info(`[[${req.context.requestId}]] Association succeeded.`)
      return res.json(value)
    })
    .catch((err) => {
      logger.warn(`[[${req.context.requestId}]] Association FAILED.`, err)
      return next(err)
    })
})

router.get('/experiments/:id/summary', (req, res, next) => new ExperimentSummaryService().getExperimentSummaryById(req.params.id, false, req.context)
  .then(summary => res.json(summary))
  .catch(err => next(err)))

router.patch('/experiments/:id/groups', (req, res, next) => new LocationAssociationService().associateSetsToLocations(req.params.id, req.body, req.context)
  .then(() => {
    sendKafkaNotification('update', parseInt(req.params.id, 10))
    return res.sendStatus(200)
  })
  .catch(err => next(err)))

router.get('/experiments/:id/design-specification-details', (req, res, next) => new DesignSpecificationDetailService().getAdvancedParameters(req.params.id)
  .then(values => res.json(values))
  .catch(err => next(err)))
router.put('/experiments/:id/design-specification-details', (req, res, next) => new DesignSpecificationDetailService().saveDesignSpecifications(req.body, req.params.id, false, req.context)
  .then(value => res.json(value))
  .catch(err => next(err)))

router.post('/experiments/:id/design-experimental-units', (req, res, next) => new GroupExperimentalUnitService().saveDesignSpecsAndUnits(req.params.id, req.body, req.context, false)
  .then(value => res.json(value))
  .catch(err => next(err)))


router.get('/unit-types', (req, res, next) => new UnitTypeService().getAllUnitTypes()
  .then(values => res.json(values))
  .catch(err => next(err)))

router.get('/experiments/:id/unit-specification-details', (req, res, next) => new UnitSpecificationDetailService().getUnitSpecificationDetailsByExperimentId(req.params.id, false, req.context)
  .then(values => res.json(values))
  .catch(err => next(err)))

router.get('/experiments/:id/envision-datasets-data', (req, res, next) => new EnvisionDatasetsService().getDataForEnvisionDatasets(req.params.id, req.context)
  .then(values => res.json(values))
  .catch(err => next(err)))

router.get('/experiments/:id/envision-datasets-schema', (req, res, next) => new EnvisionDatasetsService().getSchemaForEnvisionDatasets(req.params.id, req.context)
  .then(values => res.json(values))
  .catch(err => next(err)))

router.get('/experiments/:id/location-association', (req, res, next) => new LocationAssociationService().getLocationAssociationByExperimentId(req.params.id)
  .then(values => res.json(values))
  .catch(err => next(err)))

router.get('/unit-specifications', (req, res, next) => new UnitSpecificationService().getAllUnitSpecifications()
  .then(values => res.json(values))
  .catch(err => next(err)))
router.post('/experiments/:id/unit-specification-details', (req, res, next) => new UnitSpecificationDetailService().manageAllUnitSpecificationDetails(req.params.id, req.body, req.context, false)
  .then(value => res.json(value))
  .catch(err => next(err)))

router.post('/preferences/treatment-variables/lists', (req, res, next) => new ListsService(new PreferencesService()).setUserLists(req.body.userId, req.body.listIds, req.headers, req.context)
  .then(data => res.status(200).json(data))
  .catch(err => next(err)))

router.get('/ref-data-source-types', (req, res, next) => new RefDataSourceTypeService().getRefDataSourceTypesWithDataSources()
  .then(value => res.json(value))
  .catch(err => next(err)))

router.post('/sets/:setId/reset', (req, res, next) => new GroupExperimentalUnitService().resetSet(req.params.setId, req.context)
  .then(() => res.sendStatus(204))
  .catch(err => next(err)))

router.put('/sets/:setId/set-entries', (req, res, next) => new ExperimentalUnitService().updateUnitsForSet(req.params.setId, req.body, req.context)
  .then(() => res.sendStatus(200))
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
  new ExperimentsService().getExperimentById(req.params.id, true, req.context)
    .then(template => res.json(template))
    .catch(err => next(err))
})
router.put('/templates/:id', (req, res, next) => {
  const { id } = req.params
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

router.get('/templates/:id/response-variables', (req, res, next) => {
  const { id } = req.params
  return new DependentVariableService().getDependentVariablesByExperimentId(id, true, req.context)
    .then(dependentVariables => res.json(dependentVariables))
    .catch(err => next(err))
})

router.get('/templates/:id/variables', (req, res, next) => new FactorDependentCompositeService().getAllVariablesByExperimentId(req.params.id, true, req.context)
  .then(success => res.json(success))
  .catch(err => next(err)))

router.get('/templates/:id/treatment-variables', (req, res, next) => new FactorService().getFactorsByExperimentId(req.params.id, true, req.context)
  .then(factors => res.json(factors))
  .catch(err => next(err)))

router.get('/templates/:id/treatments', (req, res, next) => new TreatmentDetailsService().getAllTreatmentDetails(req.params.id, true, req.context)
  .then(value => res.json(value))
  .catch(err => next(err)))
router.put('/templates/:id/treatments', (req, res, next) => new TreatmentDetailsService().handleAllTreatments(req.params.id, req.body, req.context, true)
  .then(result => res.json(result))
  .catch(err => next(err)))

router.get('/templates/:id/experimental-units', (req, res, next) => new ExperimentalUnitService().getExperimentalUnitsByExperimentId(req.params.id, true, req.context)
  .then(experimentalUnits => res.json(experimentalUnits))
  .catch(err => next(err)))

router.get('/templates/:id/summary', (req, res, next) => new ExperimentSummaryService().getExperimentSummaryById(req.params.id, true, req.context)
  .then(summary => res.json(summary))
  .catch(err => next(err)))

router.get('/templates/:id/design-specification-details', (req, res, next) => new DesignSpecificationDetailService().getAdvancedParameters(req.params.id)
  .then(values => res.json(values))
  .catch(err => next(err)))
router.put('/templates/:id/design-specification-details', (req, res, next) => new DesignSpecificationDetailService().saveDesignSpecifications(req.body, req.params.id, true, req.context)
  .then(value => res.json(value))
  .catch(err => next(err)))

router.post('/templates/:id/design-experimental-units', (req, res, next) => new GroupExperimentalUnitService().saveDesignSpecsAndUnits(req.params.id, req.body, req.context, true)
  .then(value => res.json(value))
  .catch(err => next(err)))

router.get('/templates/:id/unit-specification-details', (req, res, next) => new UnitSpecificationDetailService().getUnitSpecificationDetailsByExperimentId(req.params.id, true, req.context)
  .then(values => res.json(values))
  .catch(err => next(err)))

router.post('/templates/:id/unit-specification-details', (req, res, next) => new UnitSpecificationDetailService().manageAllUnitSpecificationDetails(req.params.id, req.body, req.context, true)
  .then(value => res.json(value))
  .catch(err => next(err)))

router.patch('/templates/:id/review', (req, res, next) => new ExperimentsService().handleReviewStatus(req.params.id, true, req.body, req.context)
  .then(() => res.sendStatus(204))
  .catch(err => next(err)))


router.get('/getDoc/:fileName', (req, res, next) => {
  DocumentationService.getDoc(req.params.fileName).then((data) => {
    res.set('Content-Type', 'text/markdown')
    res.send(data.text)
  }).catch(err => next(err))
})

router.post('/kafka-publish', (req, res, next) => {
  const { topic, message, schemaId } = req.body
  pt.timeout(KafkaProducer.publish({ topic, message, schemaId }), 8000)
    .then(result => res.json(result))
    .catch(err => next(err))
})

router.delete('/experiments/:id', (req, res, next) => new ExperimentsService().deleteExperiment(req.params.id, req.context, false)
  .then(() => res.sendStatus(200))
  .catch(err => next(err)))

router.delete('/templates/:id', (req, res, next) => new ExperimentsService().deleteExperiment(req.params.id, req.context, true)
  .then(() => res.sendStatus(200))
  .catch(err => next(err)))

const swaggerfiedRoutes = _.compact(_.map(router.stack, (r) => {
  if (r.route && r.route.path && r.route.path !== '/ping' && r.route.path !== '/kafka-publish') {
    return _.replace(r.route.path, /:[a-zA-z]+/g, string => `{${string.substring(1)}}`)
  }
  return null
}))

require('../swagger/validateSwagger').validateSwaggerRoutes(swaggerfiedRoutes)

module.exports = router
