const sinon = require('sinon')
const request = require('superagent')
const chai = require('chai')
const target = require('../../../src/services/utility/HttpUtil')
const internals = {}
let setHeadersStub
let requestPostStub
let requestGetStub
let httpGetTokenStub

describe('HttpUtil', () => {
  before(() => {
    setHeadersStub = sinon.stub(target, 'setHeaders')
    requestPostStub = sinon.stub(request, 'post')
    requestGetStub = sinon.stub(request, 'get')
  })

  afterEach(() => {
    setHeadersStub.reset()
    requestPostStub.reset()
    requestGetStub.reset()
  })

  after(() => {
    setHeadersStub.restore()
    requestPostStub.restore()
    requestGetStub.restore()
  })

  it('getCall', () => {
    const httpCall = {
      set(key, value){
      },
    }
    setHeadersStub.returns(httpCall)
    requestGetStub.returns(httpCall)
    target.get('/abc', [{ headerName: 'h1', headerValue: 'h2' }])
    sinon.assert.calledWith(setHeadersStub, httpCall, [{ headerName: 'h1', headerValue: 'h2' }])

  })

  it('postCall', () => {
    const httpCall = {
      set(key, value){
      }, send(){
      },
    }
    setHeadersStub.returns(httpCall)
    requestPostStub.returns(httpCall)
    target.post('/abc', [{ headerName: 'h1', headerValue: 'h2' }], {})
    sinon.assert.calledWith(setHeadersStub, httpCall, [{ headerName: 'h1', headerValue: 'h2' }])

  })

  it('setHeaders', () => {
    setHeadersStub.restore()

    const httpCall = {
      set(key, value){
      },
    }
    const httpCallSetStub = sinon.stub(httpCall, 'set')
    target.setHeaders(httpCall, [{ headerName: 'h1', headerValue: 'h2' }])
    sinon.assert.calledWith(httpCallSetStub, 'h1', 'h2')

  })

  it('setHeaders with multiple values', () => {
    setHeadersStub.restore()

    const httpCall = {
      set(key, value){
      },
    }
    const httpCallSetStub = sinon.stub(httpCall, 'set')
    target.setHeaders(httpCall, [{ headerName: 'h1', headerValue: 'h2' }, {
      headerName: 'h3',
      headerValue: 'h4',
    }])
    sinon.assert.calledTwice(httpCallSetStub)
    sinon.assert.calledWith(httpCallSetStub.firstCall, 'h1', 'h2')
    sinon.assert.calledWith(httpCallSetStub.secondCall, 'h3', 'h4')

  })

  describe('getErrorMessageForLogs', () => {
    it('returns unauthorized if status is 401', () => {
      const error = {status: 401}

      const result = target.getErrorMessageForLogs(error)

      result.should.equal('Unauthorized')
    })

    it('parses arrays of errors', () => {
      const error = {
        response: {
          text: '[{"errorMessage": "this is a test message"}, {"errorMessage": "second test message"}]'
        }
      }

      const result = target.getErrorMessageForLogs(error)

      result.should.equal('this is a test message,second test message')
    })

    it('parses single errors', () => {
      const error = {
        response: {
          text: '{"errorMessage": "this is a test message"}'
        }
      }

      const result = target.getErrorMessageForLogs(error)

      result.should.equal('this is a test message')
    })

    it('returns a default message if the error does not have a response', () => {
      const error = {}

      const result = target.getErrorMessageForLogs(error)

      result.should.equal('Unable to retrieve error message.')
    })

    it('returns a default message if it cannot parse the error', () => {
      const error = {
        response: {
          text: '{}'
        }
      }

      const result = target.getErrorMessageForLogs(error)

      result.should.equal('Unable to retrieve error message.')
    })

    it('returns a default message otherwise', () => {
      const error = undefined

      const result = target.getErrorMessageForLogs(error)
      
      result.should.equal('Unable to retrieve error message.')
    })
  })
})

