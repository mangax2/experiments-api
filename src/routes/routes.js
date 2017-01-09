import express from 'express'
import log4js from 'log4js'

import CombinationElementService from '../services/CombinationElementService'
import DependentVariableService from '../services/DependentVariableService'
import ExperimentalUnitService from '../services/ExperimentalUnitService'
import ExperimentsService from '../services/ExperimentsService'
import ExperimentDesignService from '../services/ExperimentDesignService'
import ExperimentSummaryService from '../services/ExperimentSummaryService'
import FactorDependentCompositeService from '../services/FactorDependentCompositeService'
import FactorLevelService from '../services/FactorLevelService'
import FactorService from '../services/factorService'
import FactorTypeService from '../services/factorTypeService'
import GroupValueService from '../services/GroupValueService'
import TreatmentService from '../services/TreatmentService'
import TreatmentDetailsService from '../services/TreatmentDetailsService'
import ExperimentalUnitService from '../services/ExperimentalUnitService'
import GroupService from '../services/GroupService'
import RandomizationStrategyService from '../services/RandomizationStrategyService'


const logger = log4js.getLogger('Router')
const router = express.Router()

router.get('/ping', (req, res) => {
    logger.debug('the user for /ping url is ' + req.userProfile.id)
    return res.json({message: 'Received Ping request: Experiments API !!!'})
})

router.post('/experiment-designs', (req, res, next) => {
    const design = req.body
    return new ExperimentDesignService().createExperimentDesign(design, req.context).then((id) => {
        return res.status(201).json(id)
    }).catch((err) => {
        return next(err)
    })
})
router.put('/experiment-designs/:id', (req, res, next) => {
    const id = req.params.id
    const design=req.body
    return new ExperimentDesignService().updateExperimentDesign(id, design, req.context).then((design) => {
        return res.json(design)
    }).catch((err) => {
        return next(err)
    })
})

router.get('/experiment-designs', (req, res, next) => {
    return new ExperimentDesignService().getAllExperimentDesigns().then((r) => {
        return res.json(r)
    }).catch((err) => {
        return next(err)
    })
})

router.get('/experiment-designs/:id', (req, res, next) => {
    const id = req.params.id
    return new ExperimentDesignService().getExperimentDesignById(id).then((design) => {
        return res.json(design)
    }).catch((err) => {
        return next(err)
    })
})

router.delete('/experiment-designs/:id', (req, res, next) => {
    const id = req.params.id
    return new ExperimentDesignService().deleteExperimentDesign(id).then((id) => {
        return res.json(id)
    }).catch((err) => {
        return next(err)
    })
})

router.post('/experiments', (req, res, next) => {
    const experiments = req.body
    return new ExperimentsService().batchCreateExperiments(experiments, req.context).then((id) => {
        return res.json(id)
    }).catch((err) => {
        return next(err)
    })
})

router.put('/experiments/:id', (req, res, next) => {
    const id = req.params.id
    const experiment = req.body
    return new ExperimentsService().updateExperiment(id, experiment, req.context).then((value) => {
        return res.json(value)
    }).catch((err) => {
        return next(err)
    })
})

router.get('/experiments', (req, res, next) => {
    new ExperimentsService().getAllExperiments().then((experiments)=> {
        return res.json(experiments)
    }).catch((err) => {
        return next(err)
    })
})


router.get('/experiments/:id', (req, res, next) => {
    new ExperimentsService().getExperimentById(req.params.id).then((experiment)=> {
        return res.json(experiment)
    }).catch((err) => {
        return next(err)
    })
})

router.delete('/experiments/:id', (req, res, next) => {
    const id = req.params.id
    return new ExperimentsService().deleteExperiment(id).then((value) => {
        return res.json(value)
    }).catch((err) => {
        return next(err)
    })
})

router.post('/factor-types', (req, res, next) => {
    const factorType = req.body
    return new FactorTypeService().createFactorType(factorType, req.context).then((id) => {
        return res.status(201).json(id)
    }).catch((err) => {
        return next(err)
    })
})

router.put('/factor-types/:id', (req, res, next) => {
    const id = req.params.id
    const factorType = req.body
    return new FactorTypeService().updateFactorType(id, factorType, req.context).then((r) => {
        return res.json(r)
    }).catch((err) => {
        return next(err)
    })
})

