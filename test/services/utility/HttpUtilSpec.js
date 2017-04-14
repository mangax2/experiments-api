const sinon = require('sinon')
const request = require('superagent')
const chai = require('chai')
const target = require('../../../src/services/utility/HttpUtil')
const internals = {}
let setHeadersStub
let requestPostStub
let requestGetStub

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

})

