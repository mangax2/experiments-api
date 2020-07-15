import { mock, mockResolve, mockReject } from '../jestUtil'
import OwnerValidator from '../../src/validations/OwnerValidator'
import HttpUtil from '../../src/services/utility/HttpUtil'
import apiUrls from '../../src/config/apiUrls'

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
    test('returns the schema', () => {
      const schema = [
        { paramName: 'experimentId', type: 'numeric', required: true },
        { paramName: 'experimentId', type: 'refData', entity: db.experiments },
        {
          paramName: 'userIds',
          type: 'array',
          entityCount: { min: 0 },
          required: false,
        },
        {
          paramName: 'groupIds',
          type: 'array',
          entityCount: { min: 0 },
          required: false,
        },
      ]

      expect(OwnerValidator.POST_VALIDATION_SCHEMA).toEqual(schema)
    })
  })

  describe('PUT_ADDITIONAL_SCHEMA_ELEMENTS', () => {
    test('returns additional schema elements', () => {
      expect(OwnerValidator.PUT_ADDITIONAL_SCHEMA_ELEMENTS).toEqual([])
    })
  })

  describe('getEntityName', () => {
    test('gets the name of the schema', () => {
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
        entityCount: { min: 0 },
        required: false,
      },
      {
        paramName: 'groupIds',
        type: 'array',
        entityCount: { min: 0 },
        required: false,
      },
    ]

    test('gets the POST schema when POST is supplied', () => {
      expect(target.getSchema('POST')).toEqual(schema)
    })

    test('gets the POST and PUT combined schema when PUT is supplied', () => {
      expect(target.getSchema('PUT')).toEqual(schema)
    })

    test('throws an error when POST and PUT are not supplied', () => {
      AppError.badRequest = mock('')

      expect(() => { target.getSchema('test') }).toThrow()
      expect(AppError.badRequest).toHaveBeenCalledWith('Invalid Operation', undefined, '3D1001')
    })
  })

  describe('preValidate', () => {
    test('rejects when the object is not an array', () => {
      AppError.badRequest = mock()

      return target.preValidate({}).then(() => {}, () => {
        expect(AppError.badRequest).toHaveBeenCalledWith('Owner request object needs to be a populated array', undefined, '3D2001')
      })
    })

    test('rejects when the object is an empty array', () => {
      AppError.badRequest = mock()

      return target.preValidate([]).then(() => {}, () => {
        expect(AppError.badRequest).toHaveBeenCalledWith('Owner request object needs to be a populated array', undefined, '3D2001')
      })
    })

    test('resolves when the object is a populated array', () => {
      AppError.badRequest = mock()

      return target.preValidate([1]).then(() => {
        expect(AppError.badRequest).not.toHaveBeenCalled()
      })
    })
  })

  describe('postValidate', () => {
    test('resolves when there are errors', () => {
      target.hasErrors = mock(true)
      target.requiredOwnerCheck = mock()
      target.validateUserIds = mock()
      target.validateGroupIds = mock()

      return target.postValidate([], testContext).then(() => {
        expect(target.validateUserIds).not.toHaveBeenCalled()
      })
    })

    test('calls validateUserIds and resolves', () => {
      target.hasErrors = mock(false)
      target.requiredOwnerCheck = mockResolve()
      target.validateUserIds = mockResolve()
      target.validateGroupIds = mockResolve()
      target.userOwnershipCheck = mockResolve()

      return target.postValidate([{ userIds: ['KMCCL'] }], testContext).then(() => {
        expect(target.validateUserIds).toHaveBeenCalledWith(['KMCCL'])
      })
    })

    test('calls validateGroupIds and resolves', () => {
      target.hasErrors = mock(false)
      target.requiredOwnerCheck = mockResolve()
      target.validateUserIds = mockResolve()
      target.validateGroupIds = mockResolve()
      target.userOwnershipCheck = mockResolve()

      return target.postValidate([{ groupIds: ['group1'] }], testContext).then(() => {
        expect(target.validateGroupIds).toHaveBeenCalledWith(['group1'])
      })
    })

    test('rejects when validateUserIds fails', () => {
      const error = { message: 'error' }
      target.hasErrors = mock(false)
      target.validateUserIds = mockReject(error)

      return target.postValidate([{ userIds: ['KMCCL'] }], testContext).then(() => {}, (err) => {
        expect(target.validateUserIds).toHaveBeenCalledWith(['KMCCL'])
        expect(err).toEqual(error)
      })
    })
  })

  describe('requiredOwnerCheck', () => {
    test('resolves when  userIds is present', () => {
      AppError.badRequest = mock()
      return target.requiredOwnerCheck([], ['user1', 'user2']).then(() => {
        expect(AppError.badRequest).not.toHaveBeenCalled()
      })
    })

    test('resolves when  groupIds is present', () => {
      AppError.badRequest = mock()
      return target.requiredOwnerCheck(['user1', 'user2'], []).then(() => {
        expect(AppError.badRequest).not.toHaveBeenCalled()
      })
    })

    test('rejects when both userIds and groupIds are empty', () => {
      PingUtil.getMonsantoHeader = mockResolve({})
      HttpUtil.get = mockResolve({ body: [{ id: 'KMCCL' }] })
      AppError.badRequest = mock()

      return target.requiredOwnerCheck([], []).then(() => {}, () => {
        expect(AppError.badRequest).toHaveBeenCalledWith('Owner is required in request', undefined, '3D4001')
      })
    })
  })

  describe('validateUserIds', () => {
    test('Resolves  when userIds is empty', () => {
      AppError.badRequest = mock()
      return target.validateUserIds([]).then(() => {
        expect(AppError.badRequest).not.toHaveBeenCalledWith()
      })
    })

    test('resolves when all user ids are valid, and the user enacting the call is present in the' +
      ' list', () => {
      PingUtil.getMonsantoHeader = mockResolve({})
      HttpUtil.post = mockResolve({ body: { data: { getUsersById: [{ id: 'KMCCL' }] } } })

      return target.validateUserIds(['KMCCL']).then(() => {
        expect(PingUtil.getMonsantoHeader).toHaveBeenCalled()
        expect(HttpUtil.post).toHaveBeenCalled()
      })
    })

    test('rejects when PAPI returns errors', () => {
      PingUtil.getMonsantoHeader = mockResolve({})
      HttpUtil.post = mockResolve({ body: { errors: [{}] } })
      AppError.badRequest = mock()

      return target.validateUserIds(['KMCCL', 'JGORD1']).then(() => {}, () => {
        expect(PingUtil.getMonsantoHeader).toHaveBeenCalled()
        expect(HttpUtil.post).toHaveBeenCalled()
        expect(AppError.badRequest).toHaveBeenCalledWith('Profile API encountered an error', [{}], '3D5002')
      })
    })

    test('rejects when the not all users are valid', () => {
      PingUtil.getMonsantoHeader = mockResolve({})
      HttpUtil.post = mockResolve({ body: { data: { getUsersById: [{ id: 'KMCCL' }] } } })
      AppError.badRequest = mock()

      return target.validateUserIds(['KMCCL', 'JGORD1']).then(() => {}, () => {
        expect(PingUtil.getMonsantoHeader).toHaveBeenCalled()
        expect(HttpUtil.post).toHaveBeenCalled()
        expect(AppError.badRequest).toHaveBeenCalledWith('Some users listed are invalid: JGORD1', undefined, '3D5001')
      })
    })
  })

  describe('validateGroupIds', () => {
    test('resolves when groupIds is empty', () => {
      PingUtil.getMonsantoHeader = mockResolve({})
      HttpUtil.post = mockResolve({ body: { data: { getGroupsById: [{ id: 'group1' }] } } })

      return target.validateGroupIds([]).then(() => {
        expect(PingUtil.getMonsantoHeader).not.toHaveBeenCalled()
      })
    })

    test('resolves when all group ids are valid, and the user enacting the call is present in the list', () => {
      PingUtil.getMonsantoHeader = mockResolve({})
      HttpUtil.post = mockResolve({ body: { data: { getGroupsById: [{ id: 'group1' }] } } })

      return target.validateGroupIds(['group1']).then(() => {
        expect(PingUtil.getMonsantoHeader).toHaveBeenCalled()
        expect(HttpUtil.post).toHaveBeenCalledWith(`${apiUrls.profileAPIUrl}/graphql`, {}, { query: '{ getGroupsById(ids:["group1"]){ id } }' })
      })
    })

    test('rejects when PAPI returns errors', () => {
      PingUtil.getMonsantoHeader = mockResolve({})
      HttpUtil.post = mockResolve({ body: { errors: [{}] } })
      AppError.badRequest = mock()

      return target.validateGroupIds(['group1', 'group2']).then(() => {}, () => {
        expect(PingUtil.getMonsantoHeader).toHaveBeenCalled()
        expect(HttpUtil.post).toHaveBeenCalled()
        expect(AppError.badRequest).toHaveBeenCalledWith('Profile API encountered an error', [{}], '3D6002')
      })
    })

    test('rejects when the not all groups are valid', () => {
      PingUtil.getMonsantoHeader = mockResolve({})
      HttpUtil.post = mockResolve({ body: { data: { getGroupsById: [{ id: 'group1' }] } } })
      AppError.badRequest = mock()

      return target.validateGroupIds(['group1', 'group2']).then(() => {}, () => {
        expect(PingUtil.getMonsantoHeader).toHaveBeenCalled()
        expect(HttpUtil.post).toHaveBeenCalled()
        expect(AppError.badRequest).toHaveBeenCalledWith('Some groups listed are invalid: group2', undefined, '3D6001')
      })
    })
  })

  describe('userOwnershipCheck', () => {
    test('resolves when userId is present in userIds', () => {
      PingUtil.getMonsantoHeader = mockResolve({})
      HttpUtil.post = mockResolve({ body: { data: { getUserById: { groups: [{ id: 'group1' }] } } } })

      return target.userOwnershipCheck(['group1'], ['user1'], 'user1').then(() => {
        expect(PingUtil.getMonsantoHeader).not.toHaveBeenCalled()
      })
    })

    test('rejects when PAPI returns errors', () => {
      PingUtil.getMonsantoHeader = mockResolve({})
      HttpUtil.post = mockResolve({ body: { errors: [{}] } })
      AppError.badRequest = mock()

      return target.userOwnershipCheck(['group1'], ['user1'], 'user2').then(() => {}, () => {
        expect(PingUtil.getMonsantoHeader).toHaveBeenCalled()
        expect(HttpUtil.post).toHaveBeenCalledWith(`${apiUrls.profileAPIUrl}/graphql`, {}, { query: '{ getUserById(id:"user2"){ id, groups{ id } }}' })
        expect(AppError.badRequest).toHaveBeenCalledWith('Profile API encountered an error', [{}], '3D7002')
      })
    })

    test('rejects when userId is not the owner', () => {
      PingUtil.getMonsantoHeader = mockResolve({})
      HttpUtil.post = mockResolve({ body: { data: { getUserById: { groups: [{ id: 'group1' }] } } } })
      AppError.badRequest = mock('')

      return target.userOwnershipCheck([], ['user1'], 'user2').then(() => {}, () => {
        expect(PingUtil.getMonsantoHeader).toHaveBeenCalled()
        expect(AppError.badRequest).toHaveBeenCalledWith('You cannot remove yourself as an owner', undefined, '3D7001')
      })
    })

    test('Promise Resolves when userId is in group', () => {
      PingUtil.getMonsantoHeader = mockResolve({})
      HttpUtil.post = mockResolve({ body: { data: { getUserById: { groups: [{ id: 'group2' }] } } } })
      AppError.badRequest = mock()

      return target.userOwnershipCheck(['group2'], ['user1'], 'user2').then(() => {
        expect(PingUtil.getMonsantoHeader).toHaveBeenCalled()
        expect(HttpUtil.post).toHaveBeenCalledWith(`${apiUrls.profileAPIUrl}/graphql`, {}, { query: '{ getUserById(id:"user2"){ id, groups{ id } }}' })
      })
    })

    test('resolves when user is in the admin group', () => {
      PingUtil.getMonsantoHeader = mockResolve({})
      HttpUtil.post = mockResolve({ body: { data: { getUserById: { groups: [{ id: 'COSMOS-ADMIN' }] } } } })

      return target.userOwnershipCheck([], [], 'user').then(() => {
        expect(PingUtil.getMonsantoHeader).toHaveBeenCalled()
        expect(HttpUtil.post).toHaveBeenCalledWith(`${apiUrls.profileAPIUrl}/graphql`, {}, { query: '{ getUserById(id:"user"){ id, groups{ id } }}' })
      })
    })

    test('rejects when userId is not the owner and not in group or admin group', () => {
      PingUtil.getMonsantoHeader = mockResolve({})
      HttpUtil.post = mockResolve({ body: { data: { getUserById: { groups: [{ id: 'group2' }] } } } })
      AppError.badRequest = mock()

      return target.userOwnershipCheck(['group1'], ['user1'], 'user2').then(() => {}, () => {
        expect(PingUtil.getMonsantoHeader).toHaveBeenCalled()
        expect(HttpUtil.post).toHaveBeenCalledWith(`${apiUrls.profileAPIUrl}/graphql`, {}, { query: '{ getUserById(id:"user2"){ id, groups{ id } }}' })
        expect(AppError.badRequest).toHaveBeenCalledWith('You cannot remove yourself as an owner', undefined, '3D7001')
      })
    })

    test('rejects when no userIds or groupIds have been specified, and not in admin group', () => {
      PingUtil.getMonsantoHeader = mockResolve({})
      HttpUtil.post = mockResolve({ body: { data: { getUserById: { groups: [{ id: 'group2' }] } } } })
      AppError.badRequest = mock()

      return target.userOwnershipCheck([], [], 'user2').then(() => {}, () => {
        expect(PingUtil.getMonsantoHeader).toHaveBeenCalled()
        expect(HttpUtil.post).toHaveBeenCalledWith(`${apiUrls.profileAPIUrl}/graphql`, {}, { query: '{ getUserById(id:"user2"){ id, groups{ id } }}' })

        expect(AppError.badRequest).toHaveBeenCalledWith('You cannot remove yourself as an owner', undefined, '3D7001')
      })
    })
  })
})