router.get('/factor-types', (req, res, next) => {
    return new FactorTypeService().getAllFactorTypes().then((r) => {
        return res.json(r)
    }).catch((err) => {
        return next(err)
    })
})


router.get('/factor-types/:id', (req, res, next) => {
    const id = req.params.id
    return new FactorTypeService().getFactorTypeById(id).then((r) => {
        return res.json(r)
    }).catch((err) => {
        return next(err)
    })
})

router.delete('/factor-types/:id', (req, res, next) => {
    const id = req.params.id
    return new FactorTypeService().deleteFactorType(id).then((r) => {
        return res.json(r)
    }).catch((err) => {
        return next(err)
    })
})


router.get('/experiments/:id/dependent-variables', (req, res, next)=> {
    const id = req.params.id
    return new DependentVariableService().getDependentVariablesByExperimentId(id).then((dependentVariables)=> {
        return res.json(dependentVariables)
    }).catch((err)=> {
        return next(err)
    })
})

router.post('/dependent-variables', (req, res, next) => {
    const dependentVariables = req.body
    return new DependentVariableService().batchCreateDependentVariables(dependentVariables, req.context).then((id) => {
        return res.json(id)
    }).catch((err) => {
        return next(err)
    })
})

router.put('/dependent-variables', (req, res, next) => {
    const dependentVariables = req.body
    return new DependentVariableService().batchUpdateDependentVariables(dependentVariables, req.context).then((value) => {
        return res.json(value)
    }).catch((err) => {
        return next(err)
    })
})


router.get('/dependent-variables', (req, res, next) => {
    new DependentVariableService().getAllDependentVariables().then((dependentVariables)=> {
        return res.json(dependentVariables)
    }).catch((err) => {
        return next(err)
    })
})


router.get('/dependent-variables/:id', (req, res, next) => {
    new DependentVariableService().getDependentVariableById(req.params.id).then((dependentVariable)=> {
        return res.json(dependentVariable)
    }).catch((err) => {
        return next(err)
    })
})

router.delete('/dependent-variables/:id', (req, res, next) => {
    const id = req.params.id
    return new DependentVariableService().deleteDependentVariable(id).then((value) => {
        return res.json(value)
    }).catch((err) => {
        return next(err)
    })
})

router.post('/variables', (req, res, next) => {
    return new FactorDependentCompositeService().persistAllVariables(req.body, req.context).then((success) => {
        return res.json(success)
    }).catch((err) => {
        return next(err)
    })
})

router.get('/experiments/:id/variables', (req, res, next) => {
    return new FactorDependentCompositeService().getAllVariablesByExperimentId(req.params.id).then((success) => {
        return res.json(success)
    }).catch((err) => {
        return next(err)
    })
})


router.post('/factors', (req, res, next) => {
    return new FactorService().batchCreateFactors(req.body, req.context).then((id) => {
        return res.json(id)
    }).catch((err) => {
        return next(err)
    })
})
router.put('/factors', (req, res, next) => {
    return new FactorService().batchUpdateFactors(req.body, req.context).then((value) => {
        return res.json(value)
    }).catch((err) => {
        return next(err)
    })
})

router.get('/factors', (req, res, next) => {
    return new FactorService().getAllFactors().then((factors) => {
        return res.json(factors)
    }).catch((err) => {
        return next(err)
    })
})

router.get('/experiments/:id/factors', (req, res, next)=> {
    return new FactorService().getFactorsByExperimentId(req.params.id).then((factors)=> {
        return res.json(factors)
    }).catch((err)=> {
        return next(err)
    })
})

router.get('/factors/:id', (req, res, next) => {
    return new FactorService().getFactorById(req.params.id).then((factors) => {
        return res.json(factors)
    }).catch((err) => {
        return next(err)
    })
})


router.delete('/factors/:id', (req, res, next) => {
    return new FactorService().deleteFactor(req.params.id).then((value) => {
        return res.json(value)
    }).catch((err) => {
        return next(err)
    })
})


router.post('/factor-levels', (req, res, next) => {
    return new FactorLevelService().batchCreateFactorLevels(req.body, req.context).then((id) => {
        return res.json(id)
    }).catch((err) => {
        return next(err)
    })
})

