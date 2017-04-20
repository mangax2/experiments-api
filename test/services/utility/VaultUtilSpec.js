const sinon = require('sinon')
const HttpUtil = require('../../../src/services/utility/HttpUtil')
const chai = require('chai')
const VaultUtil = require('../../../src/services/utility/VaultUtil')
let httpUtilPostStub
let httpUtilGetStub

const vaultConfig = {
  baseUrl: 'https://my.vault.services',
  authUri: '/v1/auth/approle/login',
  secretUri: '/v1/secret/cosmos/experiments-api',
  roleId: 'role_id',
  secretId: 'secret_id',

}
describe('configureDbCredentials', () => {
  before(() => {
    httpUtilPostStub = sinon.stub(HttpUtil, 'post')
    httpUtilGetStub = sinon.stub(HttpUtil, 'get')
  })

  afterEach(() => {
    httpUtilPostStub.reset()
    httpUtilGetStub.reset()
  })

  after(() => {
    httpUtilPostStub.restore()
    httpUtilGetStub.restore()
  })

  it('VaultUtil init', () => {
    const VaultUtilObj = new VaultUtil()
    VaultUtilObj.dbAppUser.should.equal('')
    VaultUtilObj.dbAppPassword.should.equal('')

  })

  it('configureDbCredentials returns resolved promise when env is local', () => {
    return VaultUtil.configureDbCredentials('local', {}).then((p) => {
      //resolved promise
    })

  })

  it.skip('configureDbCredentials when env is non prod', () => {
    const postResponse = { 'body': { 'auth': { 'client_token': 'token' } } }
    const getResponse1 = { 'body': { 'data': { 'appUser': 'user1', 'appUserPassword': 'pass1' } } }
    const getResponse2 = { 'body': { 'data': { 'appUser': 'user1', 'appUserPassword': 'pass1' } } }
    httpUtilPostStub.resolves(postResponse)
    httpUtilGetStub.onCall(0).resolves(getResponse1)
    httpUtilGetStub.onCall(1).resolves(getResponse2)

    const body = {}
    body.role_id = 'role_id'
    body.secret_id = 'secret_id'
    return VaultUtil.configureDbCredentials('nonprod', vaultConfig).then((p) => {
      sinon.assert.calledWithExactly(httpUtilPostStub, 'https://my.vault.services/v1/auth/approle/login', [{
        headerName: 'Accept',
        headerValue: 'application/json',
      }], JSON.stringify(body))

      httpUtilGetStub.calledTwice.should.equal(true)
      VaultUtil.dbAppUser.should.equal('user1')
      VaultUtil.dbAppPassword.should.equal('pass1')
    })

  })

  it.skip('configureDbCredentials when env is prod', () => {
    const postResponse = { 'body': { 'auth': { 'client_token': 'token' } } }
    const getResponse = { 'body': { 'data': { 'appUser': 'user2', 'appUserPassword': 'pass2' } } }
    httpUtilPostStub.resolves(postResponse)
    httpUtilGetStub.resolves(getResponse)

    const body = {}
    body.role_id = 'role_id'
    body.secret_id = 'secret_id'
    return VaultUtil.configureDbCredentials('prod', vaultConfig).then((p) => {
      sinon.assert.calledWithExactly(httpUtilPostStub, 'https://my.vault.services/v1/auth/approle/login', [{
        headerName: 'Accept',
        headerValue: 'application/json',
      }], JSON.stringify(body))

      httpUtilGetStub.calledTwice.should.equal(true)
    })

  })

  it('Throw error when post failed', () => {
    const testError = {}

    const postResponse = { 'body': { 'auth': { 'client_token': 'token' } } }
    const getResponse = { 'body': { 'data': { 'appUser': 'user1', 'appUserPassword': 'pass1' } } }
    httpUtilPostStub.rejects(testError)
    const body = {}
    body.role_id = 'role_id'
    body.secret_id = 'secret_id'
    return VaultUtil.configureDbCredentials('prod', vaultConfig).should.be.rejected.then((err) => {
      sinon.assert.calledWithExactly(httpUtilPostStub, 'https://my.vault.services/v1/auth/approle/login', [{
        headerName: 'Accept',
        headerValue: 'application/json',
      }], JSON.stringify(body))
      err.should.equal(testError)

    })

  })

  it('Throw error when get failed', () => {
    const testError = {}
    const postResponse = { 'body': { 'auth': { 'client_token': 'token' } } }
    httpUtilPostStub.resolves(postResponse)
    httpUtilGetStub.onCall(0).rejects(testError)
    httpUtilGetStub.onCall(1).rejects(testError)
    const body = {}
    body.role_id = 'role_id'
    body.secret_id = 'secret_id'

    return VaultUtil.configureDbCredentials('prod', vaultConfig).should.be.rejected.then((err) => {
      sinon.assert.calledWithExactly(httpUtilPostStub, 'https://my.vault.services/v1/auth/approle/login', [{
        headerName: 'Accept',
        headerValue: 'application/json',
      }], JSON.stringify(body))
      err.should.equal(testError)
    })

  })

})

