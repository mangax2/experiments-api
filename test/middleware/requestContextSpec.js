const sinon = require('sinon')
const chai = require('chai')
const AppError = require('../../src/services/utility/AppError')
const target = require('../../src/middleware/requestContext')

describe('requestContextMiddlewareFunction', () => {
    let testError = {}
    let badRequestStub
    let nextStub

    before(() => {
        badRequestStub = sinon.stub(AppError, 'badRequest', () => {
            return testError
        })
        nextStub = sinon.stub()
    })

    beforeEach(() => {
        badRequestStub.reset()
        nextStub.reset()
    })

    after(() => {
        badRequestStub.restore()
    })

    it('throws error when header is null.', () => {
        (() => {
            target({}, null, nextStub)
        }).should.throw(testError)
        sinon.assert.calledWithExactly(badRequestStub, 'oauth_resourceownerinfo headers is null.')
        sinon.assert.notCalled(nextStub)
    })

    it('throws error when header not found in empty object.', () => {
        (() => {
            target({headers: {}}, null, nextStub)
        }).should.throw(testError)
        sinon.assert.calledWithExactly(badRequestStub, 'oauth_resourceownerinfo header not found.')
        sinon.assert.notCalled(nextStub)
    })

    it('throws error when header not found among multiple headers.', () => {
        (() => {
            target({headers: {header1: 'blah', 'header2': 'blah2'}}, null, nextStub)
        }).should.throw(testError)
        sinon.assert.calledWithExactly(badRequestStub, 'oauth_resourceownerinfo header not found.')
        sinon.assert.notCalled(nextStub)
    })

    it('throws error when user_id key value not found.', () => {
        (() => {
            target({headers: {oauth_resourceownerinfo: "notUserId=blah"}}, null, nextStub)
        }).should.throw(testError)
        sinon.assert.calledWithExactly(badRequestStub, 'user_id not found within oauth_resourceownerinfo.')
        sinon.assert.notCalled(nextStub)
    })

    it('throws error when user_id does not represent a key value pair.', () => {
        (() => {
            target({headers: {oauth_resourceownerinfo: "user_id"}}, null, nextStub)
        }).should.throw(testError)
        sinon.assert.calledWithExactly(badRequestStub, 'user_id within oauth_resourceownerinfo does not represent key=value pair.')
        sinon.assert.notCalled(nextStub)
    })

    it('throws error when user_id value is empty.', () => {
        (() => {
            target({headers: {oauth_resourceownerinfo: "user_id="}}, null, nextStub)
        }).should.throw(testError)
        sinon.assert.calledWithExactly(badRequestStub, 'user_id within oauth_resourceownerinfo is empty string.')
        sinon.assert.notCalled(nextStub)
    })

    it('throws error when user_id value is space.', () => {
        (() => {
            target({headers: {oauth_resourceownerinfo: "user_id= "}}, null, nextStub)
        }).should.throw(testError)
        sinon.assert.calledWithExactly(badRequestStub, 'user_id within oauth_resourceownerinfo is empty string.')
        sinon.assert.notCalled(nextStub)
    })

    it('creates context when user id is only valid key value pair in header.', () => {
        const req = {headers: {oauth_resourceownerinfo: "user_id=testUser"}}
        target(req, null, nextStub)
        req.context.userId.should.equal('testUser')
        sinon.assert.calledOnce(nextStub)
        sinon.assert.notCalled(badRequestStub)
    })

    it('creates context when user id is one of many valid key value pair in header.', () => {
        const req = {headers: {oauth_resourceownerinfo: "notMe=wrongValue,user_id=testUser,another=value"}}
        target(req, null, nextStub)
        req.context.userId.should.equal('testUser')
        sinon.assert.calledOnce(nextStub)
        sinon.assert.notCalled(badRequestStub)
    })
})