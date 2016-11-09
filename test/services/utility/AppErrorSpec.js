/**
 * Created by kprat1 on 11/10/16.
 */
const sinon = require('sinon')
const chai = require('chai')
const AppError = require('../../../src/services/utility/AppError')
const internals = {};

describe('create', () => {
    it('returns "Unknown" code when status code is not a known value', () => {
        AppError.create(999, 'test message', {}).code.should.equal('Unknown')
    })
})

describe("BadRequest", ()=> {

    it('returns a 400 error status Code', (done)=> {
        const error = AppError.badRequest()
        error.status.should.to.equal(400)
        done()
    })
    it('sets the message with the passed in message', (done)=> {
        const error = AppError.badRequest("Invalid Experiment Data")
        error.status.should.to.equal(400)
        error.errorMessage.should.to.equal("Invalid Experiment Data")
        done()
    })
    it('sets the message to Http status if none provided', (done)=> {
        const error = AppError.badRequest()
        error.status.should.to.equal(400)
        error.errorMessage.should.to.equal("Bad Request")
        done()
    })
    it('sets the data to error if provided', (done)=> {
        const error = AppError.badRequest("Invalid Experiment Data", "experimentName")
        error.status.should.to.equal(400)
        error.errorMessage.should.to.equal("Invalid Experiment Data")
        error.data.should.be.equal("experimentName")
        done()
    })
})


describe("notFound", ()=> {

    it('returns a 404 error status Code', (done)=> {
        const error = AppError.notFound()
        error.status.should.to.equal(404)
        done()
    })
    it('sets the message with the passed in message', (done)=> {
        const error = AppError.notFound("Experiment Not Found")
        error.status.should.to.equal(404)
        error.errorMessage.should.to.equal("Experiment Not Found")
        done()
    })
    it('sets the message to Http status if none provided', (done)=> {
        const error = AppError.notFound()
        error.status.should.to.equal(404)
        error.errorMessage.should.to.equal("Not Found")
        done()
    })
})

describe("Forbidden", ()=> {

    it('returns a 403 error status Code', (done)=> {
        const error = AppError.forbidden()
        error.status.should.to.equal(403)
        done()
    })
    it('sets the message with the passed in message', (done)=> {
        const error = AppError.forbidden("you just don’t have permission to access this resource")
        error.status.should.to.equal(403)
        error.errorMessage.should.to.equal("you just don’t have permission to access this resource")
        done()
    })
    it('sets the message to Http status if none provided', (done)=> {
        const error = AppError.forbidden()
        error.status.should.to.equal(403)
        error.errorMessage.should.to.equal("Forbidden")
        done()
    })
})

describe("unauthorized", ()=> {

    it('returns a 401 error status Code', (done)=> {
        const error = AppError.unauthorized()
        error.status.should.to.equal(401)
        done()
    })
    it('sets the message with the passed in message', (done)=> {
        const error = AppError.unauthorized("you aren’t authenticated")
        error.status.should.to.equal(401)
        error.errorMessage.should.to.equal("you aren’t authenticated")
        done()
    })
    it('sets the message to Http status if none provided', (done)=> {
        const error = AppError.unauthorized()
        error.status.should.to.equal(401)
        error.errorMessage.should.to.equal("Unauthorized")
        done()
    })


})

describe("internalServer Error", ()=> {

    it('returns a 500 error status Code', (done)=> {
        const error = AppError.create(500)
        error.status.should.to.equal(500)
        error.errorMessage.should.to.equal("An internal server error occurred")
        done()
    })
})