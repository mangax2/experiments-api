import db from '../db/DbManager'
import ExperimentDesignsValidator from '../validations/ExperimentDesignsValidator'
import AppError from './utility/AppError'

class ExperimentDesignService{
    constructor(){
        this._validator = new ExperimentDesignsValidator()
    }

    createExperimentDesign(experimentDesign, created_user_id){
        return this._validator.validate([experimentDesign]).then(() => {
            return db.experimentDesign.repository().tx('createExperimentDesignTransaction', (t) => {
                return db.experimentDesign.create(t,experimentDesign, created_user_id)
            })
        })
    }

    getAllExperimentDesigns(){
        return db.experimentDesign.all()
    }

    getExperimentDesignById(id){
        return db.experimentDesign.find(id).then((data) => {
            if(!data){
                throw AppError.notFound('Experiment Design Not Found')
            }
            else{
                return data
            }
        })
    }

    updateExperimentDesign(id, experimentDesign, modified_user_id){
        return this._validator.validate([experimentDesign]).then(() => {
            return db.experimentDesign.update(id, experimentDesign, modified_user_id).then((data) => {
                if(!data){
                    throw AppError.notFound('Experiment Design Not Found')
                }else{
                    return data
                }
            })
        })
    }

    deleteExperimentDesign(id){
        return db.experimentDesign.delete(id).then((data) => {
            if(!data){
                throw AppError.notFound('Experiment Design Not Found')
            }else{
                return data
            }
        })
    }
}

module.exports = ExperimentDesignService
