import _ from 'lodash'
import { mock, mockResolve, mockReject } from '../jestUtil'
import FactorLevelService from '../../src/services/FactorLevelService'
import AppUtil from '../../src/services/utility/AppUtil'
import AppError from '../../src/services/utility/AppError'
import { dbRead, dbWrite } from '../../src/db/DbManager'

describe('FactorLevelService', () => {
  let target
  const testContext = {}
  const testTx = { tx: {} }
  dbRead.factorLevel.repository = mock({ tx(transactionName, callback) { return callback(testTx) } })

  beforeEach(() => {
    target = new FactorLevelService()
  })

  describe('batchCreateFactorLevels', () => {
    test('validates, calls batchCreate, and returns postResponse', () => {
      target.validator.validate = mockResolve()
      dbWrite.factorLevel.batchCreate = mockResolve([])
      AppUtil.createPostResponse = mock()

      return target.batchCreateFactorLevels([{}], testContext, testTx).then(() => {
        expect(target.validator.validate).toHaveBeenCalledWith([{}], 'POST')
        expect(dbWrite.factorLevel.batchCreate).toHaveBeenCalledWith([{}], testContext, testTx)
        expect(AppUtil.createPostResponse).toHaveBeenCalledWith([])
      })
    })

    test('rejects when batchCreate fails', () => {
      const error = { message: 'error' }
      target.validator.validate = mockResolve()
      dbWrite.factorLevel.batchCreate = mockReject(error)
      AppUtil.createPostResponse = mock()

      return target.batchCreateFactorLevels([{}], testContext, testTx).then(() => {}, (err) => {
        expect(target.validator.validate).toHaveBeenCalledWith([{}], 'POST')
        expect(dbWrite.factorLevel.batchCreate).toHaveBeenCalledWith([{}], testContext, testTx)
        expect(AppUtil.createPostResponse).not.toHaveBeenCalled()
        expect(err).toEqual(error)
      })
    })

    test('rejects when validate fails', () => {
      const error = { message: 'error' }
      target.validator.validate = mockReject(error)
      dbWrite.factorLevel.batchCreate = mock()
      AppUtil.createPostResponse = mock()

      return target.batchCreateFactorLevels([{}], testContext, testTx).then(() => {}, (err) => {
        expect(target.validator.validate).toHaveBeenCalledWith([{}], 'POST')
        expect(dbWrite.factorLevel.batchCreate).not.toHaveBeenCalled()
        expect(AppUtil.createPostResponse).not.toHaveBeenCalled()
        expect(err).toEqual(error)
      })
    })
  })

  describe('getAllFactorLevels', () => {
    test('returns all factorLevels', () => {
      dbRead.factorLevel.all = mockResolve([{}])

      return target.getAllFactorLevels().then((data) => {
        expect(data).toEqual([{}])
      })
    })

    test('rejects when get all factorLevels fails', () => {
      const error = { message: 'error' }
      dbRead.factorLevel.all = mockReject(error)

      return target.getAllFactorLevels().then(() => {}, (err) => {
        expect(err).toEqual(error)
      })
    })
  })

  describe('getFactorLevelsByExperimentIdNoExistenceCheck', () => {
    test('finds factors by that id', () => {
      dbRead.factorLevel.findByExperimentId = mockResolve([])

      return FactorLevelService.getFactorLevelsByExperimentIdNoExistenceCheck(1).then((data) => {
        expect(dbRead.factorLevel.findByExperimentId).toHaveBeenCalledWith(1)
        expect(data).toEqual([])
      })
    })

    test('rejects when findByExperimentId fails', () => {
      const error = { message: 'error' }
      dbRead.factorLevel.findByExperimentId = mockReject(error)

      return FactorLevelService.getFactorLevelsByExperimentIdNoExistenceCheck(1).then(() => {}, (err) => {
        expect(dbRead.factorLevel.findByExperimentId).toHaveBeenCalledWith(1)
        expect(err).toEqual(error)
      })
    })
  })
  describe('batchUpdateFactorLevels', () => {
    test('calls validate, batchUpdate, and returns post response', () => {
      target.validator.validate = mockResolve()
      dbWrite.factorLevel.batchUpdate = mockResolve([])
      AppUtil.createPutResponse = mock()

      return target.batchUpdateFactorLevels([{}], testContext, testTx).then(() => {
        expect(target.validator.validate).toHaveBeenCalledWith([{}], 'PUT')
        expect(dbWrite.factorLevel.batchUpdate).toHaveBeenCalledWith([{}], testContext, testTx)
        expect(AppUtil.createPutResponse).toHaveBeenCalledWith([])
      })
    })

    test('rejects when batchUpdate fails', () => {
      const error = { message: 'error' }
      target.validator.validate = mockResolve()
      dbWrite.factorLevel.batchUpdate = mockReject(error)
      AppUtil.createPutResponse = mock()

      return target.batchUpdateFactorLevels([{}], testContext, testTx).then(() => {}, (err) => {
        expect(target.validator.validate).toHaveBeenCalledWith([{}], 'PUT')
        expect(dbWrite.factorLevel.batchUpdate).toHaveBeenCalledWith([{}], testContext, testTx)
        expect(AppUtil.createPutResponse).not.toHaveBeenCalled()
        expect(err).toEqual(error)
      })
    })

    test('rejects when validate fails', () => {
      const error = { message: 'error' }
      target.validator.validate = mockReject(error)
      dbWrite.factorLevel.batchUpdate = mock()
      AppUtil.createPutResponse = mock()

      return target.batchUpdateFactorLevels([{}], testContext, testTx).then(() => {}, (err) => {
        expect(target.validator.validate).toHaveBeenCalledWith([{}], 'PUT')
        expect(dbWrite.factorLevel.batchUpdate).not.toHaveBeenCalled()
        expect(AppUtil.createPutResponse).not.toHaveBeenCalled()
        expect(err).toEqual(error)
      })
    })
  })

  describe('batchDeleteFactorLevels', () => {
    test('calls factorLevel batchRemove and returns data', () => {
      dbWrite.factorLevel.batchRemove = mockResolve([1, 2])

      return target.batchDeleteFactorLevels([1, 2], {}, testTx).then((data) => {
        expect(dbWrite.factorLevel.batchRemove).toHaveBeenCalledWith([1, 2], testTx)
        expect(data).toEqual([1, 2])
      })
    })

    test('throws an error when remove returns array whose length mismatches input', () => {
      dbWrite.factorLevel.batchRemove = mockResolve([null, 1])
      AppError.notFound = mock()

      return target.batchDeleteFactorLevels([1, 2], {}, testTx).then(() => {}, () => {
        expect(dbWrite.factorLevel.batchRemove).toHaveBeenCalledWith([1, 2], testTx)
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

    test('passes the value from flattenTreatmentVariableLevelValues to validateFactorLevelValueProperties, populateValueType, and populateIsPlaceholderFromValueType', () => {
      target = new FactorLevelService()
      const properties = [{ isPlaceholder: true }, { isPlaceholder: false }]
      const variables = []
      target.flattenTreatmentVariableLevelValues = mock(properties)
      target.validateFactorLevelValueProperties = mock()
      target.populateValueType = mock()
      target.populateIsPlaceholderFromValueType = mock()

      target.processFactorLevelValues(variables)

      expect(target.validateFactorLevelValueProperties).toHaveBeenCalledWith(properties)
      expect(target.populateValueType).toHaveBeenCalledWith(properties)
      expect(target.populateIsPlaceholderFromValueType).toHaveBeenCalledWith(properties)
    })

    test('does not call populateValueType if validateFactorLevelValueProperties throws an error', () => {
      target = new FactorLevelService()
      const properties = [{ isPlaceholder: true }, { isPlaceholder: false }]
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
    test('sets valueType to "exact" if isPlaceholder is false', () => {
      target = new FactorLevelService()
      const property = { isPlaceholder: false }

      target.populateValueType([property])

      expect(property.valueType).toBe('exact')
    })

    test('sets valueType to "placeholder" if isPlaceholder is true', () => {
      target = new FactorLevelService()
      const property = { isPlaceholder: true }

      target.populateValueType([property])

      expect(property.valueType).toBe('placeholder')
    })

    test('does nothing if valueType is already populated', () => {
      target = new FactorLevelService()
      const property = { isPlaceholder: true, valueType: 'illegal value' }

      target.populateValueType([property])

      expect(property.valueType).toBe('illegal value')
    })

    test('does nothing if objectType is "Cluster"', () => {
      target = new FactorLevelService()
      const property = { isPlaceholder: true, objectType: 'Cluster' }

      target.populateValueType([property])

      expect(property.valueType).toBe(undefined)
    })

    test('does nothing if objectType is "Composite"', () => {
      target = new FactorLevelService()
      const property = { isPlaceholder: true, objectType: 'Composite' }

      target.populateValueType([property])

      expect(property.valueType).toBe(undefined)
    })

    test('sets multiple properties at once', () => {
      target = new FactorLevelService()
      const properties = [
        { isPlaceholder: false },
        { isPlaceholder: false },
        { isPlaceholder: true },
      ]

      target.populateValueType(properties)

      expect(properties[0].valueType).toBe('exact')
      expect(properties[1].valueType).toBe('exact')
      expect(properties[2].valueType).toBe('placeholder')
    })
  })

  describe('populateIsPlaceholderFromValueType', () => {
    test('sets isPlaceholder to true when valueType is "placeholder" and isPlaceholder is not provided', () => {
      target = new FactorLevelService()
      const property = { valueType: 'placeholder' }

      target.populateIsPlaceholderFromValueType([property])

      expect(property.isPlaceholder).toBe(true)
    })

    test('sets isPlaceholder to false when valueType is anything other than placeholder and isPlaceholder is not provided', () => {
      target = new FactorLevelService()
      const properties = [{ valueType: 'exact' }, { valueType: 'noTreatment' }]

      target.populateIsPlaceholderFromValueType(properties)

      expect(_.find(properties, p => p.isPlaceholder === true)).toBe(undefined)
    })

    test('does not attempt to set isPlaceholder for value properties where isPlaceholder is already set', () => {
      target = new FactorLevelService()
      const mockComparator = mock()
      const property = { valueType: 'exact', isPlaceholder: false }
      target.isValueTypePlaceholder = mockComparator

      target.populateIsPlaceholderFromValueType([property])

      expect(mockComparator).not.toHaveBeenCalled()
    })
  })

  describe('validateFactorLevelValueProperties', () => {
    test('does nothing if the value properties are valid', () => {
      const properties = [
        { objectType: 'Cluster', items: [] },
        { objectType: 'Catalog', isPlaceholder: true },
        { objectType: 'Catalog', isPlaceholder: true, valueType: 'placeholder' },
        { objectType: 'Catalog', isPlaceholder: false, valueType: 'exact' },
        { objectType: 'Catalog', isPlaceholder: false, valueType: 'noTreatment' },
      ]
      AppError.badRequest = mock(new Error())

      expect(() => target.validateFactorLevelValueProperties(properties)).not.toThrowError()
      expect(AppError.badRequest).not.toHaveBeenCalled()
    })

    test('throws an error if a cluster or composite does not have items', () => {
      const properties = [
        { objectType: 'Cluster' },
        { objectType: 'Catalog', isPlaceholder: true },
      ]
      AppError.badRequest = mock(new Error())

      expect(() => target.validateFactorLevelValueProperties(properties)).toThrowError()
      expect(AppError.badRequest).toHaveBeenCalledWith('All Cluster and Composite properties must have an array named "items".', undefined, '1CC001')
    })

    test('throws an error if a value property does not have isPlaceholder or valueType', () => {
      const properties = [
        { objectType: 'Cluster', items: [] },
        { objectType: 'Catalog' },
      ]
      AppError.badRequest = mock(new Error())

      expect(() => target.validateFactorLevelValueProperties(properties)).toThrowError()
      expect(AppError.badRequest).toHaveBeenCalledWith('All value properties must either specify "isPlaceholder", "valueType", or both of these.', undefined, '1CC002')
    })

    test('throws an error if a value property has isPlaceholder: true and valueType is not placeholder', () => {
      const properties = [
        { objectType: 'Cluster', items: [] },
        { objectType: 'Catalog', valueType: 'exact', isPlaceholder: true },
      ]
      AppError.badRequest = mock(new Error())

      expect(() => target.validateFactorLevelValueProperties(properties)).toThrowError()
      expect(AppError.badRequest).toHaveBeenCalledWith('One or more value properties have mismatched "valueType" and "isPlaceholder" values', undefined, '1CC003')
    })

    test('throws an error if a value property has isPlaceholder: false and valueType is placeholder', () => {
      const properties = [
        { objectType: 'Cluster', items: [] },
        { objectType: 'Catalog', valueType: 'placeholder', isPlaceholder: false },
      ]
      AppError.badRequest = mock(new Error())

      expect(() => target.validateFactorLevelValueProperties(properties)).toThrowError()
      expect(AppError.badRequest).toHaveBeenCalledWith('One or more value properties have mismatched "valueType" and "isPlaceholder" values', undefined, '1CC003')
    })

    test('does not call areValueTypeAndPlaceholderMismatched if valueType is not populated', () => {
      target = new FactorLevelService()
      const properties = [
        { objectType: 'Cluster', items: [] },
        { objectType: 'Catalog', valueType: null, isPlaceholder: false },
      ]
      target.areValueTypeAndPlaceholderMismatched = mock()

      expect(() => target.validateFactorLevelValueProperties(properties)).not.toThrowError()
      expect(target.areValueTypeAndPlaceholderMismatched).not.toHaveBeenCalled()
    })

    test('does not call areValueTypeAndPlaceholderMismatched if isPlaceholder is not populated', () => {
      target = new FactorLevelService()
      const properties = [
        { objectType: 'Cluster', items: [] },
        { objectType: 'Catalog', valueType: 'placeholder', isPlaceholder: null },
      ]
      target.areValueTypeAndPlaceholderMismatched = mock()

      expect(() => target.validateFactorLevelValueProperties(properties)).not.toThrowError()
      expect(target.areValueTypeAndPlaceholderMismatched).not.toHaveBeenCalled()
    })

    test('throws an error if an invalid input is given for valueType', () => {
      target = new FactorLevelService()
      const properties = [
        { objectType: 'Catalog', valueType: 'noValue' },
        { objectType: 'Catalog', valueType: 'noTreatment' },
      ]

      expect(() => target.validateFactorLevelValueProperties(properties)).toThrowError()
      expect(AppError.badRequest).toHaveBeenCalledWith('One or more value properties have an invalid "valueType". "valueType" must be one of: "exact", "placeholder", "noTreatment".', undefined, '1CC004')
    })
  })
})
