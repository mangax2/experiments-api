'use strict'

const db = require('../db/DbManager')
// const log4js = require('log4js')
// const logger = log4js.getLogger('ExperimentsService')

class ExperimentsService{

    createExperiment(experiment){

        return db.experiments.repository().tx('tx1', (t) => {
           return Promise.all(experiment.map(ex =>
                 db.experiments.create(t,ex)
            )).then(data => {
                return  AppUtil.createPostResponse(data)
            })
        })
    }

    getAllExperiments() {
        return db.experiments.all()
    }

    getExperimentById(id){
       return db.experiments.find(id).then((data) => {
            if(!data){
                throw {validationMessages: ['Experiment Not Found for requested experimentId']}
            }
            else{
                return data
            }
        })
    }

    updateExperiment(id, experiment){
            return db.experiments.update(id, experiment).then((data) => {
                if(!data){
                    throw {validationMessages: ['Experiment Not Found to Update']}
                }else{
                    return data
                }
            })
    }

    deleteExperiment(id) {
        return db.experiments.remove(id).then((data) => {
            if (!data) {
                throw {validationMessages: ['Experiment Not Found for requested experimentId']}
            }
            else {
                return data
            }
        })
    }
}

module.exports = ExperimentsService
