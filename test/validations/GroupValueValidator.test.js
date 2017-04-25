import { mock } from '../jestUtil'
import GroupValueValidator from '../../src/validations/GroupValueValidator'
import AppError from '../../src/services/utility/AppError'
import db from '../../src/db/DbManager'

describe('GroupValueValidator', () => {
  let target

  beforeEach(() => {
    target = new GroupValueValidator()
  })

  describe('get POST_VALIDATION_SCHEMA', () => {
    it('returns the schema', () => {
      db.group = {}
      db.groupValue = {}
      const schema = [
        { paramName: 'name', type: 'text', lengthRange: { min: 1, max: 500 }, required: false },
        { paramName: 'value', type: 'text', lengthRange: { min: 0, max: 500 }, required: false },
        { paramName: 'groupId', type: 'numeric', required: true },
        { paramName: 'groupId', type: 'refData', entity: {} },
        {
          paramName: 'GroupValue',
          type: 'businessKey',
          keys: ['groupId', 'name'],
          entity: {},
        },
      ]

      expect(GroupValueValidator.POST_VALIDATION_SCHEMA).toEqual(schema)
    })
  })

  describe('get PUT_ADDITIONAL_SCHEMA_ELEMENTS', () => {
    it('returns the elements', () =>{
      db.groupValue = {}
      const schema = [
        { paramName: 'id', type: 'numeric', required: true },
        { paramName: 'id', type: 'refData', entity: {} },
      ]

      expect(GroupValueValidator.PUT_ADDITIONAL_SCHEMA_ELEMENTS).toEqual(schema)
    })
  })

  describe('getSchema', () => {
    it('returns post schema', () => {
      db.group = {}
      db.groupValue = {}
      const schema = [
        { paramName: 'name', type: 'text', lengthRange: { min: 1, max: 500 }, required: false },
        { paramName: 'value', type: 'text', lengthRange: { min: 0, max: 500 }, required: false },
        { paramName: 'groupId', type: 'numeric', required: true },
        { paramName: 'groupId', type: 'refData', entity: {} },
        {
          paramName: 'GroupValue',
          type: 'businessKey',
          keys: ['groupId', 'name'],
          entity: {},
        },
      ]

      expect(target.getSchema('POST')).toEqual(schema)
    })

    it('returns put schema', () => {
      db.group = {}
      db.groupValue = {}
      const schema = [
        { paramName: 'name', type: 'text', lengthRange: { min: 1, max: 500 }, required: false },
        { paramName: 'value', type: 'text', lengthRange: { min: 0, max: 500 }, required: false },
        { paramName: 'groupId', type: 'numeric', required: true },
        { paramName: 'groupId', type: 'refData', entity: {} },
        {
          paramName: 'GroupValue',
          type: 'businessKey',
          keys: ['groupId', 'name'],
          entity: {},
        },
        { paramName: 'id', type: 'numeric', required: true },
        { paramName: 'id', type: 'refData', entity: {} },
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
      expect(target.getEntityName()).toEqual('GroupValue')
    })
  })

  describe('getBusinessKeyPropertyNames', () => {
    it('returns business key names', () => {
      expect(target.getBusinessKeyPropertyNames()).toEqual(['groupId', 'name'])
    })
  })

  describe('getDuplicateBusinessKeyError', () => {
    it('returns duplicate business key error', () => {
      expect(target.getDuplicateBusinessKeyError()).toEqual('Duplicate name and value ' +
        'in request payload with same groupId')
    })
  })

  describe('preValidate', () => {
    it('resolves when groupValueObj is a filled array and has name and value filled', () => {
      AppError.badRequest = mock()

      return target.preValidate([{name: 'test', value: 'testValue'}]).then(() => {
        expect(AppError.badRequest).not.toHaveBeenCalled()
      })
    })

    it('rejects when groupValueObj is missing name', () => {
      AppError.badRequest = mock()

      return target.preValidate([{value: 'testValue'}]).then(() => {}, () => {
        expect(AppError.badRequest).toHaveBeenCalledWith('Group Values must have a name and a' +
          ' value')
      })
    })

    it('rejects when groupValueObj is missing value', () => {
      AppError.badRequest = mock()

      return target.preValidate([{name: 'test'}]).then(() => {}, () => {
        expect(AppError.badRequest).toHaveBeenCalledWith('Group Values must have a name and a' +
          ' value')
      })
    })

    it('rejects when groupValueObj is undefined', () => {
      AppError.badRequest = mock()

      return target.preValidate(undefined).then(() => {}, () => {
        expect(AppError.badRequest).toHaveBeenCalledWith('Group Value request object' +
          ' needs to be an array')
      })
    })

    it('rejects when groupValueObj is an empty array', () => {
      AppError.badRequest = mock()

      return target.preValidate([]).then(() => {}, () => {
        expect(AppError.badRequest).toHaveBeenCalledWith('Group Value request object' +
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
      const targetObject = [{test: 'a', groupId: 1},{test: 'b', groupId: 1}]
      target.getBusinessKeyPropertyNames = mock(['groupId', 'test'])

      return target.postValidate(targetObject).then(() => {
        expect(target.messages.length).toEqual(0)
      })
    })

    it('adds a message when there are business key errors', () => {
      const targetObject = [{test: 'a', groupId: 1},{test: 'a', groupId: 1}]
      target.getBusinessKeyPropertyNames = mock(['groupId', 'test'])

      return target.postValidate(targetObject).then(() => {
        expect(target.messages.length).toEqual(1)
      })
    })
  })
})