import express from 'express'
import log4js from 'log4js'
import ExperimentsService from '../services/ExperimentsService'
import ExperimentDesignService from '../services/ExperimentDesignService'
import FactorLevelService from '../services/FactorLevelService'
import FactorService from '../services/factorService'
import FactorTypeService from '../services/factorTypeService'
import HypothesisService from '../services/HypothesisService'
import DependentVariableService from '../services/DependentVariableService'


const logger = log4js.getLogger('Router')
const router = express.Router()

router.get('/ping', (req, res) => {
    logger.debug('the user for /ping url is ' + req.userProfile.id)
    return res.json({message: 'Received Ping request: Experiments API !!!'})
})

router.get('/experiment-designs', (req, res, next) => {
    return new ExperimentDesignService().getAllExperimentDesigns().then((r) => {
        return res.json(r)
    }).catch((err) => {
        return next(err)
    })
})
router.post('/experiment-designs', (req, res, next) => {
    const design = req.body
    return new ExperimentDesignService().createExperimentDesign(design, 'kmccl').then((id) => {
        return res.json(id)
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
router.put('/experiment-designs/:id', (req, res, next) => {
    const id = req.params.id
    return new ExperimentDesignService().updateExperimentDesign(id, req.body, 'kmccl').then((design) => {
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

router.get('/experiments', (req, res, next) => {
    new ExperimentsService().getAllExperiments().then((experiments)=> {
        return res.json(experiments)
    }).catch((err) => {
        return next(err)
    })
})

router.post('/experiments', (req, res, next) => {
    const experiment = req.body
    return new ExperimentsService().createExperiment(experiment).then((id) => {
        return res.json(id)
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
router.put('/experiments/:id', (req, res, next) => {
    const experiment = req.body
    const id = req.params.id

    return new ExperimentsService().updateExperiment(id, experiment).then((value) => {
        return res.json(value)
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

router.get('/factor-types', (req, res, next) => {
    return new FactorTypeService().getAllFactorTypes().then((r) => {
        return res.json(r)
    }).catch((err) => {
        return next(err)
    })
})
router.post('/factor-types', (req, res, next) => {
    const factorType = req.body
    return new FactorTypeService().createFactorType(factorType, 'pnwatt').then((id) => {
        return res.json(id)
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
router.put('/factor-types/:id', (req, res, next) => {
    const id = req.params.id
    const factorType = req.body
    return new FactorTypeService().updateFactorType(id, factorType, 'pnwatt').then((r) => {
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

router.get('/hypotheses', (req, res, next)=> {
    return new HypothesisService().getAllHypothesis().then((hypotheses)=> {
        return res.json(hypotheses)
    }).catch((err)=> {
        return next(err)
    })
})
router.post('/hypotheses', (req, res, next) => {
    const hypotheses = req.body
    return new HypothesisService().createHypothesis(hypotheses).then((id) => {
        return res.json(id)
    }).catch((err) => {
        return next(err)
    })
})

router.get('/experiments/:id/hypotheses', (req, res, next)=> {
    const id = req.params.id
    return new HypothesisService().getHypothesesByExperimentId(id).then((hypotheses)=> {
        return res.json(hypotheses)
    }).catch((err)=> {
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

router.get('/hypotheses/:id', (req, res, next)=> {
    const id = req.params.id
    return new HypothesisService().getHypothesisById(id).then((hypothesis)=> {
        return res.json(hypothesis)
    }).catch((err)=> {
        return next(err)
    })
})
router.put('/hypotheses/:id', (req, res, next) => {
    const hypothesis = req.body
    const id= req.params.id
    return new HypothesisService().updateHypothesis(id,hypothesis).then((id) => {
        return res.json(id)
    }).catch((err) => {
        return next(err)
    })
})
router.delete('/hypotheses/:id', (req, res, next)=> {
    const id = req.params.id
    return new HypothesisService().deleteHypothesis(id).then((hypothesis)=> {
        return res.json(hypothesis)
    }).catch((err)=> {
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

router.post('/dependent-variables', (req, res, next) => {
    const dependentVariables = req.body
    return new DependentVariableService().batchCreateDependentVariables(dependentVariables).then((id) => {
        return res.json(id)
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

router.put('/dependent-variables', (req, res, next) => {
    const dependentVariables = req.body
    return new DependentVariableService().batchUpdateDependentVariables(dependentVariables).then((value) => {
        return res.json(value)
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

router.get('/factors', (req, res, next) => {
    return new FactorService().getAllFactors().then((factors) => {
        return res.json(factors)
    }).catch((err) => {
        return next(err)
    })
})

router.post('/factors', (req, res, next) => {
    return new FactorService().batchCreateFactors(req.body).then((id) => {
        return res.json(id)
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

router.put('/factors', (req, res, next) => {
    return new FactorService().batchUpdateFactors(req.body).then((value) => {
        return res.json(value)
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

router.get('/factor-levels', (req, res, next) => {
    return new FactorLevelService().getAllFactorLevels().then((factorLevels) => {
        return res.json(factorLevels)
    }).catch((err) => {
        return next(err)
    })
})

router.post('/factor-levels', (req, res, next) => {
    return new FactorLevelService().batchCreateFactorLevels(req.body).then((id) => {
        return res.json(id)
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

router.put('/factor-levels', (req, res, next) => {
    return new FactorLevelService().batchUpdateFactorLevels(req.body).then((value) => {
        return res.json(value)
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


module.exports = router
