const chai = require('chai')
const log4js = require('log4js')
const sinon = require('sinon')

global.should = chai.should()
// chai appears to be broken when trying to compare thrown exceptions
global.should.throw = (thefunction, functionargs, expectedException) => {
  try {
    return thefunction.apply(functionargs)
  } catch (error) {
    return error.should.eql(expectedException)
  }
}

const logStub = sinon.stub(log4js, 'getLogger')
logStub.returns(
  {
    debug: function () {return},
    info: function () { return},
    fatal: function () { return },
    error: function () { return },
    warn: function () { return},
  },
)

chai.use(require('chai-as-promised'))
chai.use(require('sinon-chai'))
require('sinon-as-promised')
process.env.NODE_ENV = 'UNITTEST'

