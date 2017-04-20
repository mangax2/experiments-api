import AppUtil from '../../src/services/utility/AppUtil'
import FactorDependentCompositeService from '../../src/services/FactorDependentCompositeService'

describe('FactorDependentCompositeService', () => {
  const testContext = {}
  const testTx = { tx: {} }

  describe('getFactorsWithLevels', () => {
    it('returns factors and levels object', () => {
      const target = new FactorDependentCompositeService()
      target.getFactors = jest.fn(() => Promise.resolve([{}]))
      target.getFactorLevels = jest.fn(() => Promise.resolve([{}, {}]))

      return target.getFactorsWithLevels(1).then((data) => {
        expect(target.getFactors).toHaveBeenCalledWith(1)
        expect(target.getFactorLevels).toHaveBeenCalledWith([{}])
        expect(data).toEqual({ factors: [{}], levels: [{}, {}] })
      })
    })

    it('rejects when getFactorLevels fails', () => {
      const target = new FactorDependentCompositeService()
      target.getFactors = jest.fn(() => Promise.resolve([{}]))
      target.getFactorLevels = jest.fn(() => Promise.reject())

      return target.getFactorsWithLevels(1).then(() => {}, () => {
        expect(target.getFactors).toHaveBeenCalledWith(1)
        expect(target.getFactorLevels).toHaveBeenCalledWith([{}])
      })
    })

    it('rejects when getFactors fails', () => {
      const target = new FactorDependentCompositeService()
      target.getFactors = jest.fn(() => Promise.reject())
      target.getFactorLevels = jest.fn()

      return target.getFactorsWithLevels(1).then(() => {}, () => {
        expect(target.getFactors).toHaveBeenCalledWith(1)
        expect(target.getFactorLevels).not.toHaveBeenCalled()
      })
    })
  })

  describe('getFactors', () => {
    it('returns data from factorService', () => {
      const target = new FactorDependentCompositeService()
      target.factorService.getFactorsByExperimentId = jest.fn(() => { return Promise.resolve([{}])})

      return target.getFactors(1).then((data) => {
        expect(data).toEqual([{}])
        expect(target.factorService.getFactorsByExperimentId).toHaveBeenCalledWith(1)
      })
    })
  })

  describe('getFactorLevels', () => {
    it('calls getFactorLevelsByFactorId multiple times', () => {
      const target = new FactorDependentCompositeService()
      target.factorLevelService.getFactorLevelsByFactorId = jest.fn(() => Promise.resolve({}))

      return target.getFactorLevels([{ id: 1 }, { id: 2 }]).then((data) => {
        expect(target.factorLevelService.getFactorLevelsByFactorId).toHaveBeenCalledTimes(2)
        expect(target.factorLevelService.getFactorLevelsByFactorId.mock.calls).toEqual([[1], [2]])
        expect(data).toEqual([{}, {}])
      })
    })
  })

  describe('getAllVariablesByExperimentId', () => {
    it('returns all variables with their levels', () => {
      const target = new FactorDependentCompositeService()
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
      target.getFactorsWithLevels = jest.fn(() => Promise.resolve(factorsWithLevels))
      const factorTypes = [{ id: 1, type: 'independent' }]
      target.factorTypeService.getAllFactorTypes = jest.fn(() => Promise.resolve(factorTypes))
      const dependentVariables = [{ name: 'testDependent', required: true }]
      target.dependentVariableService.getDependentVariablesByExperimentId = jest.fn(() => Promise.resolve(dependentVariables))
      const expectedReturn = {
        independent: [{
          name: 'testFactor',
          levels: ['testValue1', 'testValue2'],
          tier: undefined,
          refDataSourceId: 1,
        }],
        exogenous: [],
        dependent: [{ name: 'testDependent', required: true }],
      }

      return target.getAllVariablesByExperimentId(1).then((data) => {
        expect(target.getFactorsWithLevels).toHaveBeenCalledWith(1)
        expect(target.factorTypeService.getAllFactorTypes).toHaveBeenCalled()
        expect(target.dependentVariableService.getDependentVariablesByExperimentId).toHaveBeenCalledWith(1)

        expect(data).toEqual(expectedReturn)
      })
    })

    it('rejects when a call fails in the Promise all', () => {
      const target = new FactorDependentCompositeService()
      target.getFactorsWithLevels = jest.fn(() => Promise.resolve())
      target.factorTypeService.getAllFactorTypes = jest.fn(() => Promise.resolve())
      target.dependentVariableService.getDependentVariablesByExperimentId = jest.fn(() => Promise.reject())

      return target.getAllVariablesByExperimentId(1).then(() => {}, () => {
        expect(target.getFactorsWithLevels).toHaveBeenCalledWith(1)
        expect(target.factorTypeService.getAllFactorTypes).toHaveBeenCalled()
        expect(target.dependentVariableService.getDependentVariablesByExperimentId).toHaveBeenCalledWith(1)
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
      FactorDependentCompositeService.mapVariableDTO2DbEntity = jest.fn(() => [{}])

      const result = FactorDependentCompositeService.mapIndependentAndExogenousVariableDTO2Entity(1, [{}], [{}])
      expect(FactorDependentCompositeService.mapVariableDTO2DbEntity).toHaveBeenCalledTimes(2)
      expect(result).toEqual([{}, {}])
      expect(FactorDependentCompositeService.mapVariableDTO2DbEntity.mock.calls[0]).toEqual([[{}], 1, 1])
      expect(FactorDependentCompositeService.mapVariableDTO2DbEntity.mock.calls[1]).toEqual([[{}], 1, 2])
    })
  })

  describe('mapVariablesDTO2LevelsEntity', () => {
    it('returns levels with factorIds', () => {
      FactorDependentCompositeService.mapLevelDTO2DbEntity = jest.fn((factorLevels, id) => [{ factorId: id }])

      const result = FactorDependentCompositeService.mapVariablesDTO2LevelsEntity([{ levels: [{}] }, { levels: [{}] }], [{ id: 1 }, { id: 2 }])

      expect(result).toEqual([{ factorId: 1 }, { factorId: 2 }])
    })

    it('returns an empty array when variables are empty', () => {
      expect(FactorDependentCompositeService.mapVariablesDTO2LevelsEntity([], [])).toEqual([])
    })
  })

  describe('persistVariablesWithLevels', () => {
    it('deletes factors, batchCreates factors, and batchCreates levels', () => {
      const target = new FactorDependentCompositeService()
      target.factorService.deleteFactorsForExperimentId = jest.fn(() => Promise.resolve())
      target.factorService.batchCreateFactors = jest.fn(() => Promise.resolve([1, 2]))
      FactorDependentCompositeService.mapVariablesDTO2LevelsEntity = jest.fn(() => [{}])
      target.factorLevelService.batchCreateFactorLevels = jest.fn(() => Promise.resolve())

      return target.persistVariablesWithLevels(1, [{}, {}], testContext, testTx).then(() => {
        expect(target.factorService.deleteFactorsForExperimentId).toHaveBeenCalledWith(1, testTx)
        expect(target.factorService.batchCreateFactors).toHaveBeenCalledWith([{}, {}], testContext, testTx)
        expect(FactorDependentCompositeService.mapVariablesDTO2LevelsEntity).toHaveBeenCalledWith([{}, {}], [1, 2])
        expect(target.factorLevelService.batchCreateFactorLevels).toHaveBeenCalledWith([{}], testContext, testTx)
      })
    })

    it('deletes factors, batchCreates, but does not create levels', () => {
      const target = new FactorDependentCompositeService()
      target.factorService.deleteFactorsForExperimentId = jest.fn(() => Promise.resolve())
      target.factorService.batchCreateFactors = jest.fn(() => Promise.resolve([1, 2]))
      FactorDependentCompositeService.mapVariablesDTO2LevelsEntity = jest.fn(() => [])
      target.factorLevelService.batchCreateFactorLevels = jest.fn()

      return target.persistVariablesWithLevels(1, [{}, {}], testContext, testTx).then(() => {
        expect(target.factorService.deleteFactorsForExperimentId).toHaveBeenCalledWith(1, testTx)
        expect(target.factorService.batchCreateFactors).toHaveBeenCalledWith([{}, {}], testContext, testTx)
        expect(FactorDependentCompositeService.mapVariablesDTO2LevelsEntity).toHaveBeenCalledWith([{}, {}], [1, 2])
        expect(target.factorLevelService.batchCreateFactorLevels).not.toHaveBeenCalled()
      })
    })

    it('deletes factors only', () => {
      const target = new FactorDependentCompositeService()
      target.factorService.deleteFactorsForExperimentId = jest.fn(() => Promise.resolve())
      target.factorService.batchCreateFactors = jest.fn()
      FactorDependentCompositeService.mapVariablesDTO2LevelsEntity = jest.fn()
      target.factorLevelService.batchCreateFactorLevels = jest.fn()

      return target.persistVariablesWithLevels(1, [], testContext, testTx).then(() => {
        expect(target.factorService.deleteFactorsForExperimentId).toHaveBeenCalledWith(1, testTx)
        expect(target.factorService.batchCreateFactors).not.toHaveBeenCalled()
        expect(FactorDependentCompositeService.mapVariablesDTO2LevelsEntity).not.toHaveBeenCalled()
        expect(target.factorLevelService.batchCreateFactorLevels).not.toHaveBeenCalled()
      })
    })

    it('rejects when batchCreateFactorLevels fails', () => {
      const target = new FactorDependentCompositeService()
      target.factorService.deleteFactorsForExperimentId = jest.fn(() => Promise.resolve())
      target.factorService.batchCreateFactors = jest.fn(() => Promise.resolve([1, 2]))
      FactorDependentCompositeService.mapVariablesDTO2LevelsEntity = jest.fn(() => [{}])
      target.factorLevelService.batchCreateFactorLevels = jest.fn(() => Promise.reject('error'))

      return target.persistVariablesWithLevels(1, [{}, {}], testContext, testTx).then(() => {}, (err) => {
        expect(target.factorService.deleteFactorsForExperimentId).toHaveBeenCalledWith(1, testTx)
        expect(target.factorService.batchCreateFactors).toHaveBeenCalledWith([{}, {}], testContext, testTx)
        expect(FactorDependentCompositeService.mapVariablesDTO2LevelsEntity).toHaveBeenCalledWith([{}, {}], [1, 2])
        expect(target.factorLevelService.batchCreateFactorLevels).toHaveBeenCalledWith([{}], testContext, testTx)
        expect(err).toEqual('error')
      })
    })

    it('rejects when batchCreateFactors fails', () => {
      const target = new FactorDependentCompositeService()
      target.factorService.deleteFactorsForExperimentId = jest.fn(() => Promise.resolve())
      target.factorService.batchCreateFactors = jest.fn(() => Promise.reject('error'))
      FactorDependentCompositeService.mapVariablesDTO2LevelsEntity = jest.fn()
      target.factorLevelService.batchCreateFactorLevels = jest.fn()

      return target.persistVariablesWithLevels(1, [{}, {}], testContext, testTx).then(() => {}, (err) => {
        expect(target.factorService.deleteFactorsForExperimentId).toHaveBeenCalledWith(1, testTx)
        expect(target.factorService.batchCreateFactors).toHaveBeenCalledWith([{}, {}], testContext, testTx)
        expect(FactorDependentCompositeService.mapVariablesDTO2LevelsEntity).not.toHaveBeenCalled()
        expect(target.factorLevelService.batchCreateFactorLevels).not.toHaveBeenCalled()
        expect(err).toEqual('error')
      })
    })

    it('rejects when deleteFactorsForExperimentId fails', () => {
      const target = new FactorDependentCompositeService()
      target.factorService.deleteFactorsForExperimentId = jest.fn(() => Promise.reject('error'))
      target.factorService.batchCreateFactors = jest.fn()
      FactorDependentCompositeService.mapVariablesDTO2LevelsEntity = jest.fn()
      target.factorLevelService.batchCreateFactorLevels = jest.fn()

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
      const target = new FactorDependentCompositeService()
      target.dependentVariableService.deleteDependentVariablesForExperimentId = jest.fn(() => Promise.resolve())
      target.dependentVariableService.batchCreateDependentVariables = jest.fn(() => Promise.resolve())

      return target.persistVariablesWithoutLevels(1, [{}], testContext, testTx).then(() => {
        expect(target.dependentVariableService.deleteDependentVariablesForExperimentId).toHaveBeenCalledWith(1, testTx)
        expect(target.dependentVariableService.batchCreateDependentVariables).toHaveBeenCalledWith([{}], testContext, testTx)
      })
    })

    it('deletes dependent variables, but does not create new ones', () => {
      const target = new FactorDependentCompositeService()
      target.dependentVariableService.deleteDependentVariablesForExperimentId = jest.fn(() => Promise.resolve())
      target.dependentVariableService.batchCreateDependentVariables = jest.fn()

      return target.persistVariablesWithoutLevels(1, [], testContext, testTx).then(() => {
        expect(target.dependentVariableService.deleteDependentVariablesForExperimentId).toHaveBeenCalledWith(1, testTx)
        expect(target.dependentVariableService.batchCreateDependentVariables).not.toHaveBeenCalled()
      })
    })

    it('rejects when batchCreateDependentVariables fails', () => {
      const target = new FactorDependentCompositeService()
      target.dependentVariableService.deleteDependentVariablesForExperimentId = jest.fn(() => Promise.resolve())
      target.dependentVariableService.batchCreateDependentVariables = jest.fn(() => Promise.reject('error'))

      return target.persistVariablesWithoutLevels(1, [{}], testContext, testTx).then(() => {}, (err) => {
        expect(target.dependentVariableService.deleteDependentVariablesForExperimentId).toHaveBeenCalledWith(1, testTx)
        expect(target.dependentVariableService.batchCreateDependentVariables).toHaveBeenCalledWith([{}], testContext, testTx)
        expect(err).toEqual('error')
      })
    })

    it('rejects when deleteDependentVariablesForExperimentId fails', () => {
      const target = new FactorDependentCompositeService()
      target.dependentVariableService.deleteDependentVariablesForExperimentId = jest.fn(() => Promise.reject('error'))
      target.dependentVariableService.batchCreateDependentVariables = jest.fn()

      return target.persistVariablesWithoutLevels(1, [{}], testContext, testTx).then(() => {}, (err) => {
        expect(target.dependentVariableService.deleteDependentVariablesForExperimentId).toHaveBeenCalledWith(1, testTx)
        expect(target.dependentVariableService.batchCreateDependentVariables).not.toHaveBeenCalled()
        expect(err).toEqual('error')
      })
    })
  })

  describe('persistVariables', () => {
    it('calls persistVariablesWithLevels and persistVariablesWithoutLevels', () => {
      const target = new FactorDependentCompositeService()
      target.persistVariablesWithLevels = jest.fn(() => Promise.resolve())
      target.persistVariablesWithoutLevels = jest.fn(() => Promise.resolve())

      return target.persistVariables(1, [{}], [{}], testContext, testTx).then(() => {
        expect(target.persistVariablesWithLevels).toHaveBeenCalledWith(1, [{}], testContext, testTx)
        expect(target.persistVariablesWithoutLevels).toHaveBeenCalledWith(1, [{}], testContext, testTx)
      })
    })

    it('rejects when persistVariablesWithoutLevels fails', () => {
      const target = new FactorDependentCompositeService()
      target.persistVariablesWithLevels = jest.fn(() => Promise.resolve())
      target.persistVariablesWithoutLevels = jest.fn(() => Promise.reject('error'))

      return target.persistVariables(1, [{}], [{}], testContext, testTx).then(() => {}, (err) => {
        expect(target.persistVariablesWithLevels).toHaveBeenCalledWith(1, [{}], testContext, testTx)
        expect(target.persistVariablesWithoutLevels).toHaveBeenCalledWith(1, [{}], testContext, testTx)
        expect(err).toEqual('error')
      })
    })

    it('rejects when persistVariablesWithLevels fails', () => {
      const target = new FactorDependentCompositeService()
      target.persistVariablesWithLevels = jest.fn(() => Promise.reject('error'))
      target.persistVariablesWithoutLevels = jest.fn()

      return target.persistVariables(1, [{}], [{}], testContext, testTx).then(() => {}, (err) => {
        expect(target.persistVariablesWithLevels).toHaveBeenCalledWith(1, [{}], testContext, testTx)
        expect(target.persistVariablesWithoutLevels).not.toHaveBeenCalled()
        expect(err).toEqual('error')
      })
    })
  })

  describe('persistAllVariables', () => {
    it('validates, persists variables, and returns response', () => {
      const target = new FactorDependentCompositeService()
      target.variablesValidator.validate = jest.fn(() => Promise.resolve())
      target.persistVariables = jest.fn(() => Promise.resolve())
      AppUtil.createPostResponse = jest.fn()
      FactorDependentCompositeService.mapIndependentAndExogenousVariableDTO2Entity = jest.fn(() => [{}])
      FactorDependentCompositeService.mapDependentVariableDTO2DbEntity = jest.fn(() => [{}, {}])
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

    it('rejects when persistVariables fails' , () => {
      const target = new FactorDependentCompositeService()
      target.variablesValidator.validate = jest.fn(() => Promise.resolve())
      target.persistVariables = jest.fn(() => Promise.reject('error'))
      AppUtil.createPostResponse = jest.fn()
      FactorDependentCompositeService.mapIndependentAndExogenousVariableDTO2Entity = jest.fn(() => [{}])
      FactorDependentCompositeService.mapDependentVariableDTO2DbEntity = jest.fn(() => [{}, {}])
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

    it('rejects when validate fails' , () => {
      const target = new FactorDependentCompositeService()
      target.variablesValidator.validate = jest.fn(() => Promise.reject('error'))
      target.persistVariables = jest.fn()
      AppUtil.createPostResponse = jest.fn()
      FactorDependentCompositeService.mapIndependentAndExogenousVariableDTO2Entity = jest.fn(() => [{}])
      FactorDependentCompositeService.mapDependentVariableDTO2DbEntity = jest.fn(() => [{}, {}])
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