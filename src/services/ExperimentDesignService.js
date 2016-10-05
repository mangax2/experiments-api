'use strict'

const db = require('../db/DbManager')

class ExperimentsService{
    createExperimentDesign(experimentDesign){
        return db.experimentDesign.repository().tx('tx1', (t) => {
            return db.experimentDesign.create(t,experimentDesign, 'kmccl')
        })
    }

    getAllExperimentDesigns() {
        return db.experimentDesign.all()
    }

    getExperimentDesignById(id){
        return db.experimentDesign.find(id).then((data) => {
            if(!data){
                throw {validationMessages: ['Experiment Design Not Found']}
            }
            else{
                return data
            }
        })
    }

    updateExperimentDesign(id, experimentDesign){
        return this.getExperimentDesignById(id).then(() => {
            return db.experimentDesign.repository().tx('tx1', (t) => {
                return db.experimentDesign.update(t, id, experimentDesign, 'kmccl')
            })
        })
    }

    deleteExperimentDesign(id){
        return this.getExperimentDesignById(id).then(() => {
            return db.experimentDesign.repository().tx('tx1', (t) => {
                return db.experimentDesign.delete(t, id)
            })
        })
    }
}

module.exports = ExperimentsService
