import { mock, mockReject, mockResolve } from '../jestUtil'
import GroupValidator from '../../src/validations/GroupValidator'
import AppError from '../../src/services/utility/AppError'
import db from '../../src/db/DbManager'
import HttpUtil from '../../src/services/utility/HttpUtil'
import PingUtil from '../../src/services/utility/PingUtil'

describe('GroupValidator', () => {
  let target

  beforeEach(() => {
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
        { paramName: 'refRandomizationStrategyId', type: 'numeric', required: true },
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
        { paramName: 'refRandomizationStrategyId', type: 'numeric', required: true },
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
        { paramName: 'refRandomizationStrategyId', type: 'numeric', required: true },
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
    test('does not call getValidRandomization and calls validateRandomizationStrategyIds', () => {
      target.strategyRetrievalPromise = Promise.resolve()
      target.getValidRandomizationIds = mock()
      target.validateRandomizationStrategyIds = mock()

      return target.postValidate([{}]).then(() => {
        expect(target.getValidRandomizationIds).not.toHaveBeenCalled()
        expect(target.validateRandomizationStrategyIds).toHaveBeenCalledWith([{}])
      })
    })

    test('calls getValidRandomization and calls validateRandomizationStrategyIds', () => {
      target.getValidRandomizationIds = mock(() => { target.strategyRetrievalPromise = Promise.resolve() })
      target.validateRandomizationStrategyIds = mock()

      return target.postValidate([{}]).then(() => {
        expect(target.getValidRandomizationIds).toHaveBeenCalled()
        expect(target.validateRandomizationStrategyIds).toHaveBeenCalledWith([{}])
      })
    })

    test('rejects when strategyRetrievalPromise fails', () => {
      target.strategyRetrievalPromise = Promise.resolve('error')
      target.validateRandomizationStrategyIds = mock()

      return target.postValidate([{}]).then(() => {}, (err) => {
        expect(target.validateRandomizationStrategyIds).not.toHaveBeenCalled()
        expect(err).toEqual('error')
      })
    })
  })

  describe('validateRandomizationStrategyIds', () => {
    test('resolves when there are no invalid randomization ids', () => {
      target.validRandomizationIds = [1]
      const groupObj = [{ refRandomizationStrategyId: 1 }]
      AppError.badRequest = mock()

      return target.validateRandomizationStrategyIds(groupObj).then(() => {
        expect(AppError.badRequest).not.toHaveBeenCalled()
      })
    })

    test('rejects when there are invalid randomization ids', () => {
      target.validRandomizationIds = [2]
      const groupObj = [{ refRandomizationStrategyId: 1 }]
      AppError.badRequest = mock()

      return target.validateRandomizationStrategyIds(groupObj).then(() => {}, () => {
        expect(AppError.badRequest).toHaveBeenCalledWith('Invalid randomization strategy ids: 1', undefined, '3B4001')
      })
    })

    test('rejects when there are multiple invalid randomization ids', () => {
      target.validRandomizationIds = [2]
      const groupObj = [{ refRandomizationStrategyId: 1 }, { refRandomizationStrategyId: 2 }, { refRandomizationStrategyId: 3 }]
      AppError.badRequest = mock()

      return target.validateRandomizationStrategyIds(groupObj).then(() => {}, () => {
        expect(AppError.badRequest).toHaveBeenCalledWith('Invalid randomization strategy ids: 1, 3', undefined, '3B4001')
      })
    })
  })

  describe('getValidRandomizationIds', () => {
    test('calls ping and then randomization strategy service', () => {
      PingUtil.getMonsantoHeader = mockResolve({})
      HttpUtil.getWithRetry = mockResolve({ body: [{ id: 1 }] })

      return target.getValidRandomizationIds().then(() => {
        expect(target.validRandomizationIds).toEqual([1])
      })
    })

    test('does not set any valid ids when result is undefined', () => {
      PingUtil.getMonsantoHeader = mockResolve({})
      HttpUtil.getWithRetry = mockResolve()

      return target.getValidRandomizationIds().then(() => {
        expect(target.validRandomizationIds).toEqual(undefined)
      })
    })

    test('does not set any valid ids when result has no body', () => {
      PingUtil.getMonsantoHeader = mockResolve({})
      HttpUtil.getWithRetry = mockResolve({})

      return target.getValidRandomizationIds().then(() => {
        expect(target.validRandomizationIds).toEqual(undefined)
      })
    })

    test('rejects when HttpUtil get fails', () => {
      PingUtil.getMonsantoHeader = mockResolve({})
      HttpUtil.getWithRetry = mockReject('error')
      AppError.badRequest = mock()

      const resultingPromise = target.getValidRandomizationIds()
      const strategyPromise = target.strategyRetrievalPromise

      return resultingPromise.then(() => {
        expect(target.strategyRetrievalPromise).toEqual(undefined)
        return strategyPromise.then(() => {
          expect(true).toBe(false)
        }, () => {
          expect(target.validRandomizationIds).toEqual(undefined)
          expect(AppError.badRequest).toHaveBeenCalledWith('Unable to validate randomization strategy ids.', undefined, '3B5001')
        })
      })
    })

    test('rejects when PingUtil getMonsantoHeader fails', () => {
      PingUtil.getMonsantoHeader = mockReject('error')
      HttpUtil.getWithRetry = mockReject('error')
      AppError.badRequest = mock()

      const resultingPromise = target.getValidRandomizationIds()
      const strategyPromise = target.strategyRetrievalPromise

      return resultingPromise.then(() => {
        expect(target.strategyRetrievalPromise).toEqual(undefined)
        return strategyPromise.then(() => {
          expect(true).toBe(false)
        }, () => {
          expect(target.validRandomizationIds).toEqual(undefined)
          expect(AppError.badRequest).toHaveBeenCalledWith('Unable to validate randomization strategy ids.', undefined, '3B5001')
        })
      })
    })
  })
})
