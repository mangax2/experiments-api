import { mock, mockResolve, mockReject } from '../jestUtil'
import FactorLevelService from '../../src/services/FactorLevelService'
import AppUtil from '../../src/services/utility/AppUtil'
import AppError from '../../src/services/utility/AppError'
import db from '../../src/db/DbManager'

describe('FactorLevelService', () => {
  let target
  const testContext = {}
  const testTx = { tx: {} }
  db.factorLevel.repository = mock({ tx(transactionName, callback) { return callback(testTx) } })

  beforeEach(() => {
    target = new FactorLevelService()
  })

  describe('batchCreateFactorLevels', () => {
    test('validates, calls batchCreate, and returns postResponse', () => {
      target.validator.validate = mockResolve()
      db.factorLevel.batchCreate = mockResolve([])
      AppUtil.createPostResponse = mock()

      return target.batchCreateFactorLevels([{}], testContext, testTx).then(() => {
        expect(target.validator.validate).toHaveBeenCalledWith([{}], 'POST', testTx)
        expect(db.factorLevel.batchCreate).toHaveBeenCalledWith([{}], testContext, testTx)
        expect(AppUtil.createPostResponse).toHaveBeenCalledWith([])
      })
    })

    test('rejects when batchCreate fails', () => {
      const error = { message: 'error' }
      target.validator.validate = mockResolve()
      db.factorLevel.batchCreate = mockReject(error)
      AppUtil.createPostResponse = mock()

      return target.batchCreateFactorLevels([{}], testContext, testTx).then(() => {}, (err) => {
        expect(target.validator.validate).toHaveBeenCalledWith([{}], 'POST', testTx)
        expect(db.factorLevel.batchCreate).toHaveBeenCalledWith([{}], testContext, testTx)
        expect(AppUtil.createPostResponse).not.toHaveBeenCalled()
        expect(err).toEqual(error)
      })
    })

    test('rejects when validate fails', () => {
      const error = { message: 'error' }
      target.validator.validate = mockReject(error)
      db.factorLevel.batchCreate = mock()
      AppUtil.createPostResponse = mock()

      return target.batchCreateFactorLevels([{}], testContext, testTx).then(() => {}, (err) => {
        expect(target.validator.validate).toHaveBeenCalledWith([{}], 'POST', testTx)
        expect(db.factorLevel.batchCreate).not.toHaveBeenCalled()
        expect(AppUtil.createPostResponse).not.toHaveBeenCalled()
        expect(err).toEqual(error)
      })
    })
  })

  describe('getAllFactorLevels', () => {
    test('returns all factorLevels', () => {
      db.factorLevel.all = mockResolve([{}])

      return target.getAllFactorLevels().then((data) => {
        expect(data).toEqual([{}])
      })
    })

    test('rejects when get all factorLevels fails', () => {
      const error = { message: 'error' }
      db.factorLevel.all = mockReject(error)

      return target.getAllFactorLevels().then(() => {}, (err) => {
        expect(err).toEqual(error)
      })
    })
  })

  describe('getFactorLevelsByExperimentIdNoExistenceCheck', () => {
    test('finds factors by that id', () => {
      db.factorLevel.findByExperimentId = mockResolve([])

      return FactorLevelService.getFactorLevelsByExperimentIdNoExistenceCheck(1, testTx).then((data) => {
        expect(db.factorLevel.findByExperimentId).toHaveBeenCalledWith(1, testTx)
        expect(data).toEqual([])
      })
    })

    test('rejects when findByExperimentId fails', () => {
      const error = { message: 'error' }
      db.factorLevel.findByExperimentId = mockReject(error)

      return FactorLevelService.getFactorLevelsByExperimentIdNoExistenceCheck(1, testTx).then(() => {}, (err) => {
        expect(db.factorLevel.findByExperimentId).toHaveBeenCalledWith(1, testTx)
        expect(err).toEqual(error)
      })
    })
  })
  describe('batchUpdateFactorLevels', () => {
    test('calls validate, batchUpdate, and returns post response', () => {
      target.validator.validate = mockResolve()
      db.factorLevel.batchUpdate = mockResolve([])
      AppUtil.createPutResponse = mock()

      return target.batchUpdateFactorLevels([{}], testContext, testTx).then(() => {
        expect(target.validator.validate).toHaveBeenCalledWith([{}], 'PUT', testTx)
        expect(db.factorLevel.batchUpdate).toHaveBeenCalledWith([{}], testContext, testTx)
        expect(AppUtil.createPutResponse).toHaveBeenCalledWith([])
      })
    })

    test('rejects when batchUpdate fails', () => {
      const error = { message: 'error' }
      target.validator.validate = mockResolve()
      db.factorLevel.batchUpdate = mockReject(error)
      AppUtil.createPutResponse = mock()

      return target.batchUpdateFactorLevels([{}], testContext, testTx).then(() => {}, (err) => {
        expect(target.validator.validate).toHaveBeenCalledWith([{}], 'PUT', testTx)
        expect(db.factorLevel.batchUpdate).toHaveBeenCalledWith([{}], testContext, testTx)
        expect(AppUtil.createPutResponse).not.toHaveBeenCalled()
        expect(err).toEqual(error)
      })
    })

    test('rejects when validate fails', () => {
      const error = { message: 'error' }
      target.validator.validate = mockReject(error)
      db.factorLevel.batchUpdate = mock()
      AppUtil.createPutResponse = mock()

      return target.batchUpdateFactorLevels([{}], testContext, testTx).then(() => {}, (err) => {
        expect(target.validator.validate).toHaveBeenCalledWith([{}], 'PUT', testTx)
        expect(db.factorLevel.batchUpdate).not.toHaveBeenCalled()
        expect(AppUtil.createPutResponse).not.toHaveBeenCalled()
        expect(err).toEqual(error)
      })
    })
  })

  describe('batchDeleteFactorLevels', () => {
    test('calls factorLevel batchRemove and returns data', () => {
      db.factorLevel.batchRemove = mockResolve([1, 2])

      return target.batchDeleteFactorLevels([1, 2], {}, testTx).then((data) => {
        expect(db.factorLevel.batchRemove).toHaveBeenCalledWith([1, 2], testTx)
        expect(data).toEqual([1, 2])
      })
    })

    test('throws an error when remove returns array whose length mismatches input', () => {
      db.factorLevel.batchRemove = mockResolve([null, 1])
      AppError.notFound = mock()

      return target.batchDeleteFactorLevels([1, 2], {}, testTx).then(() => {}, () => {
        expect(db.factorLevel.batchRemove).toHaveBeenCalledWith([1, 2], testTx)
        expect(AppError.notFound).toHaveBeenCalledWith('Not all factor levels requested for delete were found', undefined, '1C7001')
      })
    })
  })

  describe('processFactorLevelValues', () => {
    test('flattens the variables to the individual level value properties', () => {
      target = new FactorLevelService()
      target.flattenTreatmentVariableLevelValues = mock([])
      const variables = [
        { levels: [{ id: 3 }, { id: 4 }] },
        { levels: [{ id: 5 }, { id: 6 }, { id: 7 }] },
      ]

      target.processFactorLevelValues(variables)

      expect(target.flattenTreatmentVariableLevelValues).toHaveBeenCalledWith([...variables[0].levels, ...variables[1].levels])
    })

    test('passes the value from flattenTreatmentVariableLevelValues to validateFactorLevelValueProperties and populateValueType', () => {
      target = new FactorLevelService()
      const properties = [{ placeholder: true }, { placeholder: false }]
      const variables = []
      target.flattenTreatmentVariableLevelValues = mock(properties)
      target.validateFactorLevelValueProperties = mock()
      target.populateValueType = mock()

      target.processFactorLevelValues(variables)

      expect(target.validateFactorLevelValueProperties).toHaveBeenCalledWith(properties)
      expect(target.populateValueType).toHaveBeenCalledWith(properties)
    })

    test('does not call populateValueType if validateFactorLevelValueProperties throws an error', () => {
      target = new FactorLevelService()
      const properties = [{ placeholder: true }, { placeholder: false }]
      const variables = []
      target.flattenTreatmentVariableLevelValues = mock(properties)
      target.validateFactorLevelValueProperties = () => { throw new Error() }
      target.populateValueType = mock()

      expect(() => target.processFactorLevelValues(variables)).toThrowError()

      expect(target.populateValueType).not.toHaveBeenCalled()
    })
  })

  describe('flattenTreatmentVariableLevelValues', () => {
    test('calls flattenClusterOrComposite for every treatmentVariableLevel', () => {
      target = new FactorLevelService()
      target.flattenClusterOrComposite = mock([{}, {}])
      const treatmentVariableLevels = [
        { id: 1 },
        { id: 2 },
        { id: 3 },
      ]

      const result = target.flattenTreatmentVariableLevelValues(treatmentVariableLevels)

      expect(target.flattenClusterOrComposite).toHaveBeenCalledTimes(3)
      expect(target.flattenClusterOrComposite).toHaveBeenCalledWith(treatmentVariableLevels[0])
      expect(target.flattenClusterOrComposite).toHaveBeenCalledWith(treatmentVariableLevels[1])
      expect(target.flattenClusterOrComposite).toHaveBeenCalledWith(treatmentVariableLevels[2])
      expect(result.length).toBe(6)
    })
  })

  describe('flattenClusterOrComposite', () => {
    test('calls itself with the child item if it is a Cluster and returns that value', () => {
      target = new FactorLevelService()
      const originalFunction = target.flattenClusterOrComposite
      const returnedValue = [{}, {}]
      target.flattenClusterOrComposite = mock(returnedValue)
      const childProperty = { objectType: 'Cluster' }
      const property = { items: [childProperty] }

      const result = originalFunction(property)

      expect(target.flattenClusterOrComposite).toHaveBeenCalledWith(childProperty)
      expect(result).toEqual(returnedValue)
    })

    test('calls itself with the child item if it is a Composite and returns that value', () => {
      target = new FactorLevelService()
      const originalFunction = target.flattenClusterOrComposite
      const returnedValue = [{}, {}]
      target.flattenClusterOrComposite = mock(returnedValue)
      const childProperty = { objectType: 'Composite' }
      const property = { items: [childProperty] }

      const result = originalFunction(property)

      expect(target.flattenClusterOrComposite).toHaveBeenCalledWith(childProperty)
      expect(result).toEqual(returnedValue)
    })

    test('does not call itself with the child item if it is not a Cluster or a Composite and instead returns itself in an array', () => {
      target = new FactorLevelService()
      const originalFunction = target.flattenClusterOrComposite
      target.flattenClusterOrComposite = mock()
      const childProperty = { objectType: 'Catalog' }
      const property = { items: [childProperty] }

      const result = originalFunction(property)

      expect(target.flattenClusterOrComposite).not.toHaveBeenCalled()
      expect(result).toEqual([childProperty])
    })

    test('returns the result of multiple items in a single array', () => {
      target = new FactorLevelService()
      const originalFunction = target.flattenClusterOrComposite
      target.flattenClusterOrComposite = mock([{}, {}])
      const property = {
        items: [
          { objectType: 'Cluster' },
          { objectType: 'Composite' },
          { objectType: 'Catalog' },
        ],
      }

      const result = originalFunction(property)

      expect(result.length).toBe(5)
    })
  })

  describe('populateValueType', () => {
    test('sets valueType to "exact" if placeholder is false', () => {
      target = new FactorLevelService()
      const property = { placeholder: false }

      target.populateValueType([property])

      expect(property.valueType).toBe('exact')
    })

    test('sets valueType to "placeholder" if placeholder is true', () => {
      target = new FactorLevelService()
      const property = { placeholder: true }

      target.populateValueType([property])

      expect(property.valueType).toBe('placeholder')
    })

    test('does nothing if valueType is already populated', () => {
      target = new FactorLevelService()
      const property = { placeholder: true, valueType: 'illegal value' }

      target.populateValueType([property])

      expect(property.valueType).toBe('illegal value')
    })

    test('does nothing if objectType is "Cluster"', () => {
      target = new FactorLevelService()
      const property = { placeholder: true, objectType: 'Cluster' }

      target.populateValueType([property])

      expect(property.valueType).toBe(undefined)
    })

    test('does nothing if objectType is "Composite"', () => {
      target = new FactorLevelService()
      const property = { placeholder: true, objectType: 'Composite' }

      target.populateValueType([property])

      expect(property.valueType).toBe(undefined)
    })

    test('sets multiple properties at once', () => {
      target = new FactorLevelService()
      const properties = [
        { placeholder: false },
        { placeholder: false },
        { placeholder: true },
      ]

      target.populateValueType(properties)

      expect(properties[0].valueType).toBe('exact')
      expect(properties[1].valueType).toBe('exact')
      expect(properties[2].valueType).toBe('placeholder')
    })
  })

  describe('validateFactorLevelValueProperties', () => {
    test('does nothing if the value properties are valid', () => {
      const properties = [
        { objectType: 'Cluster', items: [] },
        { objectType: 'Catalog', placeholder: true },
      ]
      AppError.badRequest = mock(new Error())

      expect(() => target.validateFactorLevelValueProperties(properties)).not.toThrowError()
      expect(AppError.badRequest).not.toHaveBeenCalled()
    })

    test('throws an error if a cluster or composite does not have items', () => {
      const properties = [
        { objectType: 'Cluster' },
        { objectType: 'Catalog', placeholder: true },
      ]
      AppError.badRequest = mock(new Error())

      expect(() => target.validateFactorLevelValueProperties(properties)).toThrowError()
      expect(AppError.badRequest).toHaveBeenCalledWith('All Cluster and Composite properties must have an array named "items".', undefined, '1CC001')
    })

    test('throws an error if a value property does not have placeholder or valueType', () => {
      const properties = [
        { objectType: 'Cluster', items: [] },
        { objectType: 'Catalog' },
      ]
      AppError.badRequest = mock(new Error())

      expect(() => target.validateFactorLevelValueProperties(properties)).toThrowError()
      expect(AppError.badRequest).toHaveBeenCalledWith('All value properties must either specify "placeholder", "valueType", or both of these.', undefined, '1CC002')
    })
  })
})
