import { mock } from '../jestUtil'
import TagValidator from '../../src/validations/TagValidator'
import AppError from '../../src/services/utility/AppError'
import db from '../../src/db/DbManager'

describe('TagValidator', () => {
  let target

  beforeEach(() => {
    target = new TagValidator()
  })

  describe('get POST_VALIDATION_SCHEMA', () => {
    db.experiments = {}
    db.tag = {}
    const schema = [
      { paramName: 'name', type: 'text', lengthRange: { min: 1, max: 500 }, required: true },
      { paramName: 'value', type: 'text', lengthRange: { min: 1, max: 500 }, required: true },
      { paramName: 'experimentId', type: 'numeric', required: true },
      { paramName: 'experimentId', type: 'refData', entity: {} },
      {
        paramName: 'Tag',
        type: 'businessKey',
        keys: ['name', 'value', 'experimentId'],
        entity: {},
      },
    ]

    expect(TagValidator.POST_VALIDATION_SCHEMA).toEqual(schema)
  })

  describe('get PUT_ADDITIONAL_SCHEMA_ELEMENTS', () => {
    db.tag = {}
    const schema = [
      { paramName: 'id', type: 'numeric', required: true },
      { paramName: 'id', type: 'refData', entity: db.tag },
    ]

    expect(TagValidator.PUT_ADDITIONAL_SCHEMA_ELEMENTS).toEqual(schema)
  })

  describe('getSchema', () => {
    it('returns post schema', () => {
      db.experiments = {}
      db.tag = {}
      const schema = [
        { paramName: 'name', type: 'text', lengthRange: { min: 1, max: 500 }, required: true },
        { paramName: 'value', type: 'text', lengthRange: { min: 1, max: 500 }, required: true },
        { paramName: 'experimentId', type: 'numeric', required: true },
        { paramName: 'experimentId', type: 'refData', entity: {} },
        {
          paramName: 'Tag',
          type: 'businessKey',
          keys: ['name', 'value', 'experimentId'],
          entity: {},
        },
      ]

      expect(target.getSchema('POST')).toEqual(schema)
    })

    it('returns put schema', () => {
      db.experiments = {}
      db.tag = {}
      const schema = [
        { paramName: 'name', type: 'text', lengthRange: { min: 1, max: 500 }, required: true },
        { paramName: 'value', type: 'text', lengthRange: { min: 1, max: 500 }, required: true },
        { paramName: 'experimentId', type: 'numeric', required: true },
        { paramName: 'experimentId', type: 'refData', entity: {} },
        {
          paramName: 'Tag',
          type: 'businessKey',
          keys: ['name', 'value', 'experimentId'],
          entity: {},
        },
        { paramName: 'id', type: 'numeric', required: true },
        { paramName: 'id', type: 'refData', entity: db.tag },
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
      expect(target.getEntityName()).toEqual('Tag')
    })
  })

  describe('getBusinessKeyPropertyNames', () => {
    it('returns business key names', () => {
      expect(target.getBusinessKeyPropertyNames()).toEqual(['name', 'value', 'experimentId'])
    })
  })

  describe('getDuplicateBusinessKeyError', () => {
    it('returns duplicate business key error', () => {
      expect(target.getDuplicateBusinessKeyError()).toEqual('Duplicate Tag in' +
        ' request payload with same experiment id')
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
        expect(AppError.badRequest).toHaveBeenCalledWith('Tag request object' +
          ' needs to be an array')
      })
    })

    it('rejects when dependentObj is an empty array', () => {
      AppError.badRequest = mock()

      return target.preValidate([]).then(() => {}, () => {
        expect(AppError.badRequest).toHaveBeenCalledWith('Tag request object' +
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
      const targetObject = [{name: 'a', value: 1, experimentId: 1},{name: 'b', value: 2, experimentId: 1}]
      target.getBusinessKeyPropertyNames = mock(['namae', 'value', 'experimentId'])

      return target.postValidate(targetObject).then(() => {
        expect(target.messages.length).toEqual(0)
      })
    })

    it('adds a message when there are business key errors', () => {
      const targetObject = [{name: 'a', value: 1, experimentId: 1},{name: 'a', value: 1, experimentId: 1}]
      target.getBusinessKeyPropertyNames = mock(['name', 'value', 'experimentId'])

      return target.postValidate(targetObject).then(() => {
        expect(target.messages.length).toEqual(1)
      })
    })
  })
})