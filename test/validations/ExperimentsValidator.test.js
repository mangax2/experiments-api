import { mock } from '../jestUtil'
import ExperimentsValidator from '../../src/validations/ExperimentsValidator'
import AppError from '../../src/services/utility/AppError'
import { dbRead } from '../../src/db/DbManager'

describe('ExperimentsValidator', () => {
  let target

  beforeEach(() => {
    target = new ExperimentsValidator()
  })

  describe('get POST_AND_PUT_SCHEMA_ELEMENTS', () => {
    test('gets schema', () => {
      dbRead.experimentDesign = {}
      const schema = [
        {
          paramName: 'name', type: 'text', lengthRange: { min: 1, max: 100 }, required: true,
        },
        {
          paramName: 'description',
          type: 'text',
          lengthRange: { min: 0, max: 5000 },
          required: false,
        },
        { paramName: 'refExperimentDesignId', type: 'refData', entity: {} },
        { paramName: 'status', type: 'constant', data: ['DRAFT', 'ACTIVE', 'SUBMITTED', 'APPROVED', 'REJECTED'] },
        { paramName: 'is_template', type: 'boolean' },
        { paramName: 'randomizationStrategyCode', type: 'text', lengthRange: { min: 1, max: 1000 } },
      ]

      expect(ExperimentsValidator.POST_AND_PUT_SCHEMA_ELEMENTS).toEqual(schema)
    })
  })

  describe('get FILTER_SCHEMA_ELEMENTS', () => {
    test('gets schema', () => {
      const schema = [
        {
          paramName: 'tags.category',
          type: 'text',
          lengthRange: { min: 1, max: 1000 },
          required: false,
        },
        {
          paramName: 'tags.value',
          type: 'text',
          lengthRange: { min: 1, max: 1000 },
          required: false,
        },
      ]

      expect(ExperimentsValidator.FILTER_SCHEMA_ELEMENTS).toEqual(schema)
    })
  })

  describe('getSchema', () => {
    test('returns POST+AND_PUT schema when POST is supplied', () => {
      dbRead.experimentDesign = {}
      const schema = [
        {
          paramName: 'name', type: 'text', lengthRange: { min: 1, max: 100 }, required: true,
        },
        {
          paramName: 'description',
          type: 'text',
          lengthRange: { min: 0, max: 5000 },
          required: false,
        },
        { paramName: 'refExperimentDesignId', type: 'refData', entity: {} },
        { paramName: 'status', type: 'constant', data: ['DRAFT', 'ACTIVE', 'SUBMITTED', 'APPROVED', 'REJECTED'] },
        { paramName: 'is_template', type: 'boolean' },
        { paramName: 'randomizationStrategyCode', type: 'text', lengthRange: { min: 1, max: 1000 } },
      ]

      expect(target.getSchema('POST')).toEqual(schema)
    })

    test('returns POST_AND_PUT schema when POST is supplied', () => {
      dbRead.experimentDesign = {}
      const schema = [
        {
          paramName: 'name', type: 'text', lengthRange: { min: 1, max: 100 }, required: true,
        },
        {
          paramName: 'description',
          type: 'text',
          lengthRange: { min: 0, max: 5000 },
          required: false,
        },
        { paramName: 'refExperimentDesignId', type: 'refData', entity: {} },
        { paramName: 'status', type: 'constant', data: ['DRAFT', 'ACTIVE', 'SUBMITTED', 'APPROVED', 'REJECTED'] },
        { paramName: 'is_template', type: 'boolean' },
        { paramName: 'randomizationStrategyCode', type: 'text', lengthRange: { min: 1, max: 1000 } },
      ]

      expect(target.getSchema('PUT')).toEqual(schema)
    })

    test('returns FILTER schema when FILTER is supplied', () => {
      const schema = [
        {
          paramName: 'tags.category',
          type: 'text',
          lengthRange: { min: 1, max: 1000 },
          required: false,
        },
        {
          paramName: 'tags.value',
          type: 'text',
          lengthRange: { min: 1, max: 1000 },
          required: false,
        },
      ]

      expect(target.getSchema('FILTER')).toEqual(schema)
    })

    test('throws an error when passed in operation is not POST, PUT, or FILTER', () => {
      AppError.badRequest = mock('')

      expect(() => { target.getSchema('test') }).toThrow()
      expect(AppError.badRequest).toHaveBeenCalledWith('Invalid Operation', undefined, '361001')
    })
  })

  describe('getEntityName', () => {
    test('returns name', () => {
      expect(target.getEntityName()).toEqual('Experiment')
    })
  })

  describe('preValidate', () => {
    test('resolves when experimentObj is a filled array', () => {
      AppError.badRequest = mock()

      return target.preValidate([{}]).then(() => {
        expect(AppError.badRequest).not.toHaveBeenCalled()
      })
    })

    test('rejects when experimentObj is undefined', () => {
      AppError.badRequest = mock()

      return target.preValidate(undefined).then(() => {}, () => {
        expect(AppError.badRequest).toHaveBeenCalledWith('Experiments request object needs to be an array', undefined, '362001')
      })
    })

    test('rejects when experimentObj is an empty array', () => {
      AppError.badRequest = mock()

      return target.preValidate([]).then(() => {}, () => {
        expect(AppError.badRequest).toHaveBeenCalledWith('Experiments request object needs to be an array', undefined, '362001')
      })
    })
    test('rejects when experimentObj is not an array with Istemplate True', () => {
      AppError.badRequest = mock()

      return target.preValidate({ isTemplate: true }).then(() => {}, () => {
        expect(AppError.badRequest).toHaveBeenCalledWith('Templates request object needs to be an array', undefined, '362001')
      })
    })
  })

  describe('postValidate', () => {
    test('resolves', () => expect(target.postValidate()).resolves.toBe(undefined))
  })
})