router.put('/factor-levels', (req, res, next) => {
    return new FactorLevelService().batchUpdateFactorLevels(req.body, req.context).then((value) => {
        return res.json(value)
    }).catch((err) => {
        return next(err)
    })
})


router.get('/factor-levels', (req, res, next) => {
    return new FactorLevelService().getAllFactorLevels().then((factorLevels) => {
        return res.json(factorLevels)
    }).catch((err) => {
        return next(err)
    })
})



router.get('/factors/:id/factor-levels', (req, res, next)=> {
    return new FactorLevelService().getFactorLevelsByFactorId(req.params.id).then((factorLevels)=> {
        return res.json(factorLevels)
    }).catch((err)=> {
        return next(err)
    })
})

router.get('/factor-levels/:id', (req, res, next) => {
    return new FactorLevelService().getFactorLevelById(req.params.id).then((factorLevel) => {
        return res.json(factorLevel)
    }).catch((err) => {
        return next(err)
    })
})


router.delete('/factor-levels/:id', (req, res, next) => {
    return new FactorLevelService().deleteFactorLevel(req.params.id).then((value) => {
        return res.json(value)
    }).catch((err) => {
        return next(err)
    })
})




router.post('/treatments', (req, res, next) => {
    return new TreatmentService().batchCreateTreatments(req.body, req.context).then((id) => {
        return res.json(id)
    }).catch((err) => {
        return next(err)
    })
})
router.put('/treatments', (req, res, next) => {
    return new TreatmentService().batchUpdateTreatments(req.body, req.context).then((value) => {
        return res.json(value)
    }).catch((err) => {
        return next(err)
    })
})


router.get('/experiments/:id/treatments', (req, res, next)=> {
    return new TreatmentService().getTreatmentsByExperimentId(req.params.id).then((treatments)=> {
        return res.json(treatments)
    }).catch((err)=> {
        return next(err)
    })
})

router.get('/treatments/:id', (req, res, next) => {
    return new TreatmentService().getTreatmentById(req.params.id).then((treatment) => {
        return res.json(treatment)
    }).catch((err) => {
        return next(err)
    })
})

router.delete('/treatments/:id', (req, res, next) => {
    return new TreatmentService().deleteTreatment(req.params.id).then((value) => {
        return res.json(value)
    }).catch((err) => {
        return next(err)
    })
})



router.post('/combination-elements', (req, res, next) => {
    return new CombinationElementService().batchCreateCombinationElements(req.body, req.context).then((id) => {
        return res.json(id)
    }).catch((err) => {
        return next(err)
    })
})

router.put('/combination-elements', (req, res, next) => {
    return new CombinationElementService().batchUpdateCombinationElements(req.body, req.context).then((value) => {
        return res.json(value)
    }).catch((err) => {
        return next(err)
    })
})


router.get('/treatments/:id/combination-elements', (req, res, next)=> {
    return new CombinationElementService().getCombinationElementsByTreatmentId(req.params.id).then((combinationElements)=> {
        return res.json(combinationElements)
    }).catch((err)=> {
        return next(err)
    })
})

router.get('/combination-elements/:id', (req, res, next) => {
    return new CombinationElementService().getCombinationElementById(req.params.id).then((combinationElements) => {
        return res.json(combinationElements)
    }).catch((err) => {
        return next(err)
    })
})


router.delete('/combination-elements/:id', (req, res, next) => {
    return new CombinationElementService().deleteCombinationElement(req.params.id).then((value) => {
        return res.json(value)
    }).catch((err) => {
        return next(err)
    })
})

router.get('/experiments/:id/composites/treatments', (req, res, next) => {
    return new TreatmentDetailsService().getAllTreatmentDetails(req.params.id).then((value) => {
        return res.json(value)
    }).catch((err) => {
        return next(err)
    })
})

router.post('/composites/treatments', (req, res, next) => {
    return new TreatmentDetailsService().manageAllTreatmentDetails(req.body,req.context).then((value) => {
        return res.json(value)
    }).catch((err) => {
        return next(err)
    })
})

router.post('/experimental-units', (req, res, next) => {
    return new ExperimentalUnitService().batchCreateExperimentalUnits(req.body, req.context).then((id) => {
        return res.json(id)
    }).catch((err) => {
        return next(err)
    })
})

