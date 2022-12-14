import { mock } from '../jestUtil'
import FactorsValidator from '../../src/validations/FactorsValidator'
import AppError from '../../src/services/utility/AppError'
import { dbRead } from '../../src/db/DbManager'

describe('FactorsValidator', () => {
  let target

  beforeEach(() => {
    target = new FactorsValidator()
  })

  describe('get POST_VALIDATION_SCHEMA', () => {
    test('gets schema', () => {
      dbRead.experiments = {}
      dbRead.factor = {}
      dbRead.factorType = {}
      dbRead.refDataSource = {}
      const schema = [
        {
          paramName: 'name', type: 'text', lengthRange: { min: 1, max: 500 }, required: true,
        },
        { paramName: 'tier', type: 'numeric', numericRange: { min: 1, max: 10 } },
        { paramName: 'refFactorTypeId', type: 'numeric', required: true },
        { paramName: 'refFactorTypeId', type: 'refData', entity: {} },
        { paramName: 'experimentId', type: 'numeric', required: true },
        { paramName: 'experimentId', type: 'refData', entity: {} },
        { paramName: 'isBlockingFactorOnly', type: 'boolean' },
      ]

      expect(FactorsValidator.POST_VALIDATION_SCHEMA).toEqual(schema)
    })
  })

  describe('get PUT_ADDITIONAL_SCHEMA_ELEMENTS', () => {
    test('gets schema elements', () => {
      dbRead.factor = {}
      const schema = [
        { paramName: 'id', type: 'numeric', required: true },
        { paramName: 'id', type: 'refData', entity: {} },
      ]

      expect(FactorsValidator.PUT_ADDITIONAL_SCHEMA_ELEMENTS).toEqual(schema)
    })
  })

  describe('getSchema', () => {
    test('returns post schema', () => {
      dbRead.experiments = {}
      dbRead.factor = {}
      dbRead.factorType = {}
      dbRead.refDataSource = {}
      const schema = [
        {
          paramName: 'name', type: 'text', lengthRange: { min: 1, max: 500 }, required: true,
        },
        { paramName: 'tier', type: 'numeric', numericRange: { min: 1, max: 10 } },
        { paramName: 'refFactorTypeId', type: 'numeric', required: true },
        { paramName: 'refFactorTypeId', type: 'refData', entity: {} },
        { paramName: 'experimentId', type: 'numeric', required: true },
        { paramName: 'experimentId', type: 'refData', entity: {} },
        { paramName: 'isBlockingFactorOnly', type: 'boolean' },
      ]

      expect(target.getSchema('POST')).toEqual(schema)
    })

    test('returns put schema', () => {
      dbRead.experiments = {}
      dbRead.factor = {}
      dbRead.factorType = {}
      dbRead.refDataSource = {}
      const schema = [
        {
          paramName: 'name', type: 'text', lengthRange: { min: 1, max: 500 }, required: true,
        },
        { paramName: 'tier', type: 'numeric', numericRange: { min: 1, max: 10 } },
        { paramName: 'refFactorTypeId', type: 'numeric', required: true },
        { paramName: 'refFactorTypeId', type: 'refData', entity: {} },
        { paramName: 'experimentId', type: 'numeric', required: true },
        { paramName: 'experimentId', type: 'refData', entity: {} },
        { paramName: 'isBlockingFactorOnly', type: 'boolean' },
        { paramName: 'id', type: 'numeric', required: true },
        { paramName: 'id', type: 'refData', entity: {} },
      ]

      expect(target.getSchema('PUT')).toEqual(schema)
    })

    test('throws an error when POST and PUT are not supplied', () => {
      AppError.badRequest = mock('')

      expect(() => { target.getSchema('test') }).toThrow()
      expect(AppError.badRequest).toHaveBeenCalledWith('Invalid Operation', undefined, '391001')
    })
  })

  describe('getEntityName', () => {
    test('returns name', () => {
      expect(target.getEntityName()).toEqual('Factor')
    })
  })

  describe('getBusinessKeyPropertyNames', () => {
    test('returns business key names', () => {
      expect(target.getBusinessKeyPropertyNames()).toEqual(['experimentId', 'name'])
    })
  })

  describe('getDuplicateBusinessKeyError', () => {
    test('returns duplicate business key error', () => {
      expect(target.getDuplicateBusinessKeyError()).toEqual({ message: 'Duplicate factor name in request payload with same experiment id', errorCode: '394001' })
    })
  })

  describe('preValidate', () => {
    test('resolves when factorObj is a filled array', () => {
      AppError.badRequest = mock()

      return target.preValidate([{}]).then(() => {
        expect(AppError.badRequest).not.toHaveBeenCalled()
      })
    })

    test('rejects when factorObj is undefined', () => {
      AppError.badRequest = mock()

      return target.preValidate(undefined).then(() => {}, () => {
        expect(AppError.badRequest).toHaveBeenCalledWith('Factor request object needs to be an array', undefined, '392001')
      })
    })

    test('rejects when factorObj is an empty array', () => {
      AppError.badRequest = mock()

      return target.preValidate([]).then(() => {}, () => {
        expect(AppError.badRequest).toHaveBeenCalledWith('Factor request object needs to be an array', undefined, '392001')
      })
    })

    test('rejects when there are duplicate factor names', () => {
      AppError.badRequest = mock()

      return target.preValidate([{ name: 'A' }, { name: 'A' }]).then(null, () => {
        expect(AppError.badRequest).toHaveBeenCalledWith('Factor names must be unique', undefined, '392002')
      })
    })
  })

  describe('postValidate', () => {
    test('resolves if there are errors', () => {
      target.hasErrors = mock(true)
      target.getBusinessKeyPropertyNames = mock()

      return target.postValidate({}).then(() => {
        expect(target.getBusinessKeyPropertyNames).not.toHaveBeenCalled()
      })
    })

    test('does not add a message if there are not any business key errors', () => {
      const targetObject = [{ test: 'a', experimentId: 1 }, { test: 'b', experimentId: 1 }]
      target.getBusinessKeyPropertyNames = mock(['experimentId', 'test'])

      return target.postValidate(targetObject).then(() => {
        expect(target.messages.length).toEqual(0)
      })
    })

    test('adds a message when there are business key errors', () => {
      const targetObject = [{ test: 'a', experimentId: 1 }, { test: 'a', experimentId: 1 }]
      target.getBusinessKeyPropertyNames = mock(['experimentId', 'test'])

      return target.postValidate(targetObject).then(() => {
        expect(target.messages.length).toEqual(1)
      })
    })
  })
})
