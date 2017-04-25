import { mock } from '../jestUtil'
import FactorLevelsValidator from '../../src/validations/FactorLevelsValidator'
import AppError from '../../src/services/utility/AppError'
import db from '../../src/db/DbManager'

describe('FactorLevelsValidator', () => {
  let target

  beforeEach(() => {
    target = new FactorLevelsValidator()
  })

  describe('get POST_VALIDATION_SCHEMA', () => {
    it('returns post schema', () => {
      db.factor = {}
      db.factorLevel = {}

      const schema = [
        { paramName: 'value', type: 'text', lengthRange: { min: 1, max: 500 }, required: true },
        { paramName: 'factorId', type: 'numeric', required: true },
        { paramName: 'factorId', type: 'refData', entity: {} },
        {
          paramName: 'FactorLevel',
          type: 'businessKey',
          keys: ['factorId', 'value'],
          entity: {},
        },
      ]

      expect(FactorLevelsValidator.POST_VALIDATION_SCHEMA).toEqual(schema)
    })

    it('returns put schema', () => {
      db.factorLevel = {}

      const schema = [
        { paramName: 'id', type: 'numeric', required: true },
        { paramName: 'id', type: 'refData', entity: {} },
      ]

      expect(FactorLevelsValidator.PUT_ADDITIONAL_SCHEMA_ELEMENTS).toEqual(schema)
    })
  })

  describe('getEntityName', () => {
    it('returns name', () => {
      expect(target.getEntityName()).toEqual('FactorLevel')
    })
  })

  describe('getSchema', () => {
    it('returns POST schema when POST is supplied', () => {
      db.factor = {}
      db.factorLevel = {}

      const schema = [
        { paramName: 'value', type: 'text', lengthRange: { min: 1, max: 500 }, required: true },
        { paramName: 'factorId', type: 'numeric', required: true },
        { paramName: 'factorId', type: 'refData', entity: {} },
        {
          paramName: 'FactorLevel',
          type: 'businessKey',
          keys: ['factorId', 'value'],
          entity: {},
        },
      ]

      expect(target.getSchema('POST')).toEqual(schema)
    })

    it('returns POST and PUT schemas when PUT is supplied', () => {
      db.factor = {}
      db.factorLevel = {}

      const schema = [
        { paramName: 'value', type: 'text', lengthRange: { min: 1, max: 500 }, required: true },
        { paramName: 'factorId', type: 'numeric', required: true },
        { paramName: 'factorId', type: 'refData', entity: {} },
        {
          paramName: 'FactorLevel',
          type: 'businessKey',
          keys: ['factorId', 'value'],
          entity: {},
        },
        { paramName: 'id', type: 'numeric', required: true },
        { paramName: 'id', type: 'refData', entity: {} },
      ]

      expect(target.getSchema('PUT')).toEqual(schema)
    })

    it('throws an error when POST or PUT is not given', () => {
      AppError.badRequest = mock('')

      expect(() => {target.getSchema('test')}).toThrow()
      expect(AppError.badRequest).toHaveBeenCalledWith('Invalid Operation')
    })
  })

  describe('getBusinessKeyPropertyNames', () => {
    it('returns business keys', () => {
      expect(target.getBusinessKeyPropertyNames()).toEqual(['factorId', 'value'])
    })
  })

  describe('getDuplicateBusinessKeyError', () => {
    it('returns the duplicate business key error message', () => {
      expect(target.getDuplicateBusinessKeyError()).toEqual('Duplicate factor level value in request payload with same factor id')
    })
  })

  describe('preValidate', () => {
    it('resolves when factorLevelObj is a filled array', () => {
      AppError.badRequest = mock()

      return target.preValidate([{}]).then(() => {
        expect(AppError.badRequest).not.toHaveBeenCalled()
      })
    })

    it('rejects when factorLevelObj is undefined', () => {
      AppError.badRequest = mock()

      return target.preValidate(undefined).then(() => {}, () => {
        expect(AppError.badRequest).toHaveBeenCalledWith('Factor Level request object needs to' +
          ' be an array')
      })
    })

    it('rejects when factorLevelObj is an empty array', () => {
      AppError.badRequest = mock()

      return target.preValidate([]).then(() => {}, () => {
        expect(AppError.badRequest).toHaveBeenCalledWith('Factor Level request object needs to' +
          ' be an array')
      })
    })
  })

  describe('postValidate', () => {
    it('resolves if there are errors', () => {
      target.hasErrors = mock(true)
      target.getBusinessKeyPropertyNames = mock()

      return target.postValidate({}).then(() => {
        expect(target.getBusinessKeyPropertyNames).not.toHaveBeenCalled()
      })
    })

    it('does not add a message if there are not any business key errors', () => {
      const targetObject = [{test: 'a', factorId: 1},{test: 'b', factorId: 1}]
      target.getBusinessKeyPropertyNames = mock(['factorId', 'test'])

      return target.postValidate(targetObject).then(() => {
        expect(target.messages.length).toEqual(0)
      })
    })

    it('adds a message when there are business key errors', () => {
      const targetObject = [{test: 'a', factorId: 1},{test: 'a', factorId: 1}]
      target.getBusinessKeyPropertyNames = mock(['factorId', 'test'])

      return target.postValidate(targetObject).then(() => {
        expect(target.messages.length).toEqual(1)
      })
    })
  })
})