const express = require('express')
const log4js = require('log4js')
const swaggerDoc = require('../swagger/swagger.json')
const ExperimentsService = require('../services/ExperimentsService')
const ExperimentModelService = require('../services/ExperimentModelService')

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
