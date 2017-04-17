const sinon = require('sinon')
const VariablesValidator = require('../../src/validations/VariablesValidator')

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

