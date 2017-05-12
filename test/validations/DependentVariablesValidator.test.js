import { mock } from '../jestUtil'
import DependentVariablesValidator from '../../src/validations/DependentVariablesValidator'
import AppError from '../../src/services/utility/AppError'
import db from '../../src/db/DbManager'

describe('DependentVariablesValidator', () => {
  let target

  beforeEach(() => {
    target = new DependentVariablesValidator()
  })

  describe('getSchema', () => {
    it('returns post schema', () => {
      db.experiments = {}
      db.dependentVariable = {}
      const schema = [
        { paramName: 'required', type: 'boolean', required: true },
        { paramName: 'name', type: 'text', lengthRange: { min: 1, max: 500 }, required: true },
        { paramName: 'experimentId', type: 'numeric', required: true },
        { paramName: 'experimentId', type: 'refData', entity: {} },
        {
          paramName: 'DependentVariable',
          type: 'businessKey',
          keys: ['experimentId', 'name'],
          entity: {},
        },
      ]

      expect(target.getSchema('POST')).toEqual(schema)
    })

    it('returns put schema', () => {
      db.experiments = {}
      db.dependentVariable = {}
      const schema = [
        { paramName: 'required', type: 'boolean', required: true },
        { paramName: 'name', type: 'text', lengthRange: { min: 1, max: 500 }, required: true },
        { paramName: 'experimentId', type: 'numeric', required: true },
        { paramName: 'experimentId', type: 'refData', entity: {} },
        {
          paramName: 'DependentVariable',
          type: 'businessKey',
          keys: ['experimentId', 'name'],
          entity: {},
        },
        { paramName: 'id', type: 'numeric', required: true },
        { paramName: 'id', type: 'refData', entity: {} }
      ]

      expect(target.getSchema('PUT')).toEqual(schema)
    })

    it('throws an error when POST and PUT are not supplied', () => {
      AppError.badRequest = mock('')

      expect(() => {target.getSchema('test')}).toThrow()
      expect(AppError.badRequest).toHaveBeenCalledWith('Invalid Operation')
    })
  })

  describe('getEntityName', () => {
    it('returns name', () => {
      expect(target.getEntityName()).toEqual('DependentVariable')
    })
  })

  describe('getBusinessKeyPropertyNames', () => {
    it('returns business key names', () => {
      expect(target.getBusinessKeyPropertyNames()).toEqual(['experimentId', 'name'])
    })
  })

  describe('getDuplicateBusinessKeyError', () => {
    it('returns duplicate business key error', () => {
      expect(target.getDuplicateBusinessKeyError()).toEqual('duplicate dependent variable name in request payload with same experiment id')
    })
  })

  describe('preValidate', () => {
    it('resolves when dependentObj is a filled array', () => {
      AppError.badRequest = mock()

      return target.preValidate([{}]).then(() => {
        expect(AppError.badRequest).not.toHaveBeenCalled()
      })
    })

    it('rejects when dependentObj is undefined', () => {
      AppError.badRequest = mock()

      return target.preValidate(undefined).then(() => {}, () => {
        expect(AppError.badRequest).toHaveBeenCalledWith('Dependent Variables request object' +
          ' needs to be an array')
      })
    })

    it('rejects when dependentObj is an empty array', () => {
      AppError.badRequest = mock()

      return target.preValidate([]).then(() => {}, () => {
        expect(AppError.badRequest).toHaveBeenCalledWith('Dependent Variables request object' +
          ' needs to be an array')
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
      const targetObject = [{test: 'a', experimentId: 1},{test: 'b', experimentId: 1}]
      target.getBusinessKeyPropertyNames = mock(['experimentId', 'test'])

      return target.postValidate(targetObject).then(() => {
        expect(target.messages.length).toEqual(0)
      })
    })

    it('adds a message when there are business key errors', () => {
      const targetObject = [{test: 'a', experimentId: 1},{test: 'a', experimentId: 1}]
      target.getBusinessKeyPropertyNames = mock(['experimentId', 'test'])

      return target.postValidate(targetObject).then(() => {
        expect(target.messages.length).toEqual(1)
      })
    })
  })
})