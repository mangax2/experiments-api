import BaseValidator from './BaseValidator'
import * as _ from 'lodash'
import AppError from '../services/utility/AppError'
import log4js from 'log4js'

const logger = log4js.getLogger('SchemaValidator')

export class SchemaValidator extends BaseValidator {
    schemaCheck(targetObject, schema, optionalTransaction) {
        return Promise.all(
            _.map(schema, (elementSchema) => {
                const key = _.keys(targetObject).find(x=>x == elementSchema.paramName)
                if (key == null || key == undefined) {
                    return this.schemaElementCheck(null, elementSchema, targetObject, optionalTransaction)
                } else {
                    return this.schemaElementCheck(targetObject[key], elementSchema, targetObject, optionalTransaction)
                }
            })
        )
    }

    //FOR PARTIAL UPDATE SUPPORT:
    //
    // schemaCheck(targetObject, schema, optionalTransaction) {
    //     const requiredFields = _.map(_.filter(schema, (schemaElement) => {
    //         return _.keys(schemaElement).indexOf('required') > -1
    //     }), (value) => { return value.paramName})
    //
    //     const missingFields = _.difference(requiredFields, _.keys(targetObject))
    //     if(missingFields.length > 0){
    //         return Promise.reject("Missing Required Fields: " + missingFields.toString())
    //     }
    //
    //     return Promise.all(
    //         _.map(_.keys(targetObject), (param)=>{
    //             const schemaElement = _.find(schema, (schemaEle) => { return schemaEle.paramName == param})
    //
    //             if(schemaElement){
    //                 return this.schemaElementCheck(targetObject[param], schemaElement, targetObject, optionalTransaction)
    //             }
    //             else{
    //                 delete targetObject[param]
    //             }
    //         })
    //     )
    // }

    schemaElementCheck(elementValue, elementSchema, targetObject, optionalTransaction) {
        return new Promise((resolve, reject) => {
            if (elementSchema.required) {
                this.checkRequired(elementValue, elementSchema.paramName)
            }

            if (elementValue != undefined && elementValue != null) {
                if (elementSchema.type == 'numeric') {
                    this.checkNumeric(elementValue, elementSchema.paramName)
                    if (elementSchema.numericRange) {
                        this.checkNumericRange(elementValue, elementSchema.numericRange, elementSchema.paramName)
                    }
                } else if (elementSchema.type == 'text') {
                    this.checkLength(elementValue, elementSchema.lengthRange, elementSchema.paramName)
                } else if (elementSchema.type == 'constant') {
                    this.checkConstants(elementValue, elementSchema.data, elementSchema.paramName)
                }
                else if (elementSchema.type == 'boolean') {
                    this.checkBoolean(elementValue, elementSchema.paramName)
                }
            }
                resolve()

        })
    }

    validateEntity(targetObject, operationName, optionalTransaction) {
        return this.schemaCheck(targetObject, this.getSchema(operationName), optionalTransaction)
    }


    validateBatchForRI(batchPayload, operationName, optionalTransaction) {

        return new Promise((resolve, reject) =>{

            const riSchema= _.filter(this.getSchema(operationName), (schema)=>{
                return schema.type=='refData' || schema.type=='businessKey'
            })
            const riCheckArray=[]
            _.map(riSchema, (schema)=>{
                _.forEach(batchPayload,(p)=>{
                    const riCheckObj={}
                    const key = _.keys(p).find(x=>x == schema.paramName)
                    riCheckObj.entity=schema.entity
                    riCheckObj.updateId=p['id']
                    if(schema.type=='businessKey'){
                        const vals = _.map(schema.keys, (key) => {
                            return p[key]
                        })
                        riCheckObj.keys= vals
                    }else{
                        riCheckObj.id=p[key]
                    }
                    riCheckObj.paramName=schema.paramName
                    riCheckArray.push(riCheckObj)
                })
            })

            if(riCheckArray.length==0){
                resolve()

            }else{
                const riCheckGroupByEntity= _.values(_.groupBy(riCheckArray, 'paramName'))
                return  this.checkRIBatch(riCheckGroupByEntity, optionalTransaction).then(()=>{
                    resolve()
                }, (err)=> {
                    reject(err)
                })
            }

        })


    }

    postValidate(targetObject) {
        if (!this.hasErrors()) {
            // Check the business key
            const uniqArray = _.uniqWith(_.map(targetObject, (obj) => {
                return _.pick(obj, this.getBusinessKeyPropertyNames())
            }), _.isEqual)

            if (uniqArray.length != targetObject.length) {
                return Promise.reject(
                    AppError.badRequest(this.getDuplicateBusinessKeyError())
                )
            }
        }

        return Promise.resolve()
    }

    getSchema(operationName) {
        logger.error('getSchema not implemented')
        throw 'getSchema not implemented'
    }

    getBusinessKeyPropertyNames() {
        logger.error('getBusinessKeyPropertyNames not implemented')
        throw 'getBusinessKeyPropertyNames not implemented'
    }

    getDuplicateBusinessKeyError() {
        logger.error('getDuplicateBusinessKeyError not implemented')
        throw 'getDuplicateBusinessKeyError not implemented'
    }
}

module.exports = SchemaValidator
