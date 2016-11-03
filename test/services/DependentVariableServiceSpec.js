const sinon = require('sinon')
const chai = require('chai')
const DependentVariableService = require('../../src/services/DependentVariableService')
const Transactional = require('../../src/decorators/transactional')
const db = require('../../src/db/DbManager')

describe('DependentVariableService', () => {
    const testData = {}
    const testPayload = {}
    const testResponse = {}
    const testError = {}
    const tx = {tx: {}}

    let createStub
    let expFindStub
    let dependentVariableService
    let findStub
    let getStub
    let removeStub
    let removeByExperimentIdStub
    let transactionStub
    let updateStub
    let validateStub
    let findByExperimentIdStub
    let getExperimentByIdStub

    before(() => {
        createStub = sinon.stub(db.dependentVariable, 'batchCreate')
        expFindStub = sinon.stub(db.experiments, 'find')
        dependentVariableService = new DependentVariableService()
        findStub = sinon.stub(db.dependentVariable, 'find')
        findByExperimentIdStub = sinon.stub(db.dependentVariable, 'findByExperimentId')
        getStub = sinon.stub(db.dependentVariable, 'all')
        removeStub = sinon.stub(db.dependentVariable, 'remove')
        removeByExperimentIdStub = sinon.stub(db.dependentVariable, 'removeByExperimentId')
        transactionStub = sinon.stub(db.dependentVariable, 'repository', () => {
            return { tx: function (transactionName, callback) {return callback(tx)} }
        })
        updateStub = sinon.stub(db.dependentVariable, 'batchUpdate')
        validateStub = sinon.stub(dependentVariableService._validator, 'validate')
        getExperimentByIdStub = sinon.stub(dependentVariableService._experimentService, 'getExperimentById')

    })

    after(() => {
        createStub.restore()
        expFindStub.restore()
        findStub.restore()
        findByExperimentIdStub.restore()
        getStub.restore()
        removeStub.restore()
        removeByExperimentIdStub.restore()
        transactionStub.restore()
        updateStub.restore()
        validateStub.restore()
        getExperimentByIdStub.restore()

    })

    afterEach(() => {
        createStub.reset()
        expFindStub.reset()
        findStub.reset()
        findByExperimentIdStub.reset()
        getStub.reset()
        removeStub.reset()
        removeByExperimentIdStub.reset()
        transactionStub.reset()
        updateStub.reset()
        validateStub.reset()
        getExperimentByIdStub.reset()
    })

    describe('Get All Dependent Variables:', () => {
        it('Success', ()=> {
            getStub.resolves(testResponse)

            return dependentVariableService.getAllDependentVariables().then((dvs)=> {
                sinon.assert.calledOnce(getStub)
                dvs.should.equal(testResponse)
            })
        })

        it('fails', () => {
            getStub.rejects(testError)

            return dependentVariableService.getAllDependentVariables().should.be.rejected.then((err) => {
                sinon.assert.calledWithExactly(getStub)
                err.should.equal(testError)
            })
        })
    })

    describe('Get Dependent Variables By Id:', () => {
        it('Success and Return dependent variavle with Id', ()=> {
            findStub.resolves(testResponse)

            return dependentVariableService.getDependentVariableById(30).then((dp)=> {
                sinon.assert.calledWithExactly(findStub, 30)
                dp.should.equal(testResponse)
            })
        })

        it('fails', () => {
            findStub.rejects(testError)

            return dependentVariableService.getDependentVariableById(30).should.be.rejected.then((err) => {
                err.should.equal(testError)
                sinon.assert.calledWithExactly(findStub, 30)
            })
        })

        it('fails When it returns no result', ()=> {
            findStub.resolves(null)

            return dependentVariableService.getDependentVariableById(30).should.be.rejected.then((err) => {
                err.status.should.equal(404)
                err.message.should.equal('Dependent Variable Not Found for requested id')
                sinon.assert.calledWithExactly(findStub, 30)
            })
        })
    })

    describe('Get dependent variables By experiment Id:', () => {

        it('Success and Return dependent variables', ()=> {
            getExperimentByIdStub.resolves({})
            findByExperimentIdStub.resolves(testResponse)

            return dependentVariableService.getDependentVariablesByExperimentId(1).then((dvs)=> {
                sinon.assert.calledWithExactly(findByExperimentIdStub, 1)
                dvs.should.equal(testResponse)
            })
        })

        it('fails', () => {
            getExperimentByIdStub.rejects()
            return dependentVariableService.getDependentVariablesByExperimentId(-1).should.be.rejected.then((err) => {
                findByExperimentIdStub.called.should.equal(false)
            })
        })

    })

    describe('Create Dependent Variables', () => {

        const dvsObj = [{
            'required': true,
            'name': 'plant',
            'experimentId': 2,
            'userId': 'akuma11'
        }]

        const expectedResult = [
            {
                'status': 201,
                'message': 'Resource created',
                'id': 1
            }
        ]

        it('succeeds and returns newly created dependent variable id with status and message for one entity create request', () => {
            createStub.resolves([{id: 1}])
            expFindStub.resolves({id: 2})
            validateStub.resolves()

            return dependentVariableService.batchCreateDependentVariables(dvsObj).then((result) => {
                result.should.eql(expectedResult)
                sinon.assert.calledOnce(validateStub)
                sinon.assert.calledOnce(createStub)

            })
        })

        it('succeeds and returns list of dependent variable ids with status and message for batch create request', () => {
            dvsObj.push(
                {
                    'required': true,
                    'name': 'yield',
                    'experimentId': 2,
                    'userId': 'akuma11'
                }
            )
            expectedResult.push(
                {
                    'status': 201,
                    'message': 'Resource created',
                    'id': 2
                }
            )

            createStub.resolves([{id: 1},{id: 2}])
            validateStub.resolves()

            return dependentVariableService.batchCreateDependentVariables(dvsObj).then((result) => {
                result.should.eql(expectedResult)
                createStub.calledOnce.should.equal(true)
            })
        })

        it('fails', () => {
            createStub.rejects(testError)
            validateStub.resolves()

            return dependentVariableService.batchCreateDependentVariables(dvsObj).should.be.rejected.then((err) => {
                err.should.equal(testError)
            })
        })

        it('fails due to validation error', () => {
            validateStub.rejects("Validation Failure")

            return dependentVariableService.batchCreateDependentVariables(dvsObj).should.be.rejected.then((err) => {
                createStub.called.should.equal(false)
            })
        })
    })


    describe('Update Dependent Variables', () => {

        const dvsObj = [{
            'id':101,
            'required': true,
            'name': 'plant',
            'experimentId': 2,
            'userId': 'akuma11'
        }]

        const expectedResult = [
            {
                'status': 200,
                'message': 'Resource updated',
                'id': 1
            }
        ]

        it('succeeds and returns newly updated dependent variable id with status and message for one entity update request', () => {
            updateStub.resolves([{id: 1}])
            validateStub.resolves()

            return dependentVariableService.batchUpdateDependentVariables(dvsObj).then((result) => {
                result.should.eql(expectedResult)
                sinon.assert.calledOnce(validateStub)
                sinon.assert.calledOnce(updateStub)

            })
        })

        it('succeeds and returns list of dependent variable ids with status and message for batch update request', () => {
            dvsObj.push(
                {
                    'id':101,
                    'required': true,
                    'name': 'yield',
                    'experimentId': 2,
                    'userId': 'akuma11'
                }
            )
            expectedResult.push(
                {
                    'status': 200,
                    'message': 'Resource updated',
                    'id': 2
                }
            )

            updateStub.resolves([{id: 1},{id: 2}])
            validateStub.resolves()

            return dependentVariableService.batchUpdateDependentVariables(dvsObj).then((result) => {
                result.should.eql(expectedResult)
                sinon.assert.calledOnce(updateStub)
            })
        })

        it('fails', () => {
            updateStub.rejects(testError)
            validateStub.resolves()

            return dependentVariableService.batchUpdateDependentVariables(dvsObj).should.be.rejected.then((err) => {
                err.should.equal(testError)
            })
        })

        it('fails due to validation error', () => {
            validateStub.rejects("Validation Failure")

            return dependentVariableService.batchUpdateDependentVariables(dvsObj).should.be.rejected.then((err) => {
                updateStub.called.should.equal(false)
            })
        })
    })
    describe('Delete Dependent Variable:', () => {

        it('Success and Return dependent variavle id', ()=> {
            removeStub.resolves(30)
            return dependentVariableService.deleteDependentVariable(30).then((id)=> {
                id.should.equal(30)
            })
        })

        it('fails', () => {
            removeStub.rejects(testError)

            return dependentVariableService.deleteDependentVariable(30).should.be.rejected.then((err) => {
                err.should.equal(testError)
                removeStub.calledOnce.should.equal(true)
                sinon.assert.calledWithExactly(
                    removeStub,
                    30)
            })
        })

        it('fails When it returns no result', ()=> {
            removeStub.resolves(null)
            return dependentVariableService.deleteDependentVariable(30).should.be.rejected.then((err) => {
                err.status.should.equal(404)
                err.message.should.equal('Dependent Variable Not Found for requested id')
            })

        })
    })

    describe('deleteDependentVariablesForExperimentId', () => {
        it('returns rejected promise when getExperimentById fails', () => {
            getExperimentByIdStub.rejects(testError)

            return dependentVariableService.deleteDependentVariablesForExperimentId(7).should.be.rejected.then((err) => {
                err.should.equal(testError)
                sinon.assert.calledWith(getExperimentByIdStub, 7)
                sinon.assert.notCalled(removeByExperimentIdStub)
            })
        })

        it('returns rejected promise when getByExperimentId fails', () => {
            getExperimentByIdStub.resolves()
            removeByExperimentIdStub.rejects(testError)

            return dependentVariableService.deleteDependentVariablesForExperimentId(7, tx).should.be.rejected.then((err) => {
                err.should.equal(testError)
                sinon.assert.calledWithExactly(
                    getExperimentByIdStub,
                    7,
                    sinon.match.same(tx))
                sinon.assert.calledWithExactly(
                    removeByExperimentIdStub,
                    sinon.match.same(tx),
                    7)
            })
        })

        it('returns resolved promise from getByExperimentId method upon success', () => {
            getExperimentByIdStub.resolves()
            removeByExperimentIdStub.resolves(testData)

            return dependentVariableService.deleteDependentVariablesForExperimentId(7, tx).then((data) => {
                data.should.equal(testData)
                sinon.assert.calledWithExactly(
                    getExperimentByIdStub,
                    7,
                    sinon.match.same(tx))
                sinon.assert.calledWithExactly(
                    removeByExperimentIdStub,
                    sinon.match.same(tx),
                    7)
            })
        })
    })
})