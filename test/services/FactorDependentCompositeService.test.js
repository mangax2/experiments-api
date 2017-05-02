import { mock, mockReject, mockResolve } from '../jestUtil'
import AppUtil from '../../src/services/utility/AppUtil'
import FactorDependentCompositeService from '../../src/services/FactorDependentCompositeService'

describe('FactorDependentCompositeService', () => {
  let target
  const testContext = {}
  const testTx = { tx: {} }

  beforeEach(() => {
    target = new FactorDependentCompositeService()
  })

  describe('getFactorsWithLevels', () => {
    it('returns factors and levels object', () => {
      target.getFactors = mockResolve([{}])
      target.getFactorLevels = mockResolve([{}, {}])

      return target.getFactorsWithLevels(1).then((data) => {
        expect(target.getFactors).toHaveBeenCalledWith(1)
        expect(target.getFactorLevels).toHaveBeenCalledWith([{}])
        expect(data).toEqual({ factors: [{}], levels: [{}, {}] })
      })
    })

    it('rejects when getFactorLevels fails', () => {
      target.getFactors = mockResolve([{}])
      target.getFactorLevels = mockReject('error')

      return target.getFactorsWithLevels(1).then(() => {}, (err) => {
        expect(target.getFactors).toHaveBeenCalledWith(1)
        expect(target.getFactorLevels).toHaveBeenCalledWith([{}])
        expect(err).toEqual('error')
      })
    })

    it('rejects when getFactors fails', () => {
      target.getFactors = mockReject('error')
      target.getFactorLevels = mock()

      return target.getFactorsWithLevels(1).then(() => {}, (err) => {
        expect(target.getFactors).toHaveBeenCalledWith(1)
        expect(target.getFactorLevels).not.toHaveBeenCalled()
        expect(err).toEqual('error')
      })
    })
  })

  describe('getFactors', () => {
    it('returns data from factorService', () => {
      target.factorService.getFactorsByExperimentId = mockResolve([{}])

      return target.getFactors(1).then((data) => {
        expect(data).toEqual([{}])
        expect(target.factorService.getFactorsByExperimentId).toHaveBeenCalledWith(1)
      })
    })
  })

  describe('getFactorLevels', () => {
    it('calls getFactorLevelsByFactorId multiple times', () => {
      target.factorLevelService.getFactorLevelsByFactorId = mockResolve({})

      return target.getFactorLevels([{ id: 1 }, { id: 2 }]).then((data) => {
        expect(target.factorLevelService.getFactorLevelsByFactorId).toHaveBeenCalledTimes(2)
        expect(target.factorLevelService.getFactorLevelsByFactorId.mock.calls).toEqual([[1], [2]])
        expect(data).toEqual([{}, {}])
      })
    })
  })

  describe('getAllVariablesByExperimentId', () => {
    it('returns all variables with their levels', () => {
      const factorsWithLevels = {
        factors: [{
          id: 1,
          name: 'testFactor',
          tier: undefined,
          ref_data_source_id: 1,
          ref_factor_type_id: 1,
        }],
        levels: [{ id: 1, value: 'testValue1', factor_id: 1 }, {
          id: 2,
          value: 'testValue2',
          factor_id: 1,
        }],
      }
      target.getFactorsWithLevels = mockResolve(factorsWithLevels)
      const factorTypes = [{ id: 1, type: 'independent' }]
      target.factorTypeService.getAllFactorTypes = mockResolve(factorTypes)
      const dependentVariables = [{ name: 'testDependent', required: true,question_code:"ABC_GDEG" }]
      target.dependentVariableService.getDependentVariablesByExperimentId = mockResolve(dependentVariables)
      const expectedReturn = {
        independent: [{
          name: 'testFactor',
          levels: ['testValue1', 'testValue2'],
          tier: undefined,
          refDataSourceId: 1,
        }],
        exogenous: [],
        dependent: [{ name: 'testDependent', required: true , questionCode:"ABC_GDEG"}],
      }

      return target.getAllVariablesByExperimentId(1).then((data) => {
        expect(target.getFactorsWithLevels).toHaveBeenCalledWith(1)
        expect(target.factorTypeService.getAllFactorTypes).toHaveBeenCalled()
        expect(target.dependentVariableService.getDependentVariablesByExperimentId).toHaveBeenCalledWith(1)

        expect(data).toEqual(expectedReturn)
      })
    })

    it('rejects when a call fails in the Promise all', () => {
      target.getFactorsWithLevels = mockResolve()
      target.factorTypeService.getAllFactorTypes = mockResolve()
      target.dependentVariableService.getDependentVariablesByExperimentId = mockReject('error')

      return target.getAllVariablesByExperimentId(1).then(() => {}, (err) => {
        expect(target.getFactorsWithLevels).toHaveBeenCalledWith(1)
        expect(target.factorTypeService.getAllFactorTypes).toHaveBeenCalled()
        expect(target.dependentVariableService.getDependentVariablesByExperimentId).toHaveBeenCalledWith(1)
        expect(err).toEqual('error')
      })
    })
  })

  describe('get INDEPENDENT_VARIABLE_TYPE_ID', () => {
    it('returns type id for independent variable', () => {
      expect(FactorDependentCompositeService.INDEPENDENT_VARIABLE_TYPE_ID).toEqual(1)
    })
  })

  describe('get EXOGENOUS_VARIABLE_TYPE_ID', () => {
    it('returns type id for exogenous variable', () => {
      expect(FactorDependentCompositeService.EXOGENOUS_VARIABLE_TYPE_ID).toEqual(2)
    })
  })

  describe('mapVariableDTO2DbEntity', () => {
    it('returns an empty array when variables are undefined, null, or empty', () => {
      expect(FactorDependentCompositeService.mapVariableDTO2DbEntity(undefined, 1, 1)).toEqual([])
      expect(FactorDependentCompositeService.mapVariableDTO2DbEntity(null, 1, 1)).toEqual([])
      expect(FactorDependentCompositeService.mapVariableDTO2DbEntity([], 1, 1)).toEqual([])
    })

    it('maps variables to database object entity', () => {
      const variables = [{}, {}]
      expect(FactorDependentCompositeService.mapVariableDTO2DbEntity(variables, 1, 1)).toEqual([{
        refFactorTypeId: 1,
        experimentId: 1,
      }, { refFactorTypeId: 1, experimentId: 1 }])
    })
  })

  describe('mapLevelDTO2DbEntity', () => {
    it('returns empty array when levels are undefined, null, or empty', () => {
      expect(FactorDependentCompositeService.mapLevelDTO2DbEntity(undefined, 1)).toEqual([])
      expect(FactorDependentCompositeService.mapLevelDTO2DbEntity(null, 1)).toEqual([])
      expect(FactorDependentCompositeService.mapLevelDTO2DbEntity([], 1)).toEqual([])
    })

    it('returns mapped levels to db entities', () => {
      expect(FactorDependentCompositeService.mapLevelDTO2DbEntity(['testValue', 'testValue2'], 1)).toEqual([{
        value: 'testValue',
        factorId: 1,
      }, { value: 'testValue2', factorId: 1 }])
    })
  })

  describe('mapDependentVariableDTO2DbEntity', () => {
    it('returns empty array when dependentVariables is undefined, null, or empty', () => {
      expect(FactorDependentCompositeService.mapDependentVariableDTO2DbEntity(undefined, 1)).toEqual([])
      expect(FactorDependentCompositeService.mapDependentVariableDTO2DbEntity(null, 1)).toEqual([])
      expect(FactorDependentCompositeService.mapDependentVariableDTO2DbEntity([], 1)).toEqual([])
    })

    it('maps dependent variables to db entities', () => {
      expect(FactorDependentCompositeService.mapDependentVariableDTO2DbEntity([{ name: 'testDependent' }, { name: 'testDependent2' }], 1)).toEqual([{
        name: 'testDependent',
        experimentId: 1,
      }, { name: 'testDependent2', experimentId: 1 }])
    })
  })

  describe('mapIndependentAndExogenousVariableDTO2Entity', () => {
    it('maps independent and exogenous variables to DB entities and concats them together', () => {
      FactorDependentCompositeService.mapVariableDTO2DbEntity = mock([{}])

      const result = FactorDependentCompositeService.mapIndependentAndExogenousVariableDTO2Entity(1, [{}], [{}])
      expect(FactorDependentCompositeService.mapVariableDTO2DbEntity).toHaveBeenCalledTimes(2)
      expect(result).toEqual([{}, {}])
      expect(FactorDependentCompositeService.mapVariableDTO2DbEntity.mock.calls[0]).toEqual([[{}], 1, 1])
      expect(FactorDependentCompositeService.mapVariableDTO2DbEntity.mock.calls[1]).toEqual([[{}], 1, 2])
    })
  })

  describe('mapVariablesDTO2LevelsEntity', () => {
    it('returns levels with factorIds', () => {
      FactorDependentCompositeService.mapLevelDTO2DbEntity = mock((factorLevels, id) => [{ factorId: id }])

      const result = FactorDependentCompositeService.mapVariablesDTO2LevelsEntity([{ levels: [{}] }, { levels: [{}] }], [{ id: 1 }, { id: 2 }])

      expect(result).toEqual([{ factorId: 1 }, { factorId: 2 }])
    })

    it('returns an empty array when variables are empty', () => {
      expect(FactorDependentCompositeService.mapVariablesDTO2LevelsEntity([], [])).toEqual([])
    })
  })

  describe('persistVariablesWithLevels', () => {
    it('deletes factors, batchCreates factors, and batchCreates levels', () => {
      target.factorService.deleteFactorsForExperimentId = mockResolve()
      target.factorService.batchCreateFactors = mockResolve([1, 2])
      FactorDependentCompositeService.mapVariablesDTO2LevelsEntity = mock([{}])
      target.factorLevelService.batchCreateFactorLevels = mockResolve()

      return target.persistVariablesWithLevels(1, [{}, {}], testContext, testTx).then(() => {
        expect(target.factorService.deleteFactorsForExperimentId).toHaveBeenCalledWith(1, testTx)
        expect(target.factorService.batchCreateFactors).toHaveBeenCalledWith([{}, {}], testContext, testTx)
        expect(FactorDependentCompositeService.mapVariablesDTO2LevelsEntity).toHaveBeenCalledWith([{}, {}], [1, 2])
        expect(target.factorLevelService.batchCreateFactorLevels).toHaveBeenCalledWith([{}], testContext, testTx)
      })
    })

    it('deletes factors, batchCreates, but does not create levels', () => {
      target.factorService.deleteFactorsForExperimentId = mockResolve()
      target.factorService.batchCreateFactors = mockResolve([1, 2])
      FactorDependentCompositeService.mapVariablesDTO2LevelsEntity = mock([])
      target.factorLevelService.batchCreateFactorLevels = mock()

      return target.persistVariablesWithLevels(1, [{}, {}], testContext, testTx).then(() => {
        expect(target.factorService.deleteFactorsForExperimentId).toHaveBeenCalledWith(1, testTx)
        expect(target.factorService.batchCreateFactors).toHaveBeenCalledWith([{}, {}], testContext, testTx)
        expect(FactorDependentCompositeService.mapVariablesDTO2LevelsEntity).toHaveBeenCalledWith([{}, {}], [1, 2])
        expect(target.factorLevelService.batchCreateFactorLevels).not.toHaveBeenCalled()
      })
    })

    it('deletes factors only', () => {
      target.factorService.deleteFactorsForExperimentId = mockResolve()
      target.factorService.batchCreateFactors = mock()
      FactorDependentCompositeService.mapVariablesDTO2LevelsEntity = mock()
      target.factorLevelService.batchCreateFactorLevels = mock()

      return target.persistVariablesWithLevels(1, [], testContext, testTx).then(() => {
        expect(target.factorService.deleteFactorsForExperimentId).toHaveBeenCalledWith(1, testTx)
        expect(target.factorService.batchCreateFactors).not.toHaveBeenCalled()
        expect(FactorDependentCompositeService.mapVariablesDTO2LevelsEntity).not.toHaveBeenCalled()
        expect(target.factorLevelService.batchCreateFactorLevels).not.toHaveBeenCalled()
      })
    })

    it('rejects when batchCreateFactorLevels fails', () => {
      target.factorService.deleteFactorsForExperimentId = mockResolve()
      target.factorService.batchCreateFactors = mockResolve([1, 2])
      FactorDependentCompositeService.mapVariablesDTO2LevelsEntity = mock([{}])
      target.factorLevelService.batchCreateFactorLevels = mockReject('error')

      return target.persistVariablesWithLevels(1, [{}, {}], testContext, testTx).then(() => {}, (err) => {
        expect(target.factorService.deleteFactorsForExperimentId).toHaveBeenCalledWith(1, testTx)
        expect(target.factorService.batchCreateFactors).toHaveBeenCalledWith([{}, {}], testContext, testTx)
        expect(FactorDependentCompositeService.mapVariablesDTO2LevelsEntity).toHaveBeenCalledWith([{}, {}], [1, 2])
        expect(target.factorLevelService.batchCreateFactorLevels).toHaveBeenCalledWith([{}], testContext, testTx)
        expect(err).toEqual('error')
      })
    })

    it('rejects when batchCreateFactors fails', () => {
      target.factorService.deleteFactorsForExperimentId = mockResolve()
      target.factorService.batchCreateFactors = mockReject('error')
      FactorDependentCompositeService.mapVariablesDTO2LevelsEntity = mock()
      target.factorLevelService.batchCreateFactorLevels = mock()

      return target.persistVariablesWithLevels(1, [{}, {}], testContext, testTx).then(() => {}, (err) => {
        expect(target.factorService.deleteFactorsForExperimentId).toHaveBeenCalledWith(1, testTx)
        expect(target.factorService.batchCreateFactors).toHaveBeenCalledWith([{}, {}], testContext, testTx)
        expect(FactorDependentCompositeService.mapVariablesDTO2LevelsEntity).not.toHaveBeenCalled()
        expect(target.factorLevelService.batchCreateFactorLevels).not.toHaveBeenCalled()
        expect(err).toEqual('error')
      })
    })

    it('rejects when deleteFactorsForExperimentId fails', () => {
      target.factorService.deleteFactorsForExperimentId = mockReject('error')
      target.factorService.batchCreateFactors = mock()
      FactorDependentCompositeService.mapVariablesDTO2LevelsEntity = mock()
      target.factorLevelService.batchCreateFactorLevels = mock()

      return target.persistVariablesWithLevels(1, [{}, {}], testContext, testTx).then(() => {}, (err) => {
        expect(target.factorService.deleteFactorsForExperimentId).toHaveBeenCalledWith(1, testTx)
        expect(target.factorService.batchCreateFactors).not.toHaveBeenCalled()
        expect(FactorDependentCompositeService.mapVariablesDTO2LevelsEntity).not.toHaveBeenCalled()
        expect(target.factorLevelService.batchCreateFactorLevels).not.toHaveBeenCalled()
        expect(err).toEqual('error')
      })
    })
  })

  describe('persistVariablesWithoutLevels', () => {
    it('deletes and creates dependent variables', () => {
      target.dependentVariableService.deleteDependentVariablesForExperimentId = mockResolve()
      target.dependentVariableService.batchCreateDependentVariables = mockResolve()

      return target.persistVariablesWithoutLevels(1, [{}], testContext, testTx).then(() => {
        expect(target.dependentVariableService.deleteDependentVariablesForExperimentId).toHaveBeenCalledWith(1, testTx)
        expect(target.dependentVariableService.batchCreateDependentVariables).toHaveBeenCalledWith([{}], testContext, testTx)
      })
    })

    it('deletes dependent variables, but does not create new ones', () => {
      target.dependentVariableService.deleteDependentVariablesForExperimentId = mockResolve()
      target.dependentVariableService.batchCreateDependentVariables = mock()

      return target.persistVariablesWithoutLevels(1, [], testContext, testTx).then(() => {
        expect(target.dependentVariableService.deleteDependentVariablesForExperimentId).toHaveBeenCalledWith(1, testTx)
        expect(target.dependentVariableService.batchCreateDependentVariables).not.toHaveBeenCalled()
      })
    })

    it('rejects when batchCreateDependentVariables fails', () => {
      target.dependentVariableService.deleteDependentVariablesForExperimentId = mockResolve()
      target.dependentVariableService.batchCreateDependentVariables = mockReject('error')

      return target.persistVariablesWithoutLevels(1, [{}], testContext, testTx).then(() => {}, (err) => {
        expect(target.dependentVariableService.deleteDependentVariablesForExperimentId).toHaveBeenCalledWith(1, testTx)
        expect(target.dependentVariableService.batchCreateDependentVariables).toHaveBeenCalledWith([{}], testContext, testTx)
        expect(err).toEqual('error')
      })
    })

    it('rejects when deleteDependentVariablesForExperimentId fails', () => {
      target.dependentVariableService.deleteDependentVariablesForExperimentId = mockReject('error')
      target.dependentVariableService.batchCreateDependentVariables = mock()

      return target.persistVariablesWithoutLevels(1, [{}], testContext, testTx).then(() => {}, (err) => {
        expect(target.dependentVariableService.deleteDependentVariablesForExperimentId).toHaveBeenCalledWith(1, testTx)
        expect(target.dependentVariableService.batchCreateDependentVariables).not.toHaveBeenCalled()
        expect(err).toEqual('error')
      })
    })
  })

  describe('persistVariables', () => {
    it('calls persistVariablesWithLevels and persistVariablesWithoutLevels', () => {
      target.persistVariablesWithLevels = mockResolve()
      target.persistVariablesWithoutLevels = mockResolve()

      return target.persistVariables(1, [{}], [{}], testContext, testTx).then(() => {
        expect(target.persistVariablesWithLevels).toHaveBeenCalledWith(1, [{}], testContext, testTx)
        expect(target.persistVariablesWithoutLevels).toHaveBeenCalledWith(1, [{}], testContext, testTx)
      })
    })

    it('rejects when persistVariablesWithoutLevels fails', () => {
      target.persistVariablesWithLevels = mockResolve()
      target.persistVariablesWithoutLevels = mockReject('error')

      return target.persistVariables(1, [{}], [{}], testContext, testTx).then(() => {}, (err) => {
        expect(target.persistVariablesWithLevels).toHaveBeenCalledWith(1, [{}], testContext, testTx)
        expect(target.persistVariablesWithoutLevels).toHaveBeenCalledWith(1, [{}], testContext, testTx)
        expect(err).toEqual('error')
      })
    })

    it('rejects when persistVariablesWithLevels fails', () => {
      target.persistVariablesWithLevels = mockReject('error')
      target.persistVariablesWithoutLevels = mock()

      return target.persistVariables(1, [{}], [{}], testContext, testTx).then(() => {}, (err) => {
        expect(target.persistVariablesWithLevels).toHaveBeenCalledWith(1, [{}], testContext, testTx)
        expect(target.persistVariablesWithoutLevels).not.toHaveBeenCalled()
        expect(err).toEqual('error')
      })
    })
  })

  describe('persistAllVariables', () => {
    it('validates, persists variables, and returns response', () => {
      target.variablesValidator.validate = mockResolve()
      target.persistVariables = mockResolve()
      AppUtil.createPostResponse = mock()
      FactorDependentCompositeService.mapIndependentAndExogenousVariableDTO2Entity = mock([{}])
      FactorDependentCompositeService.mapDependentVariableDTO2DbEntity = mock([{}, {}])
      const experimentVariables = {
        independent: [{}],
        exogenous: [],
        dependent: [{}, {}],
        experimentId: 1,
      }

      return target.persistAllVariables(experimentVariables, testContext, testTx).then(() => {
        expect(target.variablesValidator.validate).toHaveBeenCalledWith(experimentVariables, 'POST', testTx)
        expect(target.persistVariables).toHaveBeenCalledWith(1, [{}], [{}, {}], testContext, testTx)
        expect(AppUtil.createPostResponse).toHaveBeenCalledWith([{ id: 1 }])
      })
    })

    it('rejects when persistVariables fails', () => {
      target.variablesValidator.validate = mockResolve()
      target.persistVariables = mockReject('error')
      AppUtil.createPostResponse = mock()
      FactorDependentCompositeService.mapIndependentAndExogenousVariableDTO2Entity = mock([{}])
      FactorDependentCompositeService.mapDependentVariableDTO2DbEntity = mock([{}, {}])
      const experimentVariables = {
        independent: [{}],
        exogenous: [],
        dependent: [{}, {}],
        experimentId: 1,
      }

      return target.persistAllVariables(experimentVariables, testContext, testTx).then(() => {}, (err) => {
        expect(target.variablesValidator.validate).toHaveBeenCalledWith(experimentVariables, 'POST', testTx)
        expect(target.persistVariables).toHaveBeenCalledWith(1, [{}], [{}, {}], testContext, testTx)
        expect(AppUtil.createPostResponse).not.toHaveBeenCalled()
        expect(err).toEqual('error')
      })
    })

    it('rejects when validate fails', () => {
      target.variablesValidator.validate = mockReject('error')
      target.persistVariables = mock()
      AppUtil.createPostResponse = mock()
      FactorDependentCompositeService.mapIndependentAndExogenousVariableDTO2Entity = mock([{}])
      FactorDependentCompositeService.mapDependentVariableDTO2DbEntity = mock([{}, {}])
      const experimentVariables = {
        independent: [{}],
        exogenous: [],
        dependent: [{}, {}],
        experimentId: 1,
      }

      return target.persistAllVariables(experimentVariables, testContext, testTx).then(() => {}, (err) => {
        expect(target.variablesValidator.validate).toHaveBeenCalledWith(experimentVariables, 'POST', testTx)
        expect(target.persistVariables).not.toHaveBeenCalled()
        expect(AppUtil.createPostResponse).not.toHaveBeenCalled()
        expect(err).toEqual('error')
      })
    })
  })
})