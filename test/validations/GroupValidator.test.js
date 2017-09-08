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
    it('gets the schema', () => {
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
    it('returns the schema', () => {
      expect(GroupValidator.PATCH_VALIDATION_SCHEMA)
        .toEqual([{ paramName: 'setId', type: 'numeric', required: true }])
    })
  })

  describe('get PUT_ADDITIONAL_SCHEMA_ELEMENTS', () => {
    it('gets the schema elements', () => {
      db.group = {}
      const schema = [
        { paramName: 'id', type: 'numeric', required: true },
        { paramName: 'id', type: 'refData', entity: {} },
      ]

      expect(GroupValidator.PUT_ADDITIONAL_SCHEMA_ELEMENTS).toEqual(schema)
    })
  })

  describe('getSchema', () => {
    it('returns post schema', () => {
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

    it('returns put schema', () => {
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

    it('returns patch schema', () => {
      db.group = {}
      const schema = [
        { paramName: 'setId', type: 'numeric', required: true },
        { paramName: 'id', type: 'numeric', required: true },
        { paramName: 'id', type: 'refData', entity: {} },
      ]

      expect(target.getSchema('PATCH')).toEqual(schema)
    })

    it('throws an error when PATCH, POST and PUT are not supplied', () => {
      AppError.badRequest = mock('')

      expect(() => {target.getSchema('test')}).toThrow()
      expect(AppError.badRequest).toHaveBeenCalledWith('Invalid Operation')
    })
  })

  describe('getEntityName', () => {
    it('returns name', () => {
      expect(target.getEntityName()).toEqual('Group')
    })
  })

  describe('preValidate', () => {
    it('resolves when groupObj is a filled array', () => {
      AppError.badRequest = mock()

      return target.preValidate([{}]).then(() => {
        expect(AppError.badRequest).not.toHaveBeenCalled()
      })
    })

    it('rejects when groupObj is undefined', () => {
      AppError.badRequest = mock()

      return target.preValidate(undefined).then(() => {}, () => {
        expect(AppError.badRequest).toHaveBeenCalledWith('Group request object' +
          ' needs to be an array')
      })
    })

    it('rejects when groupObj is an empty array', () => {
      AppError.badRequest = mock()

      return target.preValidate([]).then(() => {}, () => {
        expect(AppError.badRequest).toHaveBeenCalledWith('Group request object' +
          ' needs to be an array')
      })
    })
  })

  describe('postValidate', () => {
    it('does not call getValidRandomization and calls validateRandomizationStrategyIds', () => {
      target.strategyRetrievalPromise = Promise.resolve()
      target.getValidRandomizationIds = mock()
      target.validateRandomizationStrategyIds = mock()

      return target.postValidate([{}]).then(() => {
        expect(target.getValidRandomizationIds).not.toHaveBeenCalled()
        expect(target.validateRandomizationStrategyIds).toHaveBeenCalledWith([{}])
      })
    })

    it('calls getValidRandomization and calls validateRandomizationStrategyIds', () => {
      target.getValidRandomizationIds = mock(() => {target.strategyRetrievalPromise = Promise.resolve()})
      target.validateRandomizationStrategyIds = mock()

      return target.postValidate([{}]).then(() => {
        expect(target.getValidRandomizationIds).toHaveBeenCalled()
        expect(target.validateRandomizationStrategyIds).toHaveBeenCalledWith([{}])
      })
    })

    it('rejects when strategyRetrievalPromise fails', () => {
      target.strategyRetrievalPromise = Promise.resolve('error')
      target.validateRandomizationStrategyIds = mock()

      return target.postValidate([{}]).then(() => {}, (err) => {
        expect(target.validateRandomizationStrategyIds).not.toHaveBeenCalled()
        expect(err).toEqual('error')
      })
    })
  })

  describe('validateRandomizationStrategyIds', () => {
    it('resolves when there are no invalid randomization ids', () => {
      target.validRandomizationIds = [1]
      const groupObj = [{refRandomizationStrategyId: 1}]
      AppError.badRequest = mock()

      return target.validateRandomizationStrategyIds(groupObj).then(() => {
        expect(AppError.badRequest).not.toHaveBeenCalled()
      })
    })

    it('rejects when there are invalid randomization ids', () => {
      target.validRandomizationIds = [2]
      const groupObj = [{refRandomizationStrategyId: 1}]
      AppError.badRequest = mock()

      return target.validateRandomizationStrategyIds(groupObj).then(() => {}, () => {
        expect(AppError.badRequest).toHaveBeenCalledWith('Invalid randomization strategy ids: 1')
      })
    })

    it('rejects when there are multiple invalid randomization ids', () => {
      target.validRandomizationIds = [2]
      const groupObj = [{refRandomizationStrategyId: 1}, {refRandomizationStrategyId: 2}, {refRandomizationStrategyId: 3}]
      AppError.badRequest = mock()

      return target.validateRandomizationStrategyIds(groupObj).then(() => {}, () => {
        expect(AppError.badRequest).toHaveBeenCalledWith('Invalid randomization strategy ids: 1, 3')
      })
    })
  })

  describe('getValidRandomizationIds', () => {
    it('calls ping and then randomization strategy service', () => {
      PingUtil.getMonsantoHeader = mockResolve({})
      HttpUtil.getWithRetry = mockResolve({body: [{id: 1}]})

      return target.getValidRandomizationIds().then(() => {
        expect(target.validRandomizationIds).toEqual([1])
      })
    })

    it('does not set any valid ids when result is undefined', () => {
      PingUtil.getMonsantoHeader = mockResolve({})
      HttpUtil.getWithRetry = mockResolve()

      return target.getValidRandomizationIds().then(() => {
        expect(target.validRandomizationIds).toEqual(undefined)
      })
    })

    it('does not set any valid ids when result has no body', () => {
      PingUtil.getMonsantoHeader = mockResolve({})
      HttpUtil.getWithRetry = mockResolve({})

      return target.getValidRandomizationIds().then(() => {
        expect(target.validRandomizationIds).toEqual(undefined)
      })
    })

    it('rejects when HttpUtil get fails', () => {
      PingUtil.getMonsantoHeader = mockResolve({})
      HttpUtil.getWithRetry = mockReject('error')
      AppError.badRequest = mock()

      const resultingPromise = target.getValidRandomizationIds()
      const strategyPromise = target.strategyRetrievalPromise

      return resultingPromise.then(() => {
        expect(target.strategyRetrievalPromise).toEqual(undefined)
        return strategyPromise.then(() => {
          expect(true).toBe(false)
        }, (err) => {
          expect(target.validRandomizationIds).toEqual(undefined)
          expect(AppError.badRequest).toHaveBeenCalledWith('Unable to validate randomization' +
            ' strategy ids.')
        })
      })
    })

    it('rejects when PingUtil getMonsantoHeader fails', () => {
      PingUtil.getMonsantoHeader = mockReject('error')
      HttpUtil.getWithRetry = mockReject('error')
      AppError.badRequest = mock()

      const resultingPromise = target.getValidRandomizationIds()
      const strategyPromise = target.strategyRetrievalPromise

      return resultingPromise.then(() => {
        expect(target.strategyRetrievalPromise).toEqual(undefined)
        return strategyPromise.then(() => {
          expect(true).toBe(false)
        }, (err) => {
          expect(target.validRandomizationIds).toEqual(undefined)
          expect(AppError.badRequest).toHaveBeenCalledWith('Unable to validate randomization' +
            ' strategy ids.')
        })
      })
    })
  })
})