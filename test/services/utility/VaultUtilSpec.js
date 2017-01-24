/**
 * Created by kprat1 on 11/10/16.
 */
const sinon = require('sinon')
const HttpUtil = require('../../../src/services/utility/HttpUtil')
const chai = require('chai')
const VaultUtil = require('../../../src/services/utility/VaultUtil')
let httpUtilPostStub
let httpUtilGetStub

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


    it ('VaultUtil init', () => {
        const VaultUtilObj=new VaultUtil()
        VaultUtilObj.dbAppUser.should.equal('')
        VaultUtilObj.dbAppPassword.should.equal('')

    })

    it ('configureDbCredentials returns resolved promise when env is local', () => {
       return VaultUtil.configureDbCredentials('local' ,'role_id', 'secret_id').then((p)=>{
           //resolved promise

       })

    })


    it ('configureDbCredentials when env is non prod', () => {
        const postResponse={"body":{"auth":{"client_token":"token"}}}
        const getResponse={"body":{"data":{"appUser":"user1", "appUserPassword":"pass1"}}}
        httpUtilPostStub.resolves(postResponse)
        httpUtilGetStub.resolves(getResponse)

        const body = {}
        body.role_id='role_id'
        body.secret_id='secret_id'
        return VaultUtil.configureDbCredentials('nonprod' ,'role_id', 'secret_id').then((p)=>{
            sinon.assert.calledWithExactly(httpUtilPostStub,'https://vault.agro.services/v1/auth/approle/login',[{headerName:'Accept', headerValue:'application/json'}],JSON.stringify(body))

            sinon.assert.calledWithExactly(httpUtilGetStub,'https://vault.agro.services/v1/secret/cosmos/experiments-api/np/db',[{headerName:'X-Vault-Token', headerValue:'token'}])
            VaultUtil.dbAppUser.should.equal('user1')
            VaultUtil.dbAppPassword.should.equal('pass1')


        })

    })



    it ('configureDbCredentials when env is prod', () => {
        const postResponse={"body":{"auth":{"client_token":"token"}}}
        const getResponse={"body":{"data":{"appUser":"user1", "appUserPassword":"pass1"}}}
        httpUtilPostStub.resolves(postResponse)
        httpUtilGetStub.resolves(getResponse)

        const body = {}
        body.role_id='role_id'
        body.secret_id='secret_id'
        return VaultUtil.configureDbCredentials('prod' ,'role_id', 'secret_id').then((p)=>{
            sinon.assert.calledWithExactly(httpUtilPostStub,'https://vault.agro.services/v1/auth/approle/login',[{headerName:'Accept', headerValue:'application/json'}],JSON.stringify(body))

            sinon.assert.calledWithExactly(httpUtilGetStub,'https://vault.agro.services/v1/secret/cosmos/experiments-api/prod/db',[{headerName:'X-Vault-Token', headerValue:'token'}])

        })

    })


    it ('Throw error when post failed', () => {
        const testError = {}

        const postResponse={"body":{"auth":{"client_token":"token"}}}
        const getResponse={"body":{"data":{"appUser":"user1", "appUserPassword":"pass1"}}}
        httpUtilPostStub.rejects(testError)
        const body = {}
        body.role_id='role_id'
        body.secret_id='secret_id'
        return VaultUtil.configureDbCredentials('prod' ,'role_id', 'secret_id').should.be.rejected.then((err)=>{
            sinon.assert.calledWithExactly(httpUtilPostStub,'https://vault.agro.services/v1/auth/approle/login',[{headerName:'Accept', headerValue:'application/json'}],JSON.stringify(body))
            err.should.equal(testError)

        })

    })

    it ('Throw error when get failed', () => {
        const testError = {}

        const postResponse={"body":{"auth":{"client_token":"token"}}}
        httpUtilPostStub.resolves(postResponse)
        httpUtilGetStub.rejects(testError)
        const body = {}
        body.role_id='role_id'
        body.secret_id='secret_id'
        return VaultUtil.configureDbCredentials('prod' ,'role_id', 'secret_id').should.be.rejected.then((err)=>{
            sinon.assert.calledWithExactly(httpUtilPostStub,'https://vault.agro.services/v1/auth/approle/login',[{headerName:'Accept', headerValue:'application/json'}],JSON.stringify(body))
            sinon.assert.calledWithExactly(httpUtilGetStub,'https://vault.agro.services/v1/secret/cosmos/experiments-api/prod/db',[{headerName:'X-Vault-Token', headerValue:'token'}])
            err.should.equal(testError)

        })

    })




})

