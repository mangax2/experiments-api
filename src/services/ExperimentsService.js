'use strict'

const db = require('../db/DbManager')
const AppUtil = require('./utility/AppUtil')
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
        return new Promise((resolve, reject) => {
            const data = db.experiments.all()
            return resolve(data)
        })
    }

    getExperimentById(id){
        return new Promise((resolve, reject) => {
            return db.experiments.find(id).then((data) => {
                if(!data){
                    throw {validationMessages: ['Experiment Not Found for requested experimentId']}
                }
                else{
                    return resolve(data)
                }
            }).catch((err) => {
                return reject(err)
            })
        })
    }

    updateExperiment(id, experiment){
        return this.getExperimentById(id).then((success) => {
            return new Promise((resolve, reject) => {
                return db.experiments.repository().tx('tx1', (t) => {
                    return db.experiments.update(t, id, experiment).then((data) => {
                        return resolve(data)
                    }).catch((err) => {
                        return reject(err)
                    })
                })
            })
        }).catch((err) => {
            throw {validationMessages: ['No Experiment Found To Update For ID: ' + id]}
        })
    }

    deleteExperiment(id){
        return new Promise((resolve, reject) => {
            return db.experiments.repository().tx('tx1', (t) => {
                db.experiments.delete(t, id)
                return resolve(id)
            })
        })
    }
}

module.exports = ExperimentsService
