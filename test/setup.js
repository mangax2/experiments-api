const chai = require('chai')
global.should = chai.should()
// chai appears to be broken when trying to compare thrown exceptions
global.should.throw = (thefunction, functionargs, expectedException) => {
    try{
        return thefunction.apply(functionargs)
    }catch(error){
        return error.should.eql(expectedException)
    }
}

chai.use(require('chai-as-promised'))
chai.use(require('sinon-chai'))
const sinon = require('sinon')
require('sinon-as-promised')
process.env.NODE_ENV = 'UNITTEST'

