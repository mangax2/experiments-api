import { mock } from '../jestUtil'
import DesignSpecificationDetailValidator from '../../src/validations/DesignSpecificationDetailValidator'
import AppError from '../../src/services/utility/AppError'
import db from '../../src/db/DbManager'

describe('DesignSpecificationDetailValidator', () => {
  let target

  beforeEach(() => {
    target = new DesignSpecificationDetailValidator()
  })

  describe('get POST_VALIDATION_SCHEMA', () => {
    test('gets the schema', () => {
      db.designSpecificationDetail = {}
      db.experiments = {}
      db.refDesignSpecification = {}

      const schema = [
        {
          paramName: 'value', type: ['text', 'boolean'], lengthRange: { min: 0, max: 50 }, required: true,
        },
        { paramName: 'refDesignSpecId', type: 'numeric', required: true },
        { paramName: 'refDesignSpecId', type: 'refData', entity: {} },
        { paramName: 'experimentId', type: 'numeric', required: true },
        { paramName: 'experimentId', type: 'refData', entity: {} },
        {
          paramName: 'DesignSpecificationDetail',
          type: 'businessKey',
          keys: ['experimentId', 'refDesignSpecId'],
          entity: {},
        },
      ]

      expect(DesignSpecificationDetailValidator.POST_VALIDATION_SCHEMA).toEqual(schema)
    })
  })

  describe('get PUT_ADDITIONAL_SCHEMA_ELEMENTS', () => {
    test('gets the elements', () => {
      db.designSpecificationDetail = {}
      db.experiments = {}
      db.refDesignSpecification = {}
      const schema = [
        { paramName: 'id', type: 'numeric', required: true },
        { paramName: 'id', type: 'refData', entity: {} },
      ]

      expect(DesignSpecificationDetailValidator.PUT_ADDITIONAL_SCHEMA_ELEMENTS).toEqual(schema)
    })
  })

  describe('getEntityName', () => {
    test('gets name', () => {
      expect(target.getEntityName()).toEqual('DesignSpecificationDetail')
    })
  })

  describe('getSchema', () => {
    test('gets post schema', () => {
      db.designSpecificationDetail = {}
      db.experiments = {}
      db.refDesignSpecification = {}
      const schema = [
        {
          paramName: 'value', type: ['text', 'boolean'], lengthRange: { min: 0, max: 50 }, required: true,
        },
        { paramName: 'refDesignSpecId', type: 'numeric', required: true },
        { paramName: 'refDesignSpecId', type: 'refData', entity: {} },
        { paramName: 'experimentId', type: 'numeric', required: true },
        { paramName: 'experimentId', type: 'refData', entity: {} },
        {
          paramName: 'DesignSpecificationDetail',
          type: 'businessKey',
          keys: ['experimentId', 'refDesignSpecId'],
          entity: {},
        },
      ]

      expect(target.getSchema('POST')).toEqual(schema)
    })

    test('gets put schema', () => {
      db.designSpecificationDetail = {}
      db.experiments = {}
      db.refDesignSpecification = {}
      const schema = [
        {
          paramName: 'value', type: ['text', 'boolean'], lengthRange: { min: 0, max: 50 }, required: true,
        },
        { paramName: 'refDesignSpecId', type: 'numeric', required: true },
        { paramName: 'refDesignSpecId', type: 'refData', entity: {} },
        { paramName: 'experimentId', type: 'numeric', required: true },
        { paramName: 'experimentId', type: 'refData', entity: {} },
        {
          paramName: 'DesignSpecificationDetail',
          type: 'businessKey',
          keys: ['experimentId', 'refDesignSpecId'],
          entity: {},
        },
        { paramName: 'id', type: 'numeric', required: true },
        { paramName: 'id', type: 'refData', entity: {} },
      ]

      expect(target.getSchema('PUT')).toEqual(schema)
    })

    test('error to be thrown when neither POST nor PUT are supplied', () => {
      AppError.badRequest = mock('')

      expect(() => { target.getSchema('test') }).toThrow()
      expect(AppError.badRequest).toHaveBeenCalledWith('Invalid Operation', undefined, '331001')
    })
  })

  describe('getBusinessKeyPropertyNames', () => {
    test('gets business keys', () => {
      expect(target.getBusinessKeyPropertyNames()).toEqual(['experimentId', 'refDesignSpecId'])
    })
  })

  describe('getDuplicateBusinessKeyError', () => {
    test('gets duplicate business keys error message', () => {
      expect(target.getDuplicateBusinessKeyError()).toEqual({ message: 'Duplicate design specification id in request payload with same experiment id', errorCode: '334001' })
    })
  })

  describe('preValidate', () => {
    test('resolves when designSpecificationDetailObj is a filled array', () => {
      AppError.badRequest = mock()

      return target.preValidate([{}]).then(() => {
        expect(AppError.badRequest).not.toHaveBeenCalled()
      })
    })

    test('rejects when designSpecificationDetailObj is undefined', () => {
      AppError.badRequest = mock()

      return target.preValidate(undefined).then(() => {}, () => {
        expect(AppError.badRequest).toHaveBeenCalledWith('Design specification detail request object needs to be an array', undefined, '332001')
      })
    })

    test('rejects when designSpecificationDetailObj is an empty array', () => {
      AppError.badRequest = mock()

      return target.preValidate([]).then(() => {}, () => {
        expect(AppError.badRequest).toHaveBeenCalledWith('Design specification detail request object needs to be an array', undefined, '332001')
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
