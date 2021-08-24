import { mock } from '../jestUtil'
import CombinationElementValidator from '../../src/validations/CombinationElementValidator'
import AppError from '../../src/services/utility/AppError'
import { dbRead } from '../../src/db/DbManager'

describe('CombinationElementValidator', () => {
  let target

  beforeEach(() => {
    target = new CombinationElementValidator()
  })

  describe('get POST_VALIDATION_SCHEMA', () => {
    test('gets the schema', () => {
      dbRead.treatment = {}
      dbRead.combinationElement = {}

      const schema = [
        { paramName: 'factorLevelId', type: 'numeric', required: true },
        { paramName: 'factorLevelId', type: 'refData', entity: dbRead.factorLevel },
        { paramName: 'treatmentId', type: 'numeric', required: true },
        { paramName: 'treatmentId', type: 'refData', entity: {} },
        {
          paramName: 'CombinationElement',
          type: 'businessKey',
          keys: ['treatmentId', 'factorLevelId'],
          entity: {},
        },
      ]

      expect(CombinationElementValidator.POST_VALIDATION_SCHEMA).toEqual(schema)
    })
  })

  describe('get PUT_ADDITIONAL_SCHEMA_ELEMENTS', () => {
    test('gets the schema', () => {
      dbRead.combinationElement = {}

      const schema = [
        { paramName: 'id', type: 'numeric', required: true },
        { paramName: 'id', type: 'refData', entity: {} },
      ]

      expect(CombinationElementValidator.PUT_ADDITIONAL_SCHEMA_ELEMENTS).toEqual(schema)
    })
  })

  describe('getEntityName', () => {
    test('gets the name', () => {
      expect(target.getEntityName()).toEqual('CombinationElement')
    })
  })

  describe('getSchema', () => {
    test('gets the post schema', () => {
      dbRead.treatment = {}
      dbRead.combinationElement = {}

      const schema = [
        { paramName: 'factorLevelId', type: 'numeric', required: true },
        { paramName: 'factorLevelId', type: 'refData', entity: dbRead.factorLevel },
        { paramName: 'treatmentId', type: 'numeric', required: true },
        { paramName: 'treatmentId', type: 'refData', entity: {} },
        {
          paramName: 'CombinationElement',
          type: 'businessKey',
          keys: ['treatmentId', 'factorLevelId'],
          entity: {},
        },
      ]

      expect(target.getSchema('POST')).toEqual(schema)
    })

    test('gets the put schema', () => {
      dbRead.treatment = {}
      dbRead.combinationElement = {}

      const schema = [
        { paramName: 'factorLevelId', type: 'numeric', required: true },
        { paramName: 'factorLevelId', type: 'refData', entity: dbRead.factorLevel },
        { paramName: 'treatmentId', type: 'numeric', required: true },
        { paramName: 'treatmentId', type: 'refData', entity: {} },
        {
          paramName: 'CombinationElement',
          type: 'businessKey',
          keys: ['treatmentId', 'factorLevelId'],
          entity: {},
        },
        { paramName: 'id', type: 'numeric', required: true },
        { paramName: 'id', type: 'refData', entity: {} },
      ]

      expect(target.getSchema('PUT')).toEqual(schema)
    })

    test('throws an error when neither POST nor PUT are supplied', () => {
      AppError.badRequest = mock('')

      expect(() => { target.getSchema('test') }).toThrow()
      expect(AppError.badRequest).toHaveBeenCalledWith('Invalid Operation', undefined, '311001')
    })
  })

  describe('getBusinessKeyPropertyNames', () => {
    test('returns business keys', () => {
      expect(target.getBusinessKeyPropertyNames()).toEqual(['treatmentId', 'factorLevelId'])
    })
  })

  describe('getDuplicateBusinessKeyError', () => {
    test('gets duplicate business key error message', () => {
      expect(target.getDuplicateBusinessKeyError()).toEqual({ message: 'Duplicate FactorLevel in request payload with same treatmentId', errorCode: '314001' })
    })
  })

  describe('preValidate', () => {
    test('resolves when combinationElementObj is a filled array', () => {
      AppError.badRequest = mock()

      return target.preValidate([{}]).then(() => {
        expect(AppError.badRequest).not.toHaveBeenCalled()
      })
    })

    test('rejects when combinationElementObj is undefined', () => {
      AppError.badRequest = mock()

      return target.preValidate(undefined).then(() => {}, () => {
        expect(AppError.badRequest).toHaveBeenCalledWith('CombinationElement request object needs to be an array', undefined, '312001')
      })
    })

    test('rejects when combinationElementObj is an empty array', () => {
      AppError.badRequest = mock()

      return target.preValidate([]).then(() => {}, () => {
        expect(AppError.badRequest).toHaveBeenCalledWith('CombinationElement request object needs to be an array', undefined, '312001')
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
