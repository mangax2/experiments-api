import { mock, mockResolve, mockReject } from '../jestUtil'
import OwnerValidator from '../../src/validations/OwnerValidator'
import HttpUtil from '../../src/services/utility/HttpUtil'
import PingUtil from '../../src/services/utility/PingUtil'
import AppError from '../../src/services/utility/AppError'
import db from '../../src/db/DbManager'

describe('OwnerValidator', () => {
  let target
  const testContext = { userId: 'KMCCL' }

  beforeEach(() => {
    target = new OwnerValidator()
  })

  describe('POST_VALIDATION_SCHEMA', () => {
    it('returns the schema', () => {
      const schema = [
        { paramName: 'experimentId', type: 'numeric', required: true },
        { paramName: 'experimentId', type: 'refData', entity: db.experiments },
        {
          paramName: 'userIds',
          type: 'array',
          entityCount: { min: 1 },
          required: true,
        },
      ]

      expect(OwnerValidator.POST_VALIDATION_SCHEMA).toEqual(schema)
    })
  })

  describe('PUT_ADDITIONAL_SCHEMA_ELEMENTS', () => {
    it('returns additional schema elements', () => {
      expect(OwnerValidator.PUT_ADDITIONAL_SCHEMA_ELEMENTS).toEqual([])
    })
  })

  describe('getEntityName', () => {
    it('gets the name of the schema', () => {
      expect(target.getEntityName()).toEqual('Owner')
    })
  })

  describe('getSchema', () => {
    const schema = [
      { paramName: 'experimentId', type: 'numeric', required: true },
      { paramName: 'experimentId', type: 'refData', entity: db.experiments },
      {
        paramName: 'userIds',
        type: 'array',
        entityCount: { min: 1 },
        required: true,
      },
    ]

    it('gets the POST schema when POST is supplied', () => {
      expect(target.getSchema('POST')).toEqual(schema)
    })

    it('gets the POST and PUT combined schema when PUT is supplied', () => {
      expect(target.getSchema('PUT')).toEqual(schema)
    })

    it('throws an error when POST and PUT are not supplied', () => {
      AppError.badRequest = mock('')

      expect(() => {target.getSchema('test')}).toThrow()
      expect(AppError.badRequest).toHaveBeenCalledWith('Invalid Operation')
    })
  })

  describe('preValidate', () => {
    it('rejects when the object is not an array', () => {
      AppError.badRequest = mock()

      return target.preValidate({}).then(() => {}, () => {
        expect(AppError.badRequest).toHaveBeenCalledWith('Owner request object needs to be a' +
          ' populated array')
      })
    })

    it('rejects when the object is an empty array', () => {
      AppError.badRequest = mock()

      return target.preValidate([]).then(() => {}, () => {
        expect(AppError.badRequest).toHaveBeenCalledWith('Owner request object needs to be a' +
          ' populated array')
      })
    })

    it('resolves when the object is a populated array', () => {
      AppError.badRequest = mock()

      return target.preValidate([1]).then(() => {
        expect(AppError.badRequest).not.toHaveBeenCalled()
      })
    })
  })

  describe('postValidate', () => {
    it('resolves when there are errors', () => {
      target.hasErrors = mock(true)
      target.validateUserIds = mock()

      return target.postValidate([], testContext).then(() => {
        expect(target.validateUserIds).not.toHaveBeenCalled()
      })
    })

    it('calls validateUserIds and resolves', () => {
      target.hasErrors = mock(false)
      target.validateUserIds = mockResolve()

      return target.postValidate([{ userIds: ['KMCCL'] }], testContext).then(() => {
        expect(target.validateUserIds).toHaveBeenCalledWith(['KMCCL'], 'KMCCL')
      })
    })

    it('rejects when validateUserIds fails', () => {
      target.hasErrors = mock(false)
      target.validateUserIds = mockReject('error')

      return target.postValidate([{ userIds: ['KMCCL'] }], testContext).then(() => {}, (err) => {
        expect(target.validateUserIds).toHaveBeenCalledWith(['KMCCL'], 'KMCCL')
        expect(err).toEqual('error')
      })
    })
  })

  describe('validateUserIds', () => {
    it('resolves when all user ids are valid, and the user enacting the call is present in the' +
      ' list', () => {
      PingUtil.getMonsantoHeader = mockResolve({})
      HttpUtil.get = mockResolve({ body: [{ id: 'KMCCL' }] })

      return target.validateUserIds(['KMCCL'], 'KMCCL').then(() => {
        expect(PingUtil.getMonsantoHeader).toHaveBeenCalled()
        expect(HttpUtil.get).toHaveBeenCalled()
      })
    })

    it('rejects when the user making the call is not present in the list', () => {
      PingUtil.getMonsantoHeader = mockResolve({})
      HttpUtil.get = mockResolve({ body: [{ id: 'KMCCL' }] })
      AppError.badRequest = mock()

      return target.validateUserIds(['KMCCL'], 'JGORD1').then(() => {}, () => {
        expect(PingUtil.getMonsantoHeader).toHaveBeenCalled()
        expect(HttpUtil.get).toHaveBeenCalled()
        expect(AppError.badRequest).toHaveBeenCalledWith('You cannot remove yourself as an owner')
      })
    })

    it('rejects when the not all users are valid', () => {
      PingUtil.getMonsantoHeader = mockResolve({})
      HttpUtil.get = mockResolve({ body: [{ id: 'KMCCL' }] })
      AppError.badRequest = mock()

      return target.validateUserIds(['KMCCL', 'JGORD1'], 'KMCCL').then(() => {}, () => {
        expect(PingUtil.getMonsantoHeader).toHaveBeenCalled()
        expect(HttpUtil.get).toHaveBeenCalled()
        expect(AppError.badRequest).toHaveBeenCalledWith('Some users listed are invalid: JGORD1')
      })
    })
  })
})