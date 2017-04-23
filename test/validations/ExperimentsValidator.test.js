import { mock } from '../jestUtil'
import ExperimentsValidator from '../../src/validations/ExperimentsValidator'
import AppError from '../../src/services/utility/AppError'
import db from '../../src/db/DbManager'

describe('ExperimentsValidator', () => {
  let target

  beforeEach(() => {
    target = new ExperimentsValidator()
  })

  describe('get POST_AND_PUT_SCHEMA_ELEMENTS', () => {
    it('gets schema', () => {
      db.experimentDesign = {}
      const schema = [
        { paramName: 'name', type: 'text', lengthRange: { min: 1, max: 100 }, required: true },
        {
          paramName: 'description',
          type: 'text',
          lengthRange: { min: 0, max: 5000 },
          required: false,
        },
        { paramName: 'refExperimentDesignId', type: 'refData', entity: {} },
        { paramName: 'status', type: 'constant', data: ['DRAFT', 'ACTIVE'], required: true },
      ]

      expect(ExperimentsValidator.POST_AND_PUT_SCHEMA_ELEMENTS).toEqual(schema)
    })
  })

  describe('get FILTER_SCHEMA_ELEMENTS', () => {
    it('gets schema', () => {
      const schema = [
        {
          paramName: 'tags.name',
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
    it('returns POST+AND_PUT schema when POST is supplied', () => {
      db.experimentDesign = {}
      const schema = [
        { paramName: 'name', type: 'text', lengthRange: { min: 1, max: 100 }, required: true },
        {
          paramName: 'description',
          type: 'text',
          lengthRange: { min: 0, max: 5000 },
          required: false,
        },
        { paramName: 'refExperimentDesignId', type: 'refData', entity: {} },
        { paramName: 'status', type: 'constant', data: ['DRAFT', 'ACTIVE'], required: true },
      ]

      expect(target.getSchema('POST')).toEqual(schema)
    })

    it('returns POST_AND_PUT schema when POST is supplied', () => {
      db.experimentDesign = {}
      const schema = [
        { paramName: 'name', type: 'text', lengthRange: { min: 1, max: 100 }, required: true },
        {
          paramName: 'description',
          type: 'text',
          lengthRange: { min: 0, max: 5000 },
          required: false,
        },
        { paramName: 'refExperimentDesignId', type: 'refData', entity: {} },
        { paramName: 'status', type: 'constant', data: ['DRAFT', 'ACTIVE'], required: true },
      ]

      expect(target.getSchema('PUT')).toEqual(schema)
    })

    it('returns FILTER schema when FILTER is supplied', () => {
      const schema = [
        {
          paramName: 'tags.name',
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

    it('throws an error when passed in operation is not POST, PUT, or FILTER', () => {
      AppError.badRequest = mock('')

      expect(() => { target.getSchema('test')}).toThrow()
      expect(AppError.badRequest).toHaveBeenCalledWith('Invalid Operation')
    })
  })

  describe('getEntityName', () => {
    it('returns name', () => {
      expect(target.getEntityName()).toEqual('Experiment')
    })
  })

  describe('preValidate', () => {
    it('resolves when experimentObj is a filled array', () => {
      AppError.badRequest = mock()

      return target.preValidate([{}]).then(() => {
        expect(AppError.badRequest).not.toHaveBeenCalled()
      })
    })

    it('rejects when experimentObj is undefined', () => {
      AppError.badRequest = mock()

      return target.preValidate(undefined).then(() => {}, () => {
        expect(AppError.badRequest).toHaveBeenCalledWith('Experiments request object needs to be' +
          ' an array')
      })
    })

    it('rejects when experimentObj is an empty array', () => {
      AppError.badRequest = mock()

      return target.preValidate([]).then(() => {}, () => {
        expect(AppError.badRequest).toHaveBeenCalledWith('Experiments request object needs to be' +
          ' an array')
      })
    })
  })

  describe('postValidate', () => {
    it('resolves', () => {
      return target.postValidate().then(() => {})
    })
  })
})