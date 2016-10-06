'use strict'

const validator = require('validator');

class BaseValidator {
      constructor(){
          this.messages =[]
      }

    schemaCheck(value, schema){
        if(schema.required){
            this.checkRequired(value, schema.paramName)
        }

        if(value!=undefined && value!=null) {
            if(schema.type=='numeric'){
                this.checkNumeric(value, schema.paramName)
                this.checkNumericRange(value,schema.numericRange,schema.paramName)

            }else if(schema.type=='text'){
                this.checkLength(value, schema.lengthRange, schema.paramName)
            } else if(schema.type=='constant'){
                this.checkConstants(value, schema.data,  schema.paramName)


            }

        }

    }

    checkLength(value, lengthRange, name){

           if (!validator.isLength(value, lengthRange.min, lengthRange.max)) {
               this.messages.push(name + " length is out of range(min=" + lengthRange.min + " max=" + lengthRange.max + ")")
           }


    }

    checkRequired(value, name){
        if(value==undefined || value==null || validator.isEmpty(value.toString())){
            this.messages.push(name+ " is required")

        }
    }

    checkNumeric(value, name){

        if(!validator.isNumeric(value.toString())){
            this.messages.push(name+ " must be numeric")

        }
    }

    checkNumericRange(value, numericRange, name){

        if (value<numericRange.min || value >numericRange.max) {
            this.messages.push(name + " value is out of numeric range(min=" + lengthRange.min + " max=" + lengthRange.max + ")")
        }


    }


    checkConstants(value, data, name){
        console.log('inside checkConstants'+data.indexOf(value))
        if(data.indexOf(value)==-1){
            this.messages.push(name+ " requires a valid value")

        }
    }

    check(){
        if (this.messages.length > 0 ){
            throw {validationMessages: this.messages}
        }
    }

}

module.exports = BaseValidator
