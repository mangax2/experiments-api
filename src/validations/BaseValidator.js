'use strict'

const validator = require('validator');

class BaseValidator {
      constructor(){
          this.messages =[]
      }

    maxLength(value,length, name){
        if(!validator.isLength(value,0,length)){
            this.messages.push(name+ " max length is "+length)
        }

    }

    required(value, name){
        if(value==undefined || value==null || validator.isEmpty(value)){
            this.messages.push(name+ " is required")

        }
    }

    check(){
        if (this.messages.length > 0 ){
            throw {validationMessages: this.messages}
        }
    }

}

module.exports = BaseValidator
