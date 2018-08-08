import { mock } from '../jestUtil'
import GroupValidator from '../../src/validations/GroupValidator'
import AppError from '../../src/services/utility/AppError'
import db from '../../src/db/DbManager'

describe('GroupValidator', () => {
  let target

  beforeEach(() => {
    expect.hasAssertions()
    target = new GroupValidator()
  })

  describe('get POST_VALIDATION_SCHEMA', () => {
    test('gets the schema', () => {
      db.experiments = {}
      db.group = {}
      db.groupType = {}
      const schema = [
        { paramName: 'experimentId', type: 'numeric', required: true },
        { paramName: 'experimentId', type: 'refData', entity: {} },
        { paramName: 'parentId', type: 'numeric', required: false },
        { paramName: 'parentId', type: 'refData', entity: {} },
        { paramName: 'refRandomizationStrategyId', type: 'numeric' },
        { paramName: 'refGroupTypeId', type: 'numeric', required: true },
        { paramName: 'refGroupTypeId', type: 'refData', entity: {} },
      ]

      expect(GroupValidator.POST_VALIDATION_SCHEMA).toEqual(schema)
    })
  })

  describe('get PATCH_VALIDATION_SCHEMA', () => {
    test('returns the schema', () => {
      expect(GroupValidator.PATCH_VALIDATION_SCHEMA)
        .toEqual([{ paramName: 'setId', type: 'numeric', required: true }])
    })
  })

  describe('get PUT_ADDITIONAL_SCHEMA_ELEMENTS', () => {
    test('gets the schema elements', () => {
      db.group = {}
      const schema = [
        { paramName: 'id', type: 'numeric', required: true },
        { paramName: 'id', type: 'refData', entity: {} },
      ]

      expect(GroupValidator.PUT_ADDITIONAL_SCHEMA_ELEMENTS).toEqual(schema)
    })
  })

  describe('getSchema', () => {
    test('returns post schema', () => {
      db.experiments = {}
      db.group = {}
      db.groupType = {}
      const schema = [
        { paramName: 'experimentId', type: 'numeric', required: true },
        { paramName: 'experimentId', type: 'refData', entity: {} },
        { paramName: 'parentId', type: 'numeric', required: false },
        { paramName: 'parentId', type: 'refData', entity: {} },
        { paramName: 'refRandomizationStrategyId', type: 'numeric' },
        { paramName: 'refGroupTypeId', type: 'numeric', required: true },
        { paramName: 'refGroupTypeId', type: 'refData', entity: {} },
      ]

      expect(target.getSchema('POST')).toEqual(schema)
    })

    test('returns put schema', () => {
      db.experiments = {}
      db.group = {}
      db.groupType = {}
      const schema = [
        { paramName: 'experimentId', type: 'numeric', required: true },
        { paramName: 'experimentId', type: 'refData', entity: {} },
        { paramName: 'parentId', type: 'numeric', required: false },
        { paramName: 'parentId', type: 'refData', entity: {} },
        { paramName: 'refRandomizationStrategyId', type: 'numeric' },
        { paramName: 'refGroupTypeId', type: 'numeric', required: true },
        { paramName: 'refGroupTypeId', type: 'refData', entity: {} },
        { paramName: 'id', type: 'numeric', required: true },
        { paramName: 'id', type: 'refData', entity: {} },
      ]

      expect(target.getSchema('PUT')).toEqual(schema)
    })

    test('returns patch schema', () => {
      db.group = {}
      const schema = [
        { paramName: 'setId', type: 'numeric', required: true },
        { paramName: 'id', type: 'numeric', required: true },
        { paramName: 'id', type: 'refData', entity: {} },
      ]

      expect(target.getSchema('PATCH')).toEqual(schema)
    })

    test('throws an error when PATCH, POST and PUT are not supplied', () => {
      AppError.badRequest = mock('')

      expect(() => { target.getSchema('test') }).toThrow()
      expect(AppError.badRequest).toHaveBeenCalledWith('Invalid Operation', undefined, '3B1001')
    })
  })

  describe('getEntityName', () => {
    test('returns name', () => {
      expect(target.getEntityName()).toEqual('Group')
    })
  })

  describe('preValidate', () => {
    test('resolves when groupObj is a filled array', () => {
      AppError.badRequest = mock()

      return target.preValidate([{}]).then(() => {
        expect(AppError.badRequest).not.toHaveBeenCalled()
      })
    })

    test('rejects when groupObj is undefined', () => {
      AppError.badRequest = mock()

      return target.preValidate(undefined).then(() => {}, () => {
        expect(AppError.badRequest).toHaveBeenCalledWith('Group request object needs to be an array', undefined, '3B2001')
      })
    })

    test('rejects when groupObj is an empty array', () => {
      AppError.badRequest = mock()

      return target.preValidate([]).then(() => {}, () => {
        expect(AppError.badRequest).toHaveBeenCalledWith('Group request object needs to be an array', undefined, '3B2001')
      })
    })
  })

  describe('postValidate', () => {
    test('resolves', () => expect(target.postValidate()).resolves.toBe(undefined))
  })
})
