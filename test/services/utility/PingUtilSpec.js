const sinon = require('sinon')
const chai = require('chai')
const target = require('../../../src/services/utility/PingUtil')
const oauthPing = require('@monsantoit/oauth-ping')

let httpGetTokenStub

describe('PingUtil', () =>{
  describe('getMonsantoHeader', () => {
    before(() => {
        httpGetTokenStub = sinon.stub(oauthPing, 'httpGetToken')
    })

    afterEach(() => {
        httpGetTokenStub.reset()
    })

    after(() => {
        httpGetTokenStub.restore()
    })
    
    it('does not catch errors from retrieving a ping token', () => {
      const error = {message: 'test'}
      httpGetTokenStub.rejects(error)

      return target.getMonsantoHeader().should.be.rejected.then((err) => {
        err.should.equal(error)
      })
    })

    it('returns an array with the token', () => {
      httpGetTokenStub.resolves('token')
      
      return target.getMonsantoHeader().then((headers) => {
        headers.length.should.equal(2)
        headers[0].headerName.should.equal('authorization')
        headers[0].headerValue.should.equal('Bearer token')
        headers[1].headerName.should.equal('Content-Type')
        headers[1].headerValue.should.equal('application/json')
      })
    })
  })
})