import express from 'express'
import log4js from 'log4js'
import swaggerDoc from '../swagger/swagger.json'
import ExperimentsService from '../services/ExperimentsService'
import ExperimentModelService from '../services/ExperimentModelService'
import ExperimentDesignService from '../services/ExperimentDesignService'

const logger = log4js.getLogger('Router')
const router = express.Router()

const handleCatch = (res, err) => {
    if(err.validationMessages){
        return res.status(400).json(err)
    }
    else{
        logger.error(err)
        return res.status(500).json({message: err})
    }
}

router.get('/ping', (req, res) => {
    logger.debug('the user for /ping url is ' + req.userProfile.id)
    return res.json({message: 'Received Ping request: Experiments API !!!'})
})

router.get('/api-docs', (req, res) => {
    return res.json(swaggerDoc)
})

router.get('/experiment-designs', (req, res) => {
    return new ExperimentDesignService().getAllExperimentDesigns().then((r) => {
        return res.json(r)
    }).catch((err) => {
        return handleCatch(res, err)
    })
})
router.post('/experiment-designs', (req, res) => {
    const design = req.body
    return new ExperimentDesignService().createExperimentDesign(design).then((id) => {
        return res.json(id)
    }).catch((err) => {
        return handleCatch(res, err)
    })
})

router.get('/experiment-designs/:id', (req, res) => {
    const id = req.params.id
    return new ExperimentDesignService().getExperimentDesignById(id).then((design) => {
        return res.json(design)
    }).catch((err) => {
        return handleCatch(res, err)
    })
})
router.put('/experiment-designs/:id', (req, res) => {
    const id = req.params.id
    return new ExperimentDesignService().updateExperimentDesign(id, req.body).then((design) => {
        return res.json(design)
    }).catch((err) => {
        return handleCatch(res, err)
    })
})
router.delete('/experiment-designs/:id', (req, res) => {
    const id = req.params.id
    return new ExperimentDesignService().deleteExperimentDesign(id).then((id) => {
        return res.json(id)
    }).catch((err) => {
        return handleCatch(res, err)
    })
})

router.get('/experiments', (req, res) => {
    return new ExperimentsService().getAllExperiments().then((r) => {
        return res.json(r)
    }).catch((err) => {
        return handleCatch(res, err)
    })
})

router.get('/experiments/:id', (req, res) => {
    const id = req.params.id
    return new ExperimentsService().getExperimentById(id).then((experiment) => {
        return res.json(experiment)
    }).catch((err) => {
        return handleCatch(res, err)
    })
})

router.post('/experiments', (req, res) => {
    const experiment = req.body
    return new ExperimentsService().createExperiment(experiment).then((id) => {
        return res.json(id)
    }).catch((err) => {
        return handleCatch(res, err)
    })
})

router.put('/experiments/:id', (req, res) => {
    const experiment = req.body
    const id = req.params.id

    return new ExperimentsService().updateExperiment(id, experiment).then((value) => {
        return res.json(value)
    }).catch((err) => {
        return handleCatch(res, err)
    })
})

router.delete('/experiments/:id', (req, res) => {
    const id = req.params.id

    return new ExperimentsService().deleteExperiment(id).then((value) => {
        return res.json(value)
    }).catch((err) => {
        return handleCatch(res, err)
    })
})

router.get('/experimentModel', (req, res) => {
    return new ExperimentModelService().getAllModels().then((r) => {
        return res.json(r)
    }).catch((err) => {
        return handleCatch(res, err)
    })
})

router.get('/experimentModel/:id', (req, res) => {
    const id = req.params.id
    new ExperimentModelService().getExperimentModelById(id).then((experimentModel) => {
        return res.json(experimentModel)
    }).catch((err) => {
        return handleCatch(res, err)
    })
})

router.post('/experimentModel', (req, res) => {
    const experimentModel = req.body

    return new ExperimentModelService().createExperimentModel(experimentModel).then((id) => {
        return res.json(id)
    }).catch((err) => {
        return handleCatch(res, err)
    })
})

router.put('/experimentModel/:id', (req, res) => {
    const experimentModel = req.body
    const id = req.params.id

    return new ExperimentModelService().updateExperimentModel(id, experimentModel).then((value) => {
        return res.json(value)
    }).catch((err) => {
        return handleCatch(res, err)
    })
})

router.delete('/experimentModel/:id', (req, res) => {
    const id = req.params.id

    return new ExperimentModelService().deleteExperimentModel(id).then((value) => {
        return res.json(value)
    }).catch((err) => {
        return handleCatch(res, err)
    })
})

module.exports = router
