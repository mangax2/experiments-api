const sinon = require('sinon')
const SchemaValidator = require('../../src/validations/SchemaValidator')
const AppError = require('../../src/services/utility/AppError')

describe('SchemaValidator', () => {
    const target = new SchemaValidator()

    describe('schemaElementCheck ', () => {
        const testEntity = {}
        const testTransaction = {}
        const testError = {}

        let hasErrorsStub
        let checkReferentialIntegrityByIdStub
        let checkRIBusinessStub

        before(() => {
            hasErrorsStub = sinon.stub(target, 'hasErrors')
            checkReferentialIntegrityByIdStub = sinon.stub(target, 'checkReferentialIntegrityById')
            checkRIBusinessStub = sinon.stub(target, 'checkRIBusiness')
        })

        afterEach(() => {
            hasErrorsStub.reset()
            checkReferentialIntegrityByIdStub.reset()
            checkRIBusinessStub.reset()
        })

        after(() => {
            hasErrorsStub.restore()
            checkReferentialIntegrityByIdStub.restore()
            checkRIBusinessStub.restore()
        })

        it('returns error message when value is required', () => {
            return target.schemaElementCheck(null, {
                'paramName': 'name',
                'type': 'text',
                'lengthRange': {'min': 1, 'max': 50},
                'required': true
            }).then(() => {
                return target.check().should.be.rejected.then((err) => {
                    err.length.should.equal(1)
                    err[0].errorMessage.should.equal('name is required')
                })
            })
        })

        it('checks valid numeric', () => {
            return target.schemaElementCheck(1, {
                'paramName': 'number',
                'type': 'numeric'
            }).then(() => {
                return target.check()
            })
        })

        it('checks invalid numeric', () => {
            return target.schemaElementCheck("a", {
                'paramName': 'number',
                'type': 'numeric'
            }).then(() => {
                return target.check()
            }).should.be.rejected.then((err) => {
                err.length.should.equal(1)
                err[0].errorMessage.should.equal('number must be numeric')
            })
        })

        it('checks valid numeric range', () => {
            return target.schemaElementCheck(3, {
                'paramName': 'number',
                'type': 'numeric',
                'numericRange': {'min': 0, 'max': 50}
            }).then(() => {
                return target.check()
            })
        })

        it('checks invalid numeric range', () => {
            return target.schemaElementCheck(200, {
                'paramName': 'number',
                'type': 'numeric',
                'numericRange': {'min': 0, 'max': 50}
            }).then(() => {
                return target.check()
            }).should.be.rejected.then((err) => {
                err.length.should.equal(1)
                err[0].errorMessage.should.equal('number value is out of numeric range(min=0 max=50)')
            })
        })

        it('checks valid boolean true', () => {
            return target.schemaElementCheck(true, {
                'paramName': 'bool',
                'type': 'boolean'
            }).then(() => {
                return target.check()
            })
        })

        it('checks valid boolean false', () => {
            return target.schemaElementCheck(false, {
                'paramName': 'bool',
                'type': 'boolean'
            }).then(() => {
                return target.check()
            })
        })

        it('checks invalid boolean', () => {
            return target.schemaElementCheck(200, {
                'paramName': 'bool',
                'type': 'boolean',
            }).then(() => {
                return target.check()
            }).should.be.rejected.then((err) => {
                err.length.should.equal(1)
                err[0].errorMessage.should.equal('bool must be boolean')
            })
        })

        it('returns rejected promise when checkReferentialIntegrityById fails', () => {
            hasErrorsStub.returns(false)
            checkReferentialIntegrityByIdStub.rejects(testError)

            return target.schemaElementCheck('value',
                {
                    type: 'refData',
                    entity: testEntity,
                    paramName: 'pName'
                },
                {},
                testTransaction).should.be.rejected
                .then((err) => {
                    err.should.equal(testError)
                    sinon.assert.calledWithExactly(
                        checkReferentialIntegrityByIdStub,
                        'value',
                        sinon.match.same(testEntity),
                        sinon.match.same(testTransaction))
                })
        })

        it('returns resolved promise when checkReferentialIntegrityById succeeds', () => {
            hasErrorsStub.returns(false)
            checkReferentialIntegrityByIdStub.resolves()

            return target.schemaElementCheck('value',
                {
                    type: 'refData',
                    entity: testEntity,
                    paramName: 'pName'
                },
                {},
                testTransaction)
                .then(() => {
                    sinon.assert.calledWithExactly(
                        checkReferentialIntegrityByIdStub,
                        'value',
                        sinon.match.same(testEntity),
                        sinon.match.same(testTransaction))
                })
        })

        it('returns rejected promise when checkRIBusiness fails', () => {
            const testKeys = ['value']
            hasErrorsStub.returns(false)
            checkRIBusinessStub.rejects(testError)

            return target.schemaElementCheck(null,
                {
                    type: 'businessKey',
                    entity: testEntity,
                    keys: testKeys,
                    paramName: 'pName'
                },
                {id: 42, value: 'testValue'},
                testTransaction).should.be.rejected
                .then((err) => {
                    err.should.equal(testError)
                    sinon.assert.calledWithExactly(
                        checkRIBusinessStub,
                        42,
                        ['testValue'],
                        sinon.match.same(testEntity),
                        sinon.match.same(testKeys),
                        sinon.match.same(testTransaction))
                })
        })

        it('returns resolved promise when checkRIBusiness succeeds', () => {
            const testKeys = ['value']
            hasErrorsStub.returns(false)
            checkRIBusinessStub.resolves()

            return target.schemaElementCheck(null,
                {
                    type: 'businessKey',
                    entity: testEntity,
                    keys: testKeys,
                    paramName: 'pName'
                },
                {id: 42, value: 'testValue'},
                testTransaction)
                .then(() => {
                    sinon.assert.calledWithExactly(
                        checkRIBusinessStub,
                        42,
                        ['testValue'],
                        sinon.match.same(testEntity),
                        sinon.match.same(testKeys),
                        sinon.match.same(testTransaction))
                })
        })

        it('returns error when getSchema is not implemented by subclass ', () => {
            (function () {
                target.getSchema()
            }).should.throw('getSchema not implemented')
        })
    })

    describe('schemaCheck ', () => {
        const targetObj = {
            "subjectType": "plant",
            "userId": "akuma11",
            "refExperimentDesignId": 2,
            "status": "ACTIVE"
        }

        const schemaArray = [
            {'paramName': 'name', 'type': 'text', 'lengthRange': {'min': 1, 'max': 50}, 'required': true},
            {'paramName': 'subjectType', 'type': 'text', 'lengthRange': {'min': 1, 'max': 100}},
            {'paramName': 'refExperimentDesignId', 'type': 'refData'},
            {'paramName': 'status', 'type': 'constant', 'data': ['DRAFT', 'ACTIVE'], 'required': true},
            {'paramName': 'userId', 'type': 'text', 'lengthRange': {'min': 1, 'max': 50}, 'required': true},
            {'paramName': 'isNull', 'type': 'boolean', 'required': true},
            {'paramName': 'number', 'type': 'numeric'},
            {'paramName': 'number', 'type': 'numeric', 'numericRange': {'min': 0, 'max': 100}}
        ]

        it('returns error message when value is required', () => {
            return target.schemaCheck(targetObj, schemaArray).then(() => {
                return target.check().should.be.rejected.then((err) => {
                    err.length.should.equal(2)
                    err[0].errorMessage.should.equal('name is required')
                    err[1].errorMessage.should.equal('isNull is required')
                })
            })
        })

        it('returns error message when targetObj is empty object', () => {
            return target.schemaCheck({}, schemaArray).then(() => {
                return target.check().should.be.rejected.then((err) => {
                    err.length.should.equal(4)
                    err[0].errorMessage.should.equal('name is required')
                    err[1].errorMessage.should.equal('status is required')
                    err[2].errorMessage.should.equal('userId is required')
                    err[3].errorMessage.should.equal('isNull is required')
                })
            })
        })
    })

    describe('getSchema ', () => {
        it('returns error message when getSchema is called directly', () => {
            (function () {
                target.getSchema()
            }).should.throw('getSchema not implemented')
        })
    })

    describe('validateEntity', () => {
        let getSchemaStub
        let schemaCheckStub

        before(() => {
            getSchemaStub = sinon.stub(target, 'getSchema')
            schemaCheckStub = sinon.stub(target, 'schemaCheck')
        })

        afterEach(() => {
            getSchemaStub.reset()
            schemaCheckStub.reset()
        })

        after(() => {
            getSchemaStub.restore()
            schemaCheckStub.restore()
        })

        it('passes results of getSchema and pass through variables to schemaCheck', () => {
            const testObject = {}
            const testTransaction = {}
            const testSchema = {}
            const testResponse = {}
            getSchemaStub.returns(testSchema)
            schemaCheckStub.resolves(testResponse)

            const r = target.validateEntity(testObject, 'opName', testTransaction)
            return r.then((result) => {
                result.should.equal(testResponse)
                sinon.assert.calledWithExactly(
                    getSchemaStub,
                    'opName')
                sinon.assert.calledWithExactly(
                    schemaCheckStub,
                    sinon.match.same(testObject),
                    sinon.match.same(testSchema),
                    sinon.match.same(testTransaction)
                )
            })
        })
    })

    describe('postValidate', () => {
        let hasErrorsStub
        let getBusinessKeyPropertyNamesStub
        let getDuplicateBusinessKeyErrorStub
        let badRequestStub

        before(() => {
            hasErrorsStub = sinon.stub(target, 'hasErrors')
            getBusinessKeyPropertyNamesStub = sinon.stub(target, 'getBusinessKeyPropertyNames')
            getDuplicateBusinessKeyErrorStub = sinon.stub(target, 'getDuplicateBusinessKeyError')
            badRequestStub = sinon.stub(AppError, 'badRequest')
        })

        afterEach(() => {
            hasErrorsStub.reset()
            getBusinessKeyPropertyNamesStub.reset()
            getDuplicateBusinessKeyErrorStub.reset()
            badRequestStub.reset()
        })

        after(() => {
            hasErrorsStub.restore()
            getBusinessKeyPropertyNamesStub.restore()
            getDuplicateBusinessKeyErrorStub.restore()
            badRequestStub.restore()
        })

        it('does nothing and returns resolved promise when there are errors', () => {
            hasErrorsStub.returns(true)

            const r = target.postValidate({})

            r.should.be.instanceof(Promise)
            return r.then(() => {
                sinon.assert.notCalled(getBusinessKeyPropertyNamesStub)
                sinon.assert.notCalled(getDuplicateBusinessKeyErrorStub)
                sinon.assert.notCalled(badRequestStub)
            })
        })

        it('returns resolved promise when there are no duplicate keys', () => {
            hasErrorsStub.returns(false)
            getBusinessKeyPropertyNamesStub.returns(['value'])

            const r = target.postValidate(
                [
                    {
                        value: 'A'
                    },
                    {
                        value: 'B'
                    }
                ]
            )

            r.should.be.instanceof(Promise)
            return r.then(() => {
                sinon.assert.calledTwice(getBusinessKeyPropertyNamesStub)
                sinon.assert.notCalled(getDuplicateBusinessKeyErrorStub)
                sinon.assert.notCalled(badRequestStub)
            })
        })

        it('returns rejected promise when there are duplicate keys', () => {
            hasErrorsStub.returns(false)
            getBusinessKeyPropertyNamesStub.returns(['value'])
            getDuplicateBusinessKeyErrorStub.returns('Error message')

            const r = target.postValidate(
                [
                    {
                        value: 'A'
                    },
                    {
                        value: 'A'
                    }
                ]
            )

            r.should.be.instanceof(Promise)
            return r.should.be.rejected.then(() => {
                sinon.assert.calledTwice(getBusinessKeyPropertyNamesStub)
                sinon.assert.calledOnce(getDuplicateBusinessKeyErrorStub)
                sinon.assert.calledWithExactly(badRequestStub, 'Error message')
            })
        })
    })

    describe('getSchema', () => {
        it('throws error in default implementation', () => {
            (() => {
                target.getSchema()
            }).should.throw('getSchema not implemented')
        })
    })

    describe('getBusinessKeyPropertyNames', () => {
        it('throws error in default implementation', () => {
            (() => {
                target.getBusinessKeyPropertyNames()
            }).should.throw('getBusinessKeyPropertyNames not implemented')
        })
    })

    describe('getDuplicateBusinessKeyError', () => {
        it('throws error in default implementation', () => {
            (() => {
                target.getDuplicateBusinessKeyError()
            }).should.throw('getDuplicateBusinessKeyError not implemented')
        })
    })
})

