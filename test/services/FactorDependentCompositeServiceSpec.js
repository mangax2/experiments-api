const sinon = require('sinon')
const chai = require('chai')
const FDCS = require('../../src/services/FactorDependentCompositeService')
const AppUtil = require('../../src/services/utility/AppUtil')

describe('FactorDependentCompositeService', () => {
  const testResponse = {}
  const testError = {}
  const testContext = {}
  const testTx = { tx: {} }

  let getfactorStub
  let getfactorLevelStub
  let getdependentVariableStub
  let getfactorTypeStub

  let deleteFactorsForExperimentIdStub
  let deleteDependentVariablesForExperimentIdStub
  let batchCreateFactorsStub
  let batchCreateLevelsStub
  let batchCreateDependentVariablesStub

  let factorService, factorLevelService, dependentVariableService, factorTypeService

  let fdcs

  before(() => {
    fdcs = new FDCS()

    factorService = fdcs.factorService
    factorLevelService = fdcs.factorLevelService
    dependentVariableService = fdcs.dependentVariableService
    factorTypeService = fdcs.factorTypeService

    getfactorStub = sinon.stub(factorService, 'getFactorsByExperimentId')
    getfactorLevelStub = sinon.stub(factorLevelService, 'getFactorLevelsByFactorId')
    getdependentVariableStub = sinon.stub(dependentVariableService, 'getDependentVariablesByExperimentId')
    getfactorTypeStub = sinon.stub(factorTypeService, 'getAllFactorTypes')

    deleteFactorsForExperimentIdStub = sinon.stub(factorService, 'deleteFactorsForExperimentId')
    deleteDependentVariablesForExperimentIdStub = sinon.stub(dependentVariableService, 'deleteDependentVariablesForExperimentId')
    batchCreateFactorsStub = sinon.stub(factorService, 'batchCreateFactors')
    batchCreateLevelsStub = sinon.stub(factorLevelService, 'batchCreateFactorLevels')
    batchCreateDependentVariablesStub = sinon.stub(dependentVariableService, 'batchCreateDependentVariables')
  })

  after(() => {
    getfactorStub.restore()
    getfactorLevelStub.restore()
    getdependentVariableStub.restore()
    getfactorTypeStub.restore()

    deleteFactorsForExperimentIdStub.restore()
    deleteDependentVariablesForExperimentIdStub.restore()
    batchCreateFactorsStub.restore()
    batchCreateLevelsStub.restore()
    batchCreateDependentVariablesStub.restore()
  })

  afterEach(() => {
    getfactorStub.reset()
    getfactorLevelStub.reset()
    getdependentVariableStub.reset()
    getfactorTypeStub.reset()

    deleteFactorsForExperimentIdStub.reset()
    deleteDependentVariablesForExperimentIdStub.reset()
    batchCreateFactorsStub.reset()
    batchCreateLevelsStub.reset()
    batchCreateDependentVariablesStub.reset()
  })

  describe('getAllVariablesByExperimentId', function () {
    it('successfully gets no factors and no levels', function () {
      const getFactorWithLevelsStub = sinon.stub(fdcs, 'getFactorsWithLevels').resolves({
        factors: [],
        levels: [],
      })
      getfactorTypeStub.resolves([])
      getdependentVariableStub.resolves([])

      return fdcs.getAllVariablesByExperimentId(1).then((data) => {
        data.should.deep.equal({
          independent: [],
          exogenous: [],
          dependent: [],
        })
        getFactorWithLevelsStub.calledWith(1).should.equal(true)
        getfactorTypeStub.calledOnce.should.equal(true)
        getdependentVariableStub.calledOnce.should.equal(true)

        getFactorWithLevelsStub.restore()
      })
    })

    it('successfully gets independent factors with levels', function () {
      const getFactorWithLevelsStub = sinon.stub(fdcs, 'getFactorsWithLevels').resolves({
        factors: [
          { id: 1, ref_factor_type_id: 1, name: 'TestFactor', tier: 1, ref_data_source_id: 1 },
          { id: 2, ref_factor_type_id: 1, name: 'TestFactor2', tier: 2, ref_data_source_id: 1 },
        ],
        levels: [
          { id: 1, factor_id: 1, value: 'value1' },
          { id: 2, factor_id: 1, value: 'value2' },
          { id: 3, factor_id: 2, value: 'value3' },
        ],
      })
      getfactorTypeStub.resolves([{ id: 1, type: 'Independent' }])
      getdependentVariableStub.resolves([])

      return fdcs.getAllVariablesByExperimentId(1).then((data) => {
        data.should.deep.equal({
          independent: [
            {
              name: 'TestFactor', tier: 1, refDataSourceId: 1,
              levels: ['value1', 'value2'],
            },
            {
              name: 'TestFactor2', tier: 2, refDataSourceId: 1,
              levels: ['value3'],
            },
          ],
          exogenous: [],
          dependent: [],
        })
        getFactorWithLevelsStub.calledWith(1).should.equal(true)
        getfactorTypeStub.calledOnce.should.equal(true)
        getdependentVariableStub.calledOnce.should.equal(true)

        getFactorWithLevelsStub.restore()
      })
    })

    it('successfully gets exogenous factors with levels', function () {
      const getFactorWithLevelsStub = sinon.stub(fdcs, 'getFactorsWithLevels').resolves({
        factors: [
          { id: 1, ref_factor_type_id: 1, name: 'TestFactor', ref_data_source_id: 1 },
          { id: 2, ref_factor_type_id: 1, name: 'TestFactor2', ref_data_source_id: 1 },
        ],
        levels: [
          { id: 1, factor_id: 1, value: 'value1' },
          { id: 2, factor_id: 1, value: 'value2' },
          { id: 3, factor_id: 2, value: 'value3' },
        ],
      })
      getfactorTypeStub.resolves([{ id: 1, type: 'Exogenous' }])
      getdependentVariableStub.resolves([])

      return fdcs.getAllVariablesByExperimentId(1).then((data) => {
        data.should.deep.equal({
          independent: [],
          exogenous: [
            {
              name: 'TestFactor', tier: undefined, refDataSourceId: 1,
              levels: ['value1', 'value2'],
            },
            {
              name: 'TestFactor2', tier: undefined, refDataSourceId: 1,
              levels: ['value3'],
            },
          ],
          dependent: [],
        })
        getFactorWithLevelsStub.calledWith(1).should.equal(true)
        getfactorTypeStub.calledOnce.should.equal(true)
        getdependentVariableStub.calledOnce.should.equal(true)

        getFactorWithLevelsStub.restore()
      })
    })

    it('successfully gets dependent variables', function () {
      const getFactorWithLevelsStub = sinon.stub(fdcs, 'getFactorsWithLevels').resolves({
        factors: [],
        levels: [],
      })
      getfactorTypeStub.resolves([{ id: 1, type: 'Exogenous' }])
      getdependentVariableStub.resolves([
        {
          name: 'dependent1',
          required: true,
        },
        {
          name: 'dependent2',
          required: false,
        },
      ])

      return fdcs.getAllVariablesByExperimentId(1).then((data) => {
        data.should.deep.equal({
          independent: [],
          exogenous: [],
          dependent: [
            {
              name: 'dependent1',
              required: true,
            },
            {
              name: 'dependent2',
              required: false,
            },
          ],
        })
        getFactorWithLevelsStub.calledWith(1).should.equal(true)
        getfactorTypeStub.calledOnce.should.equal(true)
        getdependentVariableStub.calledOnce.should.equal(true)

        getFactorWithLevelsStub.restore()
      })
    })

    it('successfully gets all factors with levels', function () {
      const getFactorWithLevelsStub = sinon.stub(fdcs, 'getFactorsWithLevels').resolves({
        factors: [
          { id: 1, ref_factor_type_id: 1, name: 'TestFactor', ref_data_source_id: 1 },
          { id: 2, ref_factor_type_id: 1, name: 'TestFactor2', ref_data_source_id: 1 },
          { id: 3, ref_factor_type_id: 2, name: 'TestExogenous', ref_data_source_id: 2 },
        ],
        levels: [
          { id: 1, factor_id: 1, value: 'value1' },
          { id: 2, factor_id: 1, value: 'value2' },
          { id: 3, factor_id: 2, value: 'value3' },
          { id: 4, factor_id: 3, value: 'exo1' },
          { id: 5, factor_id: 3, value: 'exo2' },
        ],
      })
      getfactorTypeStub.resolves([{ id: 1, type: 'Independent' }, { id: 2, type: 'Exogenous' }])
      getdependentVariableStub.resolves([
        {
          name: 'dependent1',
          required: true,
        },
        {
          name: 'dependent2',
          required: false,
        },
      ])

      return fdcs.getAllVariablesByExperimentId(1).then((data) => {
        data.should.deep.equal({
          independent: [
            {
              name: 'TestFactor', tier: undefined, refDataSourceId: 1,
              levels: ['value1', 'value2'],
            },
            {
              name: 'TestFactor2', tier: undefined, refDataSourceId: 1,
              levels: ['value3'],
            },
          ],
          exogenous: [
            {
              name: 'TestExogenous', tier: undefined, refDataSourceId: 2,
              levels: ['exo1', 'exo2'],
            },
          ],
          dependent: [
            {
              name: 'dependent1',
              required: true,
            },
            {
              name: 'dependent2',
              required: false,
            },
          ],
        })
        getFactorWithLevelsStub.calledWith(1).should.equal(true)
        getfactorTypeStub.calledOnce.should.equal(true)
        getdependentVariableStub.calledOnce.should.equal(true)

        getFactorWithLevelsStub.restore()
      })
    })

    it('fails to retrieve factors', function () {
      const getFactorWithLevelsStub = sinon.stub(fdcs, 'getFactorsWithLevels').rejects('Failure')
      getfactorTypeStub.resolves([])
      getdependentVariableStub.resolves([])

      return fdcs.getAllVariablesByExperimentId(1).should.be.rejected.then((err) => {
        getfactorTypeStub.calledOnce.should.equal(true)
        getdependentVariableStub.calledOnce.should.equal(true)
        err.message.should.equal('Failure')
        getFactorWithLevelsStub.restore()
      })

    })
  })

  describe('getFactorsWithLevels', function () {
    let getFactorStub, getFactorLevelStub

    before(() => {
      getFactorStub = sinon.stub(fdcs, 'getFactors')
      getFactorLevelStub = sinon.stub(fdcs, 'getFactorLevels')
    })

    after(() => {
      getFactorStub.restore()
      getFactorLevelStub.restore()
    })

    afterEach(() => {
      getFactorStub.reset()
      getFactorLevelStub.reset()
    })

    it('returns an object with no factors and no levels', function () {
      getFactorStub.resolves([])
      getFactorLevelStub.resolves([])

      return fdcs.getFactorsWithLevels(1).then((result) => {
        result.should.deep.equal({
          factors: [],
          levels: [],
        })
      })
    })

    it('returns an object with factors but no levels', function () {
      getFactorStub.resolves([{ name: 'Factor1', id: 1 }])
      getFactorLevelStub.resolves([])

      return fdcs.getFactorsWithLevels(1).then((result) => {
        result.should.deep.equal({
          factors: [{ name: 'Factor1', id: 1 }],
          levels: [],
        })
      })
    })

    it('returns an object with factors and levels', function () {
      getFactorStub.resolves([{ name: 'Factor1', id: 1 }, { name: 'Factor2', id: 2 }])
      getFactorLevelStub.resolves([[{ value: 'level1', factor_id: 1 }, {
        value: 'level2',
        factor_id: 1,
      }], [{ value: 'level3', factor_id: 2 }]])

      return fdcs.getFactorsWithLevels(1).then((result) => {
        result.should.deep.equal({
          factors: [{ name: 'Factor1', id: 1 }, { name: 'Factor2', id: 2 }],
          levels: [{ value: 'level1', factor_id: 1 }, { value: 'level2', factor_id: 1 }, {
            value: 'level3',
            factor_id: 2,
          }],
        })
      })
    })

    it('fails to get factors', function () {
      getFactorStub.rejects('Failed')

      return fdcs.getFactorsWithLevels(1).should.be.rejected.then((err) => {
        err.message.should.equal('Failed')
        getFactorLevelStub.called.should.equal(false)
      })
    })

    it('fails to get factor levels', function () {
      getFactorStub.resolves([{ name: 'Factor1', id: 1 }])
      getFactorLevelStub.rejects('Failed')

      return fdcs.getFactorsWithLevels(1).should.be.rejected.then((err) => {
        err.message.should.equal('Failed')
      })
    })
  })

  describe('getFactors', function () {
    it('calls factor service and returns no factors', function () {
      getfactorStub.resolves([])

      return fdcs.getFactors(1).then((data) => {
        data.should.deep.equal([])
      })
    })

    it('calls factor service and returns factors', function () {
      getfactorStub.resolves([{ name: 'Factor1', id: 1 }])

      return fdcs.getFactors(1).then((data) => {
        data.should.deep.equal([{ name: 'Factor1', id: 1 }])
      })
    })

    it('calls factor service and fails', function () {
      getfactorStub.rejects('Failed')

      return fdcs.getFactors(1).should.be.rejected.then((err) => {
        err.message.should.equal('Failed')
      })
    })
  })

  describe('getFactorLevels', function () {
    it('calls factor level service and returns no levels', function () {
      getfactorLevelStub.resolves([])
      const factors = [{ name: 'Test1', id: 1 }]

      return fdcs.getFactorLevels(factors).then((data) => {
        data.should.deep.equal([[]])
        getfactorLevelStub.calledOnce.should.equal(true)
      })
    })

    it('calls factor level service for two factors', function () {
      getfactorLevelStub.onFirstCall().resolves([]).onSecondCall().resolves([])
      const factors = [{ name: 'Test1', id: 1 }, { name: 'Test2', id: 2 }]

      return fdcs.getFactorLevels(factors).then((data) => {
        data.should.deep.equal([[], []])
        getfactorLevelStub.calledTwice.should.equal(true)
      })
    })

    it('calls factor level service and fails', function () {
      getfactorLevelStub.onFirstCall().resolves([]).onSecondCall().rejects('Failed')
      const factors = [{ name: 'Test1', id: 1 }, { name: 'Test2', id: 2 }]

      return fdcs.getFactorLevels(factors).should.be.rejected.then((err) => {
        err.message.should.equal('Failed')
        getfactorLevelStub.calledTwice.should.equal(true)
      })
    })
  })

  describe('INDEPENDENT_VARIABLE_TYPE_ID', () => {
    it('returns 1', () => {
      FDCS.INDEPENDENT_VARIABLE_TYPE_ID.should.equal(1)
    })
  })

  describe('EXOGENOUS_VARIABLE_TYPE_ID', () => {
    it('returns 2', () => {
      FDCS.EXOGENOUS_VARIABLE_TYPE_ID.should.equal(2)
    })
  })

  describe('_mapVariableDTO2DbEntity', () => {
    it('returns empty array when passed empty array', () => {
      const r = FDCS.mapVariableDTO2DbEntity([], 42, 7)
      r.length.should.equal(0)
    })

    it('returns applies experimentId and variableTypeId to single element array', () => {
      const r = FDCS.mapVariableDTO2DbEntity([{}], 42, 7)
      r.length.should.equal(1)
      r[0].refFactorTypeId.should.equal(7)
      r[0].experimentId.should.equal(42)
    })

    it('returns applies experimentId and variableTypeId to multiple element array', () => {
      const r = FDCS.mapVariableDTO2DbEntity([{}, {}], 42, 7)
      r.length.should.equal(2)
      r[0].refFactorTypeId.should.equal(7)
      r[0].experimentId.should.equal(42)
      r[1].refFactorTypeId.should.equal(7)
      r[1].experimentId.should.equal(42)
    })
  })

  describe('_mapLevelDTO2DbEntity', () => {
    it('returns empty array when passed empty array', () => {
      const r = FDCS.mapLevelDTO2DbEntity([], 42)
      r.length.should.equal(0)
    })

    it('creates object with level and factorId for single element array', () => {
      const r = FDCS.mapLevelDTO2DbEntity(['value'], 42)
      r.length.should.equal(1)
      r[0].value.should.equal('value')
      r[0].factorId.should.equal(42)
    })

    it('creates object with level and factorId for multiple element array', () => {
      const r = FDCS.mapLevelDTO2DbEntity(['value1', 'value2'], 42)
      r.length.should.equal(2)
      r[0].value.should.equal('value1')
      r[0].factorId.should.equal(42)
      r[1].value.should.equal('value2')
      r[1].factorId.should.equal(42)
    })
  })

  describe('_mapDependentVariableDTO2DbEntity', () => {
    it('returns empty array when passed empty array', () => {
      const r = FDCS.mapDependentVariableDTO2DbEntity([], 42)
      r.length.should.equal(0)
    })

    it('returns applies experimentId and variableTypeId to single element array', () => {
      const r = FDCS.mapDependentVariableDTO2DbEntity([{}], 42)
      r.length.should.equal(1)
      r[0].experimentId.should.equal(42)
    })

    it('returns applies experimentId and variableTypeId to multiple element array', () => {
      const r = FDCS.mapDependentVariableDTO2DbEntity([{}, {}], 42)
      r.length.should.equal(2)
      r[0].experimentId.should.equal(42)
      r[1].experimentId.should.equal(42)
    })
  })

  describe('_mapIndependentAndExogenousVariableDTO2Entity', () => {
    const testIndependentVariablesInput = {}
    const testExogenousVariablesInput = {}
    let mapVariableDTO2DbEntityStub

    before(() => {
      mapVariableDTO2DbEntityStub =
        sinon.stub(FDCS, 'mapVariableDTO2DbEntity')
    })

    after(() => {
      mapVariableDTO2DbEntityStub.restore()
    })

    it('concatenates results of mapping independent and exogenous into a single array', () => {
      mapVariableDTO2DbEntityStub.onFirstCall().returns([1, 2])
      mapVariableDTO2DbEntityStub.onSecondCall().returns([3, 4])

      const r = FDCS.mapIndependentAndExogenousVariableDTO2Entity(
        42,
        testIndependentVariablesInput,
        testExogenousVariablesInput)

      r.should.eql([1, 2, 3, 4])
      mapVariableDTO2DbEntityStub.callCount.should.equal(2)
      sinon.assert.calledWithExactly(
        mapVariableDTO2DbEntityStub,
        sinon.match.same(testIndependentVariablesInput),
        42,
        1)
      sinon.assert.calledWithExactly(
        mapVariableDTO2DbEntityStub,
        sinon.match.same(testExogenousVariablesInput),
        42,
        2)
    })
  })

  describe('_mapVariablesDTO2LevelsEntity', () => {
    let mapLevelDTO2DbEntityStub

    before(() => {
      mapLevelDTO2DbEntityStub = sinon.stub(FDCS, 'mapLevelDTO2DbEntity')
    })

    beforeEach(() => {
      mapLevelDTO2DbEntityStub.reset()
    })

    after(() => {
      mapLevelDTO2DbEntityStub.restore()
    })

    it('returns empty array when empty array is passed in.', () => {
      const r = FDCS.mapVariablesDTO2LevelsEntity([], [])

      r.should.eql([])
      sinon.assert.notCalled(mapLevelDTO2DbEntityStub)
    })

    it('passes each factor and its id to _mapLevelDTO2DbEntity and flattens results when there are no levels', () => {
      mapLevelDTO2DbEntityStub.returns([])

      const r = FDCS.mapVariablesDTO2LevelsEntity(
        [{ levels: [] }],
        [{ id: 42 }],
      )

      r.should.eql([])
    })

    it('passes each factor and its id to _mapLevelDTO2DbEntity and flattens results when there is a level', () => {
      const levelEntity1 = {}
      mapLevelDTO2DbEntityStub.returns([levelEntity1])

      const r = FDCS.mapVariablesDTO2LevelsEntity(
        [{ levels: ['level1'] }],
        [{ id: 42 }],
      )

      r[0].should.equal(levelEntity1)
      mapLevelDTO2DbEntityStub.callCount.should.equal(1)
      sinon.assert.calledWithExactly(mapLevelDTO2DbEntityStub, ['level1'], 42)
    })

    it('passes each factor and its id to _mapLevelDTO2DbEntity and flattens results when there are multiple levels', () => {
      const levelEntity1 = {}
      const levelEntity2 = {}
      mapLevelDTO2DbEntityStub.returns([levelEntity1, levelEntity2])

      const r = FDCS.mapVariablesDTO2LevelsEntity(
        [{ levels: ['level1', 'level2'] }],
        [{ id: 42 }],
      )

      r[0].should.equal(levelEntity1)
      r[1].should.equal(levelEntity2)
      mapLevelDTO2DbEntityStub.callCount.should.equal(1)
      sinon.assert.calledWithExactly(mapLevelDTO2DbEntityStub, ['level1', 'level2'], 42)
    })

    it('passes each factor and its id to _mapLevelDTO2DbEntity and flattens results when there are multiple levels and multiple factors', () => {
      const levelEntity1 = {}
      const levelEntity2 = {}
      const levelEntity3 = {}
      const levelEntity4 = {}
      mapLevelDTO2DbEntityStub.returns([levelEntity1, levelEntity2, levelEntity3, levelEntity4])

      const r = FDCS.mapVariablesDTO2LevelsEntity(
        [
          { levels: ['level1', 'level2'] },
          { levels: ['level3', 'level4'] },
        ],
        [{ id: 42 }, { id: 7 }],
      )

      r[0].should.equal(levelEntity1)
      r[1].should.equal(levelEntity2)
      r[2].should.equal(levelEntity3)
      r[3].should.equal(levelEntity4)
      mapLevelDTO2DbEntityStub.callCount.should.equal(2)
      sinon.assert.calledWithExactly(mapLevelDTO2DbEntityStub, ['level1', 'level2'], 42)
      sinon.assert.calledWithExactly(mapLevelDTO2DbEntityStub, ['level3', 'level4'], 7)
    })
  })

  describe('_persistVariablesWithLevels', () => {
    let mapVariablesDTO2LevelsEntityStub

    before(() => {
      mapVariablesDTO2LevelsEntityStub = sinon.stub(FDCS, 'mapVariablesDTO2LevelsEntity')
    })

    beforeEach(() => {
      mapVariablesDTO2LevelsEntityStub.reset()
    })

    after(() => {
      mapVariablesDTO2LevelsEntityStub.restore()
    })

    it('does not call batch create factors when there are none to create', () => {
      deleteFactorsForExperimentIdStub.resolves()

      return fdcs.persistVariablesWithLevels(42, [], testContext, testTx).then(() => {
        sinon.assert.calledWithExactly(
          deleteFactorsForExperimentIdStub,
          42,
          sinon.match.same(testTx),
        )
        sinon.assert.notCalled(batchCreateFactorsStub)
        sinon.assert.notCalled(batchCreateLevelsStub)
        sinon.assert.notCalled(mapVariablesDTO2LevelsEntityStub)
      })
    })

    it('does not call batch create levels when there are none to create', () => {
      const factors = [{}]
      const ids = []
      deleteFactorsForExperimentIdStub.resolves()
      batchCreateFactorsStub.resolves(ids)
      const levelEntities = []
      mapVariablesDTO2LevelsEntityStub.returns(levelEntities)

      return fdcs.persistVariablesWithLevels(42, factors, testContext, testTx).then(() => {
        sinon.assert.calledWithExactly(
          deleteFactorsForExperimentIdStub,
          42,
          sinon.match.same(testTx),
        )
        sinon.assert.calledWithExactly(
          batchCreateFactorsStub,
          sinon.match.same(factors),
          sinon.match.same(testContext),
          sinon.match.same(testTx))
        sinon.assert.calledWithExactly(
          mapVariablesDTO2LevelsEntityStub,
          sinon.match.same(factors),
          sinon.match.same(ids))
        sinon.assert.notCalled(batchCreateLevelsStub)
      })
    })

    it('returns rejected promise when call to deleteFactorsForExperimentId fails', () => {
      deleteFactorsForExperimentIdStub.rejects(testError)

      return fdcs.persistVariablesWithLevels(42, [], testContext, testTx).should.be.rejected.then((err) => {
        err.should.equal(testError)
        sinon.assert.calledWithExactly(
          deleteFactorsForExperimentIdStub,
          42,
          sinon.match.same(testTx))
        sinon.assert.notCalled(batchCreateFactorsStub)
        sinon.assert.notCalled(batchCreateLevelsStub)
        sinon.assert.notCalled(mapVariablesDTO2LevelsEntityStub)
      })
    })

    it('returns rejected promise when call to batchCreateFactors fails', () => {
      const testVariables = [{}]
      deleteFactorsForExperimentIdStub.resolves()
      batchCreateFactorsStub.rejects(testError)

      return fdcs.persistVariablesWithLevels(42, testVariables, testContext, testTx).should.be.rejected.then((err) => {
        err.should.equal(testError)
        sinon.assert.calledWithExactly(
          deleteFactorsForExperimentIdStub,
          42,
          sinon.match.same(testTx))
        sinon.assert.calledWithExactly(
          batchCreateFactorsStub,
          sinon.match.same(testVariables),
          sinon.match.same(testContext),
          sinon.match.same(testTx))
        sinon.assert.notCalled(batchCreateLevelsStub)
        sinon.assert.notCalled(mapVariablesDTO2LevelsEntityStub)
      })
    })

    it('returns rejected promise when call to batchCreateFactorLevels fails', () => {
      const testVariables = [{}]
      const newFactorIds = [{}]
      const levelEntities = [{}]
      deleteFactorsForExperimentIdStub.resolves()
      batchCreateFactorsStub.resolves(newFactorIds)
      batchCreateLevelsStub.rejects(testError)
      mapVariablesDTO2LevelsEntityStub.returns(levelEntities)

      return fdcs.persistVariablesWithLevels(42, testVariables, testContext, testTx).should.be.rejected.then((err) => {
        err.should.equal(testError)
        sinon.assert.calledWithExactly(
          deleteFactorsForExperimentIdStub,
          42,
          sinon.match.same(testTx))
        sinon.assert.calledWithExactly(
          batchCreateFactorsStub,
          sinon.match.same(testVariables),
          sinon.match.same(testContext),
          sinon.match.same(testTx))
        sinon.assert.calledWithExactly(
          mapVariablesDTO2LevelsEntityStub,
          sinon.match.same(testVariables),
          sinon.match.same(newFactorIds))
        sinon.assert.calledWithExactly(
          batchCreateLevelsStub,
          sinon.match.same(levelEntities),
          sinon.match.same(testContext),
          sinon.match.same(testTx))
      })
    })

    it('returns resolved promise when call to all calls succeed', () => {
      const testVariables = [{}]
      const newFactorIds = {}
      const levelEntities = [{}]
      deleteFactorsForExperimentIdStub.resolves()
      batchCreateFactorsStub.resolves(newFactorIds)
      batchCreateLevelsStub.resolves(testResponse)
      mapVariablesDTO2LevelsEntityStub.returns(levelEntities)

      return fdcs.persistVariablesWithLevels(42, testVariables, testContext, testTx).then((r) => {
        r.should.equal(testResponse)
        sinon.assert.calledWithExactly(
          deleteFactorsForExperimentIdStub,
          42,
          sinon.match.same(testTx))
        sinon.assert.calledWithExactly(
          batchCreateFactorsStub,
          sinon.match.same(testVariables),
          sinon.match.same(testContext),
          sinon.match.same(testTx))
        sinon.assert.calledWithExactly(
          mapVariablesDTO2LevelsEntityStub,
          sinon.match.same(testVariables),
          sinon.match.same(newFactorIds))
        sinon.assert.calledWithExactly(
          batchCreateLevelsStub,
          sinon.match.same(levelEntities),
          sinon.match.same(testContext),
          sinon.match.same(testTx))
      })
    })
  })

  describe('_persistVariablesWithoutLevels', () => {
    it('resolves and does not call batchCreateDependentVariables when there are none to create.', () => {
      const testVariables = []
      deleteDependentVariablesForExperimentIdStub.resolves()

      return fdcs.persistVariablesWithoutLevels(42, testVariables, testContext, testTx).then((r) => {
        sinon.assert.calledWithExactly(
          deleteDependentVariablesForExperimentIdStub,
          42,
          sinon.match.same(testTx),
        )
        sinon.assert.notCalled(batchCreateDependentVariablesStub)
      })
    })

    it('returns rejected promise when deleteDependentVariablesForExperimentId fails', () => {
      const testVariables = [{}]
      deleteDependentVariablesForExperimentIdStub.rejects(testError)

      return fdcs.persistVariablesWithoutLevels(42, testVariables, testContext, testTx).should.be.rejected.then((err) => {
        err.should.equal(testError)
        sinon.assert.calledWithExactly(
          deleteDependentVariablesForExperimentIdStub,
          42,
          sinon.match.same(testTx),
        )
        sinon.assert.notCalled(batchCreateDependentVariablesStub)
      })
    })

    it('returns rejected promise when batchCreateDependentVariables fails', () => {
      const testVariables = [{}]
      deleteDependentVariablesForExperimentIdStub.resolves()
      batchCreateDependentVariablesStub.rejects(testError)

      return fdcs.persistVariablesWithoutLevels(42, testVariables, testContext, testTx).should.be.rejected.then((err) => {
        err.should.equal(testError)
        sinon.assert.calledWithExactly(
          deleteDependentVariablesForExperimentIdStub,
          42,
          sinon.match.same(testTx),
        )
        sinon.assert.calledWithExactly(
          batchCreateDependentVariablesStub,
          sinon.match.same(testVariables),
          sinon.match.same(testContext),
          sinon.match.same(testTx))
      })
    })

    it('returns resolved promise when all calls succeed', () => {
      const testVariables = [{}]
      deleteDependentVariablesForExperimentIdStub.resolves()
      batchCreateDependentVariablesStub.resolves(testResponse)

      return fdcs.persistVariablesWithoutLevels(42, testVariables, testContext, testTx).then((r) => {
        r.should.equal(testResponse)
        sinon.assert.calledWithExactly(
          deleteDependentVariablesForExperimentIdStub,
          42,
          sinon.match.same(testTx),
        )
        sinon.assert.calledWithExactly(
          batchCreateDependentVariablesStub,
          sinon.match.same(testVariables),
          sinon.match.same(testContext),
          sinon.match.same(testTx))
      })
    })
  })

  describe('_persistVariables', () => {
    const testIndependentAndExogenousVariables = {}
    const testDependentVariables = {}

    let _persistVariablesWithLevelsStub
    let _persistVariablesWithoutLevelsStub

    before(() => {
      _persistVariablesWithLevelsStub = sinon.stub(fdcs, 'persistVariablesWithLevels')
      _persistVariablesWithoutLevelsStub = sinon.stub(fdcs, 'persistVariablesWithoutLevels')
    })

    beforeEach(() => {
      _persistVariablesWithLevelsStub.reset()
      _persistVariablesWithoutLevelsStub.reset()
    })

    after(() => {
      _persistVariablesWithLevelsStub.restore()
      _persistVariablesWithoutLevelsStub.restore()
    })

    it('returns rejected promise when _persistVariablesWithLevels fails', () => {
      _persistVariablesWithLevelsStub.rejects()

      return fdcs.persistVariables(42, testIndependentAndExogenousVariables, testDependentVariables, testContext, testTx).should.be.rejected.then((err) => {
        sinon.assert.calledWithExactly(
          _persistVariablesWithLevelsStub,
          42,
          sinon.match.same(testIndependentAndExogenousVariables),
          sinon.match.same(testContext),
          sinon.match.same(testTx),
        )
        sinon.assert.notCalled(_persistVariablesWithoutLevelsStub)
      })
    })

    it('returns rejected promise when _persistVariablesWithoutLevels fails', () => {
      _persistVariablesWithLevelsStub.resolves()
      _persistVariablesWithoutLevelsStub.rejects()

      return fdcs.persistVariables(42, testIndependentAndExogenousVariables, testDependentVariables, testContext, testTx).should.be.rejected.then((err) => {
        sinon.assert.calledWithExactly(
          _persistVariablesWithLevelsStub,
          42,
          sinon.match.same(testIndependentAndExogenousVariables),
          sinon.match.same(testContext),
          sinon.match.same(testTx),
        )
        sinon.assert.calledWithExactly(
          _persistVariablesWithoutLevelsStub,
          42,
          sinon.match.same(testDependentVariables),
          sinon.match.same(testContext),
          sinon.match.same(testTx),
        )
      })
    })

    it('returns resolved promise when calls succeed', () => {
      _persistVariablesWithLevelsStub.resolves()
      _persistVariablesWithoutLevelsStub.resolves()

      return fdcs.persistVariables(42, testIndependentAndExogenousVariables, testDependentVariables, testContext, testTx).then(() => {
        sinon.assert.calledWithExactly(
          _persistVariablesWithLevelsStub,
          42,
          sinon.match.same(testIndependentAndExogenousVariables),
          sinon.match.same(testContext),
          sinon.match.same(testTx),
        )
        sinon.assert.calledWithExactly(
          _persistVariablesWithoutLevelsStub,
          42,
          sinon.match.same(testDependentVariables),
          sinon.match.same(testContext),
          sinon.match.same(testTx),
        )
      })
    })
  })

  describe('persistAllVariables', () => {
    let testVariables = {
      experimentId: 42,
      independent: {},
      exogenous: {},
      dependent: {},
    }
    let independentAndExogenousEntities = {}
    let dependentEntities = {}
    let persistVariablesStub
    let mapIndependentAndExogenousVariableDTO2EntityStub
    let mapDependentVariableDTO2DbEntityStub
    let createPostResponseStub
    let validateStub

    before(() => {
      persistVariablesStub = sinon.stub(fdcs, 'persistVariables')
      mapIndependentAndExogenousVariableDTO2EntityStub = sinon.stub(FDCS, 'mapIndependentAndExogenousVariableDTO2Entity')
      mapDependentVariableDTO2DbEntityStub = sinon.stub(FDCS, 'mapDependentVariableDTO2DbEntity')
      createPostResponseStub = sinon.stub(AppUtil, 'createPostResponse')
      validateStub = sinon.stub(fdcs.variablesValidator, 'validate')

      mapIndependentAndExogenousVariableDTO2EntityStub.returns(independentAndExogenousEntities)
      mapDependentVariableDTO2DbEntityStub.returns(dependentEntities)
    })

    beforeEach(() => {
      persistVariablesStub.reset()
      mapIndependentAndExogenousVariableDTO2EntityStub.reset()
      mapDependentVariableDTO2DbEntityStub.reset()
      createPostResponseStub.reset()
      validateStub.reset()
    })

    after(() => {
      persistVariablesStub.restore()
      mapIndependentAndExogenousVariableDTO2EntityStub.restore()
      mapDependentVariableDTO2DbEntityStub.restore()
      createPostResponseStub.restore()
      validateStub.restore()
    })

    it('returns rejected promise when validate fails', () => {
      const testVariables = { experimentId: 42 }
      validateStub.rejects(testError)
      return fdcs.persistAllVariables(testVariables, testContext, testTx).should.be.rejected.then((err) => {
        err.should.equal(testError)
        sinon.assert.calledWithExactly(
          validateStub,
          sinon.match.same(testVariables),
          'POST',
          sinon.match.same(testTx),
        )
        sinon.assert.notCalled(mapIndependentAndExogenousVariableDTO2EntityStub)
        sinon.assert.notCalled(mapDependentVariableDTO2DbEntityStub)
        sinon.assert.notCalled(persistVariablesStub)
        sinon.assert.notCalled(createPostResponseStub)
      })
    })

    it('returns rejected promise when persistVariables fails', () => {
      const testVariables = { experimentId: 42 }
      validateStub.resolves()
      persistVariablesStub.rejects(testError)
      return fdcs.persistAllVariables(testVariables, testContext, testTx).should.be.rejected.then((err) => {
        err.should.equal(testError)
        sinon.assert.calledWithExactly(
          validateStub,
          sinon.match.same(testVariables),
          'POST',
          sinon.match.same(testTx),
        )
        sinon.assert.calledWithExactly(
          mapIndependentAndExogenousVariableDTO2EntityStub,
          42,
          sinon.match.same(testVariables.independent),
          sinon.match.same(testVariables.exogenous),
        )
        sinon.assert.calledWithExactly(
          mapDependentVariableDTO2DbEntityStub,
          sinon.match.same(testVariables.dependent),
          42,
        )
        sinon.assert.calledWithExactly(
          persistVariablesStub,
          42,
          sinon.match.same(independentAndExogenousEntities),
          sinon.match.same(dependentEntities),
          sinon.match.same(testContext),
          sinon.match.same(testTx),
        )
        sinon.assert.notCalled(createPostResponseStub)
      })
    })

    it('returns post response when call succeeds', () => {
      const testVariables = { experimentId: 42 }
      validateStub.resolves()
      persistVariablesStub.resolves()
      createPostResponseStub.returns(testResponse)

      return fdcs.persistAllVariables(testVariables, testContext, testTx).then((r) => {
        r.should.equal(testResponse)
        sinon.assert.calledWithExactly(
          validateStub,
          sinon.match.same(testVariables),
          'POST',
          sinon.match.same(testTx),
        )
        sinon.assert.calledWithExactly(
          mapIndependentAndExogenousVariableDTO2EntityStub,
          42,
          sinon.match.same(testVariables.independent),
          sinon.match.same(testVariables.exogenous),
        )
        sinon.assert.calledWithExactly(
          mapDependentVariableDTO2DbEntityStub,
          sinon.match.same(testVariables.dependent),
          42,
        )
        sinon.assert.calledWithExactly(
          persistVariablesStub,
          42,
          sinon.match.same(independentAndExogenousEntities),
          sinon.match.same(dependentEntities),
          sinon.match.same(testContext),
          sinon.match.same(testTx),
        )
        sinon.assert.calledWithExactly(
          createPostResponseStub,
          [{ id: 42 }],
        )
      })
    })
  })
})