import { mock } from '../jestUtil'
import ExperimentalUnitValidator from '../../src/validations/ExperimentalUnitValidator'
import AppError from '../../src/services/utility/AppError'
import db from '../../src/db/DbManager'

describe('ExperimentalUnitValidator', () => {
  let target

  beforeEach(() => {
    target = new ExperimentalUnitValidator()
  })

  describe('get POST_VALIDATION_SCHEMA', () => {
    test('returns schema', () => {
      db.treatment = {}

      const schema = [
        {
          paramName: 'rep', type: 'numeric', numericRange: { min: 1, max: 999 }, required: true,
        },
        { paramName: 'groupId', type: 'refData', entity: db.group },
        { paramName: 'treatmentId', type: 'numeric', required: true },
        { paramName: 'treatmentId', type: 'refData', entity: {} },
        { paramName: 'setEntryId', type: 'numeric' },
      ]

      expect(ExperimentalUnitValidator.POST_VALIDATION_SCHEMA).toEqual(schema)
    })
  })

  describe('get PATCH_VALIDATION_SCHEMA', () => {
    test('returns schema', () => {
      db.unit = {}

      const schema = [
        { paramName: 'setEntryId', type: 'numeric', required: true },
      ]

      expect(ExperimentalUnitValidator.PATCH_VALIDATION_SCHEMA).toEqual(schema)
    })
  })

  describe('get PUT_ADDITIONAL_SCHEMA_ELEMENTS', () => {
    test('returns schema', () => {
      db.unit = {}

      const schema = [
        { paramName: 'id', type: 'numeric', required: true },
        { paramName: 'id', type: 'refData', entity: {} },
      ]

      expect(ExperimentalUnitValidator.PUT_ADDITIONAL_SCHEMA_ELEMENTS).toEqual(schema)
    })
  })

  describe('getEntityName', () => {
    test('returns name', () => {
      expect(target.getEntityName()).toEqual('ExperimentalUnit')
    })
  })

  describe('getSchema', () => {
    test('returns the POST schema when POST is passed in', () => {
      db.treatment = {}
      const schema = [
        {
          paramName: 'rep', type: 'numeric', numericRange: { min: 1, max: 999 }, required: true,
        },
        { paramName: 'groupId', type: 'refData', entity: db.group },
        { paramName: 'treatmentId', type: 'numeric', required: true },
        { paramName: 'treatmentId', type: 'refData', entity: {} },
        { paramName: 'setEntryId', type: 'numeric' },
      ]

      expect(target.getSchema('POST')).toEqual(schema)
    })

    test('returns the POST and PUT schemas when PUT is passed in', () => {
      db.treatment = {}
      db.unit = {}

      const schema = [
        {
          paramName: 'rep', type: 'numeric', numericRange: { min: 1, max: 999 }, required: true,
        },
        { paramName: 'groupId', type: 'refData', entity: db.group },
        { paramName: 'treatmentId', type: 'numeric', required: true },
        { paramName: 'treatmentId', type: 'refData', entity: {} },
        { paramName: 'setEntryId', type: 'numeric' },
        { paramName: 'id', type: 'numeric', required: true },
        { paramName: 'id', type: 'refData', entity: {} },
      ]

      expect(target.getSchema('PUT')).toEqual(schema)
    })

    test('returns the PATCH and PUT schemas when PATCH is passed in', () => {
      db.treatment = {}
      db.unit = {}

      const schema = [
        { paramName: 'setEntryId', type: 'numeric', required: true },
        { paramName: 'id', type: 'numeric', required: true },
        { paramName: 'id', type: 'refData', entity: {} },
      ]

      expect(target.getSchema('PATCH')).toEqual(schema)
    })

    test('throws an error when request is neither POST nor PUT', () => {
      AppError.badRequest = mock('')

      expect(() => { target.getSchema('test') }).toThrow()
      expect(AppError.badRequest).toHaveBeenCalledWith('Invalid Operation', undefined, '341001')
    })
  })

  describe('preValidate', () => {
    test('resolves when combinationElementObj is a filled array', () => {
      AppError.badRequest = mock()

      return target.preValidate([{}]).then(() => {
        expect(AppError.badRequest).not.toHaveBeenCalled()
      })
    })

    test('rejects when combinationElementObj is undefined', () => {
      AppError.badRequest = mock()

      return target.preValidate(undefined).then(() => {}, () => {
        expect(AppError.badRequest).toHaveBeenCalledWith('ExperimentalUnit request object needs to be an array', undefined, '342001')
      })
    })

    test('rejects when combinationElementObj is an empty array', () => {
      AppError.badRequest = mock()

      return target.preValidate([]).then(() => {}, () => {
        expect(AppError.badRequest).toHaveBeenCalledWith('ExperimentalUnit request object needs to be an array', undefined, '342001')
      })
    })
  })

  describe('postValidate', () => {
    test('resolves', () => target.postValidate().then(() => {}))
  })
})
