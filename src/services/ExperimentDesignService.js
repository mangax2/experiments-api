'use strict'

const db = require('../db/DbManager')
const log4js = require('log4js')
const logger = log4js.getLogger('ExperimentsService')

class ExperimentsService{
    createExperimentDesign(experimentDesign){
        return new Promise((resolve, reject) => {
            return db.experimentDesign.repository().tx('tx1', (t) => {
                return resolve(db.experimentDesign.create(t,experimentDesign, "kmccl"))
            })
        })
    }

    getAllExperimentDesigns() {
            return db.experimentDesign.all()
    }

    getExperimentDesignById(id){
        return new Promise((resolve, reject) => {
            return db.experimentDesign.find(id).then((data) => {
                if(!data){
                    throw {validationMessages: ['Experiment Design Not Found']}
                }
                else{
                    return resolve(data)
                }
            }).catch((err) => {
                return reject(err)
            })
        })
    }

    updateExperimentDesign(id, experimentDesign, modified_user_id){
        return new Promise((resolve, reject) => {
            return db.experimentDesign.repository().tx('tx1', (t) => {
                return db.experimentDesign.update(t, id, experimentDesign).then((data) => {
                    return resolve(data)
                }).catch((err) => {
                    return reject(err)
                })
            })
        })
    }

    deleteExperimentDesign(id){
        return new Promise((resolve, reject) => {
            return db.experimentDesign.repository().tx('tx1', (t) => {
                db.experimentDesign.delete(t, id)
                return resolve(id)
            })
        })
    }
}

module.exports = ExperimentsService
