const sinon = require('sinon')
const VariablesValidator = require('../../src/validations/VariablesValidator')
import db from '../../src/db/DbManager'

describe('VariablesValidator', () => {
    let target = new VariablesValidator()

    describe('getSchema ', () => {
        it('returns schema array', () => {
            target.getSchema().should.eql(VariablesValidator.SCHEMA)
        })
    })

    describe('postValidate ', () => {
        it('returns resolved promise', () => {
            const r = target.postValidate({})
            r.should.be.instanceof(Promise)
            return r
        })
    })
})

