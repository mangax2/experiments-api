const db = require('../db/DbManager')

class ExperimentsService{
    createExperimentDesign(experimentDesign){
        return db.experimentDesign.repository().tx('createExperimentDesignTransaction', (t) => {
            return db.experimentDesign.create(t,experimentDesign, 'kmccl')
        })
    }

    getAllExperimentDesigns(){
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
        return db.experimentDesign.repository().tx('updateExperimentDesignTransaction', (t) => {
            return db.experimentDesign.update(t, id, experimentDesign, 'kmccl').then((data) => {
                if(!data){
                    throw {validationMessages: ['Experiment Design Not Found']}
                }else{
                    return data
                }
            })
        })
    }

    deleteExperimentDesign(id){
        return db.experimentDesign.repository().tx('deleteExperimentDesignTransaction', (t) => {
            return db.experimentDesign.delete(t, id).then((data) => {
                if(!data){
                    throw {validationMessages: ['Experiment Design Not Found']}
                }else{
                    return data
                }
            })
        })
    }
}

module.exports = ExperimentsService