router.put('/experimental-units', (req, res, next) => {
    return new ExperimentalUnitService().batchUpdateExperimentalUnits(req.body, req.context).then((value) => {
        return res.json(value)
    }).catch((err) => {
        return next(err)
    })
})


router.get('/experiments/:id/experimental-units', (req, res, next)=> {
    return new ExperimentalUnitService().getExperimentalUnitsByExperimentId(req.params.id).then((experimentalUnits)=> {
        return res.json(experimentalUnits)
    }).catch((err)=> {
        return next(err)
    })
})

router.get('/treatments/:id/experimental-units', (req, res, next)=> {
    return new ExperimentalUnitService().getExperimentalUnitsByTreatmentId(req.params.id).then((experimentalUnits)=> {
        return res.json(experimentalUnits)
    }).catch((err)=> {
        return next(err)
    })
})

router.get('/experimental-units/:id', (req, res, next) => {
    return new ExperimentalUnitService().getExperimentalUnitById(req.params.id).then((experimentalUnit) => {
        return res.json(experimentalUnit)
    }).catch((err) => {
        return next(err)
    })
})


router.delete('/experimental-units/:id', (req, res, next) => {
    return new ExperimentalUnitService().deleteExperimentalUnit(req.params.id).then((value) => {
        return res.json(value)
    }).catch((err) => {
        return next(err)
    })
})

router.get('/experiments/:id/summary', (req, res, next) => {
    return new ExperimentSummaryService().getExperimentSummaryById(req.params.id).then((summary) => {
        return res.json(summary)
    }).catch((err) => {
        return next(err)
    })
})

router.get('/group-values/:id', (req, res, next)=>{
    return new GroupValueService().getGroupValueById(req.params.id).then((groupValue)=>{
        return res.json(groupValue)
    }).catch((err)=>{
        return next(err)
    })
})

router.post('/group-values', (req, res, next)=>{
    return new GroupValueService().batchCreateGroupValues(req.body, req.context).then((id)=>{
        return res.json(id)
    }).catch((err)=>{
        return next(err)
    })
})

router.put('/group-values', (req, res, next)=>{
    return new GroupValueService().batchUpdateGroupValues(req.body, req.context).then((groupValues)=>{
        return res.json(groupValues)
    }).catch((err)=>{
        return next(err)
    })
})

router.delete('/group-values/:id', (req, res, next)=>{
    return new GroupValueService().deleteGroupValue(req.params.id).then((value)=>{
        return res.json(value)
    }).catch((err)=>{
        return next(err)
    })
})

router.post('/groups', (req, res, next) => {
    return new GroupService().batchCreateGroups(req.body, req.context).then((id) => {
        return res.json(id)
    }).catch((err) => {
        return next(err)
    })
})

router.put('/groups', (req, res, next) => {
    return new GroupService().batchUpdateGroups(req.body, req.context).then((value) => {
        return res.json(value)
    }).catch((err) => {
        return next(err)
    })
})

router.get('/experiments/:id/groups', (req, res, next)=> {
    return new GroupService().getGroupsByExperimentId(req.params.id).then((factors)=> {
        return res.json(factors)
    }).catch((err)=> {
        return next(err)
    })
})

router.get('/groups/:id', (req, res, next) => {
    return new GroupService().getGroupById(req.params.id).then((factors) => {
        return res.json(factors)
    }).catch((err) => {
        return next(err)
    })
})


router.delete('/groups/:id', (req, res, next) => {
    return new GroupService().deleteGroup(req.params.id).then((value) => {
        return res.json(value)
    }).catch((err) => {
        return next(err)
    })
})

router.get('/randomizationStrategy/:id', (req, res, next) => {
    return new RandomizationStrategyService().getRandomizationStrategyById(req.params.id).then((strategy) => {
        return res.json(strategy)
    }).catch((err) => {
        return next(err)
    })
})

router.get('/randomizationStrategy', (req, res, next) => {
    return new RandomizationStrategyService().getAllRandomizationStrategies().then((strategies) => {
        return res.json(strategies)
    }).catch((err) => {
        return next(err)
    })
})

module.exports = router
