'use strict'

const db = require('../db/DbManager')
const log4js = require('log4js')
// const logger = log4js.getLogger('ExperimentsService')
// const _ = require('underscore')

class ExperimentsService{
    createExperiment(experiment){
        return new Promise((resolve, reject) => {
            return db.experiments.repository().tx('tx1', (t) => {
                return resolve(db.experiments.create(t,experiment))
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
        this.getExperimentsById(id).then((success) => {
            return new Promise((resolve, reject) => {
                return db.experiments.repository.tx('tx1', (t) => {
                    return db.experiments.update(t, id, experiment).then((data) => {
                        return resolve(data)
                    }).catch((err) => {
                        return reject(err)
                    })
                })
            })
        }).catch((error) => {
            throw {validationMessages: ['No Experiment Found To Update For ID: ' + id]}
        })
    }

    deleteExperiment(id){
        return new Promise((resolve, reject) => {
            return db.experiments.repository().tx('tx1', (t) => {
                const data = db.experiments.delete(t, id)
                return resolve(id)
            })
        })
    }
}

module.exports = ExperimentsService
