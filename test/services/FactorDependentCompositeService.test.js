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

      return target.getFactorLevels([{id:1},{id:2}]).then((data) => {
        expect(target.factorLevelService.getFactorLevelsByFactorId).toHaveBeenCalledTimes(2)
        expect(target.factorLevelService.getFactorLevelsByFactorId.mock.calls).toEqual([[1],[2]])
        expect(data).toEqual([{},{}])
      })
    })
  })

  describe('getAllVariablesByExperimentId', () => {
    it('returns all variables with their levels', () => {
      const target = new FactorDependentCompositeService()
      const factorsWithLevels = {factors: [{id:1, name: 'testFactor', tier: undefined, ref_data_source_id: 1, ref_factor_type_id: 1}], levels: [{id:1, value: 'testValue1', factor_id: 1},{id:2, value: 'testValue2', factor_id: 1}]}
      target.getFactorsWithLevels = jest.fn(() => Promise.resolve(factorsWithLevels))
      const factorTypes = [{id: 1, type: 'independent'}]
      target.factorTypeService.getAllFactorTypes = jest.fn(() => Promise.resolve(factorTypes))
      const dependentVariables = [{name: 'testDependent', required: true}]
      target.dependentVariableService.getDependentVariablesByExperimentId = jest.fn(() => Promise.resolve(dependentVariables))
      const expectedReturn = {
        independent: [{name: 'testFactor', levels: ['testValue1', 'testValue2'], tier: undefined, refDataSourceId: 1}],
        exogenous: [],
        dependent: [{name: 'testDependent', required: true}]
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
      const variables = [{},{}]
      expect(FactorDependentCompositeService.mapVariableDTO2DbEntity(variables, 1, 1)).toEqual([{refFactorTypeId: 1, experimentId: 1}, {refFactorTypeId: 1, experimentId: 1}])
    })
  })

  describe('mapLevelDTO2DbEntity', () => {
    it('returns empty array when levels are undefined, null, or empty', () => {
      expect(FactorDependentCompositeService.mapLevelDTO2DbEntity(undefined, 1)).toEqual([])
      expect(FactorDependentCompositeService.mapLevelDTO2DbEntity(null, 1)).toEqual([])
      expect(FactorDependentCompositeService.mapLevelDTO2DbEntity([], 1)).toEqual([])
    })

    it('returns mapped levels to db entities', () => {
      expect(FactorDependentCompositeService.mapLevelDTO2DbEntity(['testValue', 'testValue2'], 1)).toEqual([{value: 'testValue', factorId: 1},{value: 'testValue2', factorId: 1}])
    })
  })

  describe('mapDependentVariableDTO2DbEntity', () => {
    it('returns empty array when dependentVariables is undefined, null, or empty' , () => {
      expect(FactorDependentCompositeService.mapDependentVariableDTO2DbEntity(undefined, 1)).toEqual([])
      expect(FactorDependentCompositeService.mapDependentVariableDTO2DbEntity(null, 1)).toEqual([])
      expect(FactorDependentCompositeService.mapDependentVariableDTO2DbEntity([], 1)).toEqual([])
    })

    it('maps dependent variables to db entities', () => {
      expect(FactorDependentCompositeService.mapDependentVariableDTO2DbEntity([{name: 'testDependent'},{name: 'testDependent2'}],1)).toEqual([{name: 'testDependent', experimentId: 1}, {name: 'testDependent2', experimentId: 1}])
    })
  })
})