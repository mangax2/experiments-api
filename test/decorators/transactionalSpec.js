const sinon = require('sinon')
const chai = require('chai')
import db from '../../src/db/DbManager'
import Transactional from '../../src/decorators/transactional'

describe('transactional', () => {
    // Transaction decorator needs to wrap a class member function, so
    // this test class is introduced.
    class TestClassWithTransactionalFunction {
        constructor(functionStub) {
            this.stub = functionStub
        }

        @Transactional('testTransactionName')
        transactionalFunction() {
            this.stub(...arguments)
        }
    }

    const testTx = {tx:{}}

    let testClass
    let wrappedFunctionStub
    let txStub

    before(() => {
        wrappedFunctionStub = sinon.stub()
        testClass = new TestClassWithTransactionalFunction(wrappedFunctionStub)
        txStub = sinon.stub(db, 'tx', (transactionName, callback) => {
            callback(testTx)
        })
    })

    beforeEach(() => {
        wrappedFunctionStub.reset()
        txStub.reset()
    })

    after(() => {
        txStub.restore()
    })

    it('creates proxy to pass a new transaction when no args are given', () => {
        testClass.transactionalFunction()

        sinon.assert.calledWith(
            txStub,
            'testTransactionName'
        )
        sinon.assert.calledWithExactly(
            wrappedFunctionStub,
            sinon.match.same(testTx)
        )
    })

    it('creates proxy to allow an existing transaction to pass through when it is only variable', () => {
        testClass.transactionalFunction(testTx)

        sinon.assert.notCalled(txStub)
        sinon.assert.calledWithExactly(
            wrappedFunctionStub,
            sinon.match.same(testTx)
        )
    })

    it('creates proxy to allow an existing transaction to pass through when it is last of several variables', () => {
        const arg1 = {}

        testClass.transactionalFunction(arg1, testTx)

        sinon.assert.notCalled(txStub)
        sinon.assert.calledWithExactly(
            wrappedFunctionStub,
            sinon.match.same(arg1),
            sinon.match.same(testTx)
        )
    })

    it('creates proxy to push a transaction onto the argument list when the last argument is not a transaction', () => {
        const arg1 = {}

        testClass.transactionalFunction(arg1)

        sinon.assert.calledWith(
            txStub,
            'testTransactionName'
        )
        sinon.assert.calledWithExactly(
            wrappedFunctionStub,
            sinon.match.same(arg1),
            sinon.match.same(testTx)
        )
    })
})