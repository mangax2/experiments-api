import { mock } from '../jestUtil'
import UnitSpecificationDetailValidator from '../../src/validations/UnitSpecificationDetailValidator'
import AppError from '../../src/services/utility/AppError'
import db from '../../src/db/DbManager'

describe('UnitSpecificationDetailValidator', () => {
  let target

  beforeEach(() => {
    expect.hasAssertions()
    target = new UnitSpecificationDetailValidator()
  })

  describe('get POST_VALIDATION_SCHEMA', () => {
    test('gets the schema', () => {
      db.experiments = {}
      db.unitSpecification = {}
      db.unitSpecificationDetail = {}
      const schema = [
        {
          paramName: 'value', type: 'text', lengthRange: { min: 0, max: 500 }, required: true,
        },
        { paramName: 'uomCode', type: 'text', required: false },
        { paramName: 'refUnitSpecId', type: 'numeric', required: true },
        { paramName: 'refUnitSpecId', type: 'refData', entity: {} },
        { paramName: 'experimentId', type: 'numeric', required: true },
        { paramName: 'experimentId', type: 'refData', entity: {} },
        {
          paramName: 'UnitSpecificationDetail',
          type: 'businessKey',
          keys: ['experimentId', 'refUnitSpecId'],
          entity: {},
        },
      ]

      expect(UnitSpecificationDetailValidator.POST_VALIDATION_SCHEMA).toEqual(schema)
    })
  })

  describe('get PUT_ADDITIONAL_SCHEMA_ELEMENTS', () => {
    test('gets the elements', () => {
      db.unitSpecificationDetail = {}
      const schema = [
        { paramName: 'id', type: 'numeric', required: true },
        { paramName: 'id', type: 'refData', entity: {} },
      ]

      expect(UnitSpecificationDetailValidator.PUT_ADDITIONAL_SCHEMA_ELEMENTS).toEqual(schema)
    })
  })

  describe('getEntityName', () => {
    test('gets name', () => {
      expect(target.getEntityName()).toEqual('UnitSpecificationDetail')
    })
  })

  describe('getSchema', () => {
    test('gets post schema', () => {
      db.experiments = {}
      db.unitSpecification = {}
      db.unitSpecificationDetail = {}
      const schema = [
        {
          paramName: 'value', type: 'text', lengthRange: { min: 0, max: 500 }, required: true,
        },
        { paramName: 'uomCode', type: 'text', required: false },
        { paramName: 'refUnitSpecId', type: 'numeric', required: true },
        { paramName: 'refUnitSpecId', type: 'refData', entity: {} },
        { paramName: 'experimentId', type: 'numeric', required: true },
        { paramName: 'experimentId', type: 'refData', entity: {} },
        {
          paramName: 'UnitSpecificationDetail',
          type: 'businessKey',
          keys: ['experimentId', 'refUnitSpecId'],
          entity: {},
        },
      ]

      expect(target.getSchema('POST')).toEqual(schema)
    })

    test('gets put schema', () => {
      db.experiments = {}
      db.unitSpecification = {}
      db.unitSpecificationDetail = {}
      const schema = [
        {
          paramName: 'value', type: 'text', lengthRange: { min: 0, max: 500 }, required: true,
        },
        { paramName: 'uomCode', type: 'text', required: false },
        { paramName: 'refUnitSpecId', type: 'numeric', required: true },
        { paramName: 'refUnitSpecId', type: 'refData', entity: {} },
        { paramName: 'experimentId', type: 'numeric', required: true },
        { paramName: 'experimentId', type: 'refData', entity: {} },
        {
          paramName: 'UnitSpecificationDetail',
          type: 'businessKey',
          keys: ['experimentId', 'refUnitSpecId'],
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
      expect(AppError.badRequest).toHaveBeenCalledWith('Invalid Operation', undefined, '3G1001')
    })
  })

  describe('getBusinessKeyPropertyNames', () => {
    test('gets business keys', () => {
      expect(target.getBusinessKeyPropertyNames()).toEqual(['experimentId', 'refUnitSpecId'])
    })
  })

  describe('getDuplicateBusinessKeyError', () => {
    test('gets duplicate business keys error message', () => {
      expect(target.getDuplicateBusinessKeyError()).toEqual({ message: 'Duplicate unit specification id in request payload with same experiment id', errorCode: '3G4001' })
    })
  })

  describe('preValidate', () => {
    test('resolves when unitSpecificationDetailObj is a filled array', () => {
      AppError.badRequest = mock()

      return target.preValidate([{}]).then(() => {
        expect(AppError.badRequest).not.toHaveBeenCalled()
      })
    })

    test('rejects when unitSpecificationDetailObj is undefined', () => {
      AppError.badRequest = mock()

      return target.preValidate(undefined).then(() => {}, () => {
        expect(AppError.badRequest).toHaveBeenCalledWith('Unit specification detail request object needs to be an array', undefined, '3G2001')
      })
    })

    test('rejects when unitSpecificationDetailObj is an empty array', () => {
      AppError.badRequest = mock()

      return target.preValidate([]).then(() => {}, () => {
        expect(AppError.badRequest).toHaveBeenCalledWith('Unit specification detail request object needs to be an array', undefined, '3G2001')
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
