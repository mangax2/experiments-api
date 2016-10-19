import db from '../db/DbManager'

class ExperimentModelService {
    getAllModels(){
        return new Promise((resolve, reject) => {
            const data = db.experimentModel.all()
            return resolve(data)
        })
    }

    getExperimentModelById(id){
        return new Promise((resolve, reject) => {
            return db.experimentModel.find(id).then((data) => {
                if(!data){
                    throw {validationMessages: ['ExperimentModel Not Found for requested experimentModelId']}
                }
                else{
                    return resolve(data)
                }
            }).catch((err) => {
                return reject(err)
            })
        })
    }

    createExperimentModel(experimentModel){
        return new Promise((resolve, reject) => {
            return db.experimentModel.repository().tx('txModelCreate', (t) => {
                return resolve(db.experimentModel.create(t, experimentModel))
            })
        })
    }

    updateExperimentModel(id, experimentModel){
        return this.getExperimentModelById(id).then((success) => {
            return new Promise((resolve, reject) => {
                return db.experimentModel.repository().tx('txModelUpdate', (t) => {
                    return db.experimentModel.update(t, id, experimentModel).then((data) => {
                        return resolve(data)
                    }).catch((err) => {
                        return reject(err)
                    })
                })
            })
        }).catch(() => {
            throw {validationMessages: ['No experimentModel Found To Update For ID: ' + id]}
        })
    }

    deleteExperimentModel(id){
        return new Promise((resolve, reject) => {
            return db.experimentModel.repository().tx('txModelDelete', (t) => {
                db.experimentModel.delete(t, id)
                return resolve(id)
            })
        })
    }
}

module.exports = ExperimentModelService
