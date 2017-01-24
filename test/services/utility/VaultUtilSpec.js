/**
 * Created by kprat1 on 11/10/16.
 */
const sinon = require('sinon')
const request = require('superagent')
const chai = require('chai')
const VaultUtil = require('../../../src/services/utility/VaultUtil')
const internals = {}

describe('configureDbCredentials', () => {

    const requestPostStub= sinon.stub(request, 'post')

    it ('configureDbCredentials returns resolved promise when env is local', () => {
       return VaultUtil.configureDbCredentials('local' ,'role_id', 'secret_id').then((p)=>{

       })

    })


})

