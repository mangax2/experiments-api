const express = require('express')
const log4js = require('log4js')
const swaggerDoc = require('../swagger/swagger.json')
const ExperimentsService = require('../services/ExperimentsService')
const ExperimentModelService = require('../services/ExperimentModelService')
const ExperimentDesignService = require('../services/ExperimentDesignService')
const FactorTypeService = require('../services/factorTypeService')

const logger = log4js.getLogger('Router')
const router = express.Router()
const _ = require('lodash')

const handleCatch = (res, err) => {
    try{
        if (err) {
            if (_.isArray(err)) {
                const errorArray = _.map(err, function (x) {
                    return (x.output.payload)
                })
                return res.status(400).json(errorArray)
            } else {
                return res.status(err.output.statusCode).json(err.output.payload)
            }
        }
        else {
            return res.status(500).json(err)
        }
    } catch(e) {

        return res.status(500).json(err)
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
    return new ExperimentDesignService().createExperimentDesign(design, 'kmccl').then((id) => {
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
    return new ExperimentDesignService().updateExperimentDesign(id, req.body, 'kmccl').then((design) => {
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
    new ExperimentsService().getAllExperiments().then((experiments)=> {
            return res.json(experiments)
        }
    ).catch((err) => {
        return handleCatch(res, err)
    })
})

router.get('/experiments/:id', (req, res) => {
    new ExperimentsService().getExperimentById(req.params.id).then((experiment)=> {
        return res.json(experiment)
    }).catch((err) => {
        return handleCatch(res, err)
    })
})

router.post('/experiments', (req, res) => {2
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

router.get('/factor-types', (req, res) => {
    return new FactorTypeService().getAllFactorTypes().then((r) => {
        return res.json(r)
    }).catch((err) => {
        return handleCatch(res, err)
    })
})

router.get('/factor-types/:id', (req, res) => {
    const id = req.params.id
    return new FactorTypeService().getFactorTypeById(id).then((r) => {
        return res.json(r)
    }).catch((err) => {
        return handleCatch(res, err)
    })
})

router.post('/factor-types', (req, res) => {
    const factorType = req.body
    return new FactorTypeService().createFactorType(factorType, 'pnwatt').then((id) => {
        return res.json(id)
    }).catch((err) => {
        return handleCatch(res, err)
    })
})

router.put('/factor-types/:id', (req, res) => {
    const id = req.params.id
    const factorType = req.body
    return new FactorTypeService().updateFactorType(id, factorType, 'pnwatt').then((r) => {
        return res.json(r)
    }).catch((err) => {
        return handleCatch(res, err)
    })
})

router.delete('/factor-types/:id', (req, res) => {
    const id = req.params.id
    return new FactorTypeService().deleteFactorType(id).then((r) => {
        return res.json(r)
    }).catch((err) => {
        return handleCatch(res, err)
    })
})

module.exports = router
