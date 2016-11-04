const sinon = require('sinon')
const chai = require('chai')
const FDCS = require('../../src/services/FactorDependentCompositeService')

describe('FactorDependentCompositeService', () => {
    const testPayload = {}
    const testResponse = {}
    const testError = {}

    let getfactorStub
    let getfactorLevelStub
    let getdependentVariableStub
    let getfactorTypeStub

    let deleteFactorsForExperimentIdStub
    let deleteDependentVariablesForExperimentIdStub
    let batchCreateFactorsStub
    let batchCreateLevelsStub

    let factorService, factorLevelService, dependentVariableService, factorTypeService

    let fdcs

    before(() => {
        fdcs = new FDCS()

        factorService = fdcs._factorService
        factorLevelService = fdcs._factorLevelService
        dependentVariableService = fdcs._dependentVariableService
        factorTypeService = fdcs._factorTypeService

        getfactorStub = sinon.stub(factorService, 'getFactorsByExperimentId')
        getfactorLevelStub = sinon.stub(factorLevelService, 'getFactorLevelsByFactorId')
        getdependentVariableStub = sinon.stub(dependentVariableService, 'getDependentVariablesByExperimentId')
        getfactorTypeStub = sinon.stub(factorTypeService, 'getAllFactorTypes')
    })

    after(() => {
        getfactorStub.restore()
        getfactorLevelStub.restore()
        getdependentVariableStub.restore()
        getfactorTypeStub.restore()
    })

    afterEach(() => {
        getfactorStub.reset()
        getfactorLevelStub.reset()
        getdependentVariableStub.reset()
        getfactorTypeStub.reset()
    })

    describe('getAllVariablesByExperimentId', function () {
        it('successfully gets no factors and no levels', function () {
            const getFactorWithLevelsStub = sinon.stub(fdcs, '_getFactorsWithLevels').resolves({
                factors: [],
                levels: []
            })
            getfactorTypeStub.resolves([])
            getdependentVariableStub.resolves([])

            return fdcs.getAllVariablesByExperimentId(1).then((data) => {
                data.should.deep.equal({
                    independent: [],
                    exogenous: [],
                    dependent: []
                })
                getFactorWithLevelsStub.calledWith(1).should.equal(true)
                getfactorTypeStub.calledOnce.should.equal(true)
                getdependentVariableStub.calledOnce.should.equal(true)

                getFactorWithLevelsStub.restore()
            })
        })

        it('successfully gets independent factors with levels', function () {
            const getFactorWithLevelsStub = sinon.stub(fdcs, '_getFactorsWithLevels').resolves({
                factors: [
                    {id: 1, ref_factor_type_id: 1, name: 'TestFactor'},
                    {id: 2, ref_factor_type_id: 1, name: 'TestFactor2'}
                ],
                levels: [
                    {id: 1, factor_id: 1, value: "value1"},
                    {id: 2, factor_id: 1, value: "value2"},
                    {id: 3, factor_id: 2, value: "value3"}
                ]
            })
            getfactorTypeStub.resolves([{id: 1, type: 'Independent'}])
            getdependentVariableStub.resolves([])

            return fdcs.getAllVariablesByExperimentId(1).then((data) => {
                data.should.deep.equal({
                    independent: [
                        {
                            name: 'TestFactor',
                            levels: ['value1', 'value2']
                        },
                        {
                            name: 'TestFactor2',
                            levels: ['value3']
                        }
                    ],
                    exogenous: [],
                    dependent: []
                })
                getFactorWithLevelsStub.calledWith(1).should.equal(true)
                getfactorTypeStub.calledOnce.should.equal(true)
                getdependentVariableStub.calledOnce.should.equal(true)

                getFactorWithLevelsStub.restore()
            })
        })

        it('successfully gets exogenous factors with levels', function () {
            const getFactorWithLevelsStub = sinon.stub(fdcs, '_getFactorsWithLevels').resolves({
                factors: [
                    {id: 1, ref_factor_type_id: 1, name: 'TestFactor'},
                    {id: 2, ref_factor_type_id: 1, name: 'TestFactor2'}
                ],
                levels: [
                    {id: 1, factor_id: 1, value: "value1"},
                    {id: 2, factor_id: 1, value: "value2"},
                    {id: 3, factor_id: 2, value: "value3"}
                ]
            })
            getfactorTypeStub.resolves([{id: 1, type: 'Exogenous'}])
            getdependentVariableStub.resolves([])

            return fdcs.getAllVariablesByExperimentId(1).then((data) => {
                data.should.deep.equal({
                    independent: [],
                    exogenous: [
                        {
                            name: 'TestFactor',
                            levels: ['value1', 'value2']
                        },
                        {
                            name: 'TestFactor2',
                            levels: ['value3']
                        }
                    ],
                    dependent: []
                })
                getFactorWithLevelsStub.calledWith(1).should.equal(true)
                getfactorTypeStub.calledOnce.should.equal(true)
                getdependentVariableStub.calledOnce.should.equal(true)

                getFactorWithLevelsStub.restore()
            })
        })

        it('successfully gets dependent variables', function () {
            const getFactorWithLevelsStub = sinon.stub(fdcs, '_getFactorsWithLevels').resolves({
                factors: [],
                levels: []
            })
            getfactorTypeStub.resolves([{id: 1, type: 'Exogenous'}])
            getdependentVariableStub.resolves([
                {
                    name: 'dependent1',
                    required: true
                },
                {
                    name: 'dependent2',
                    required: false
                }
            ])

            return fdcs.getAllVariablesByExperimentId(1).then((data) => {
                data.should.deep.equal({
                    independent: [],
                    exogenous: [],
                    dependent: [
                        {
                            name: 'dependent1',
                            required: true
                        },
                        {
                            name: 'dependent2',
                            required: false
                        }
                    ]
                })
                getFactorWithLevelsStub.calledWith(1).should.equal(true)
                getfactorTypeStub.calledOnce.should.equal(true)
                getdependentVariableStub.calledOnce.should.equal(true)

                getFactorWithLevelsStub.restore()
            })
        })

        it('successfully gets all factors with levels', function () {
            const getFactorWithLevelsStub = sinon.stub(fdcs, '_getFactorsWithLevels').resolves({
                factors: [
                    {id: 1, ref_factor_type_id: 1, name: 'TestFactor'},
                    {id: 2, ref_factor_type_id: 1, name: 'TestFactor2'},
                    {id: 3, ref_factor_type_id: 2, name: 'TestExogenous'}
                ],
                levels: [
                    {id: 1, factor_id: 1, value: "value1"},
                    {id: 2, factor_id: 1, value: "value2"},
                    {id: 3, factor_id: 2, value: "value3"},
                    {id: 4, factor_id: 3, value: 'exo1'},
                    {id: 5, factor_id: 3, value: 'exo2'}
                ]
            })
            getfactorTypeStub.resolves([{id: 1, type: 'Independent'}, {id: 2, type: 'Exogenous'}])
            getdependentVariableStub.resolves([
                {
                    name: 'dependent1',
                    required: true
                },
                {
                    name: 'dependent2',
                    required: false
                }
            ])

            return fdcs.getAllVariablesByExperimentId(1).then((data) => {
                data.should.deep.equal({
                    independent: [
                        {
                            name: 'TestFactor',
                            levels: ['value1', 'value2']
                        },
                        {
                            name: 'TestFactor2',
                            levels: ['value3']
                        }
                    ],
                    exogenous: [
                        {
                            name: 'TestExogenous',
                            levels: ['exo1', 'exo2']
                        }
                    ],
                    dependent: [
                        {
                            name: 'dependent1',
                            required: true
                        },
                        {
                            name: 'dependent2',
                            required: false
                        }
                    ]
                })
                getFactorWithLevelsStub.calledWith(1).should.equal(true)
                getfactorTypeStub.calledOnce.should.equal(true)
                getdependentVariableStub.calledOnce.should.equal(true)

                getFactorWithLevelsStub.restore()
            })
        })

        it('fails to retrieve factors', function () {
            const getFactorWithLevelsStub = sinon.stub(fdcs, '_getFactorsWithLevels').rejects("Failure")
            getfactorTypeStub.resolves([])
            getdependentVariableStub.resolves([])

            return fdcs.getAllVariablesByExperimentId(1).should.be.rejected.then((err) => {
                getfactorTypeStub.calledOnce.should.equal(true)
                getdependentVariableStub.calledOnce.should.equal(true)
                err.message.should.equal("Failure")
                getFactorWithLevelsStub.restore()
            })

        })
    })

    describe('_getFactorsWithLevels', function(){
        let getFactorStub, getFactorLevelStub

        before(() => {
            getFactorStub = sinon.stub(fdcs, '_getFactors')
            getFactorLevelStub = sinon.stub(fdcs, '_getFactorLevels')
        })

        after(() => {
            getFactorStub.restore()
            getFactorLevelStub.restore()
        })

        afterEach(() => {
            getFactorStub.reset()
            getFactorLevelStub.reset()
        })

        it('returns an object with no factors and no levels', function(){
            getFactorStub.resolves([])
            getFactorLevelStub.resolves([])

            return fdcs._getFactorsWithLevels(1).then((result)=>{
                result.should.deep.equal({
                    factors: [],
                    levels: []
                })
            })
        })

        it('returns an object with factors but no levels', function(){
            getFactorStub.resolves([{name: 'Factor1', id: 1}])
            getFactorLevelStub.resolves([])

            return fdcs._getFactorsWithLevels(1).then((result)=>{
                result.should.deep.equal({
                    factors: [{name: 'Factor1', id: 1}],
                    levels: []
                })
            })
        })

        it('returns an object with factors and levels', function(){
            getFactorStub.resolves([{name: 'Factor1', id: 1}, {name: 'Factor2', id:2}])
            getFactorLevelStub.resolves([[{value: 'level1', factor_id: 1}, {value: 'level2', factor_id: 1}],[{value: 'level3', factor_id:2}]])

            return fdcs._getFactorsWithLevels(1).then((result)=>{
                result.should.deep.equal({
                    factors: [{name: 'Factor1', id: 1}, {name: 'Factor2', id: 2}],
                    levels: [{value: 'level1', factor_id: 1}, {value: 'level2', factor_id: 1}, {value: 'level3', factor_id:2}]
                })
            })
        })

        it('fails to get factors', function(){
            getFactorStub.rejects("Failed")

            return fdcs._getFactorsWithLevels(1).should.be.rejected.then((err)=>{
                err.message.should.equal("Failed")
                getFactorLevelStub.called.should.equal(false)
            })
        })

        it('fails to get factor levels', function(){
            getFactorStub.resolves([{name: 'Factor1', id:1}])
            getFactorLevelStub.rejects("Failed")

            return fdcs._getFactorsWithLevels(1).should.be.rejected.then((err)=>{
                err.message.should.equal("Failed")
            })
        })
    })

    describe('_getFactors', function(){
        it('calls factor service and returns no factors', function(){
            getfactorStub.resolves([])

            return fdcs._getFactors(1).then((data)=>{
                data.should.deep.equal([])
            })
        })

        it('calls factor service and returns factors', function(){
            getfactorStub.resolves([{name: 'Factor1', id:1}])

            return fdcs._getFactors(1).then((data)=>{
                data.should.deep.equal([{name: 'Factor1', id:1}])
            })
        })

        it('calls factor service and fails', function(){
            getfactorStub.rejects("Failed")

            return fdcs._getFactors(1).should.be.rejected.then((err)=>{
                err.message.should.equal("Failed")
            })
        })
    })

    describe('_getFactorLevels', function(){
        it('calls factor level service and returns no levels', function(){
            getfactorLevelStub.resolves([])
            const factors = [{name: 'Test1', id:1}]

            return fdcs._getFactorLevels(factors).then((data)=> {
                data.should.deep.equal([[]])
                getfactorLevelStub.calledOnce.should.equal(true)
            })
        })

        it('calls factor level service for two factors', function(){
            getfactorLevelStub.onFirstCall().resolves([]).onSecondCall().resolves([])
            const factors = [{name: 'Test1', id:1}, {name: 'Test2', id:2}]

            return fdcs._getFactorLevels(factors).then((data)=> {
                data.should.deep.equal([[],[]])
                getfactorLevelStub.calledTwice.should.equal(true)
            })
        })

        it('calls factor level service and fails', function(){
            getfactorLevelStub.onFirstCall().resolves([]).onSecondCall().rejects("Failed")
            const factors = [{name: 'Test1', id:1}, {name: 'Test2', id:2}]

            return fdcs._getFactorLevels(factors).should.be.rejected.then((err)=> {
                err.message.should.equal('Failed')
                getfactorLevelStub.calledTwice.should.equal(true)
            })
        })
    })

})