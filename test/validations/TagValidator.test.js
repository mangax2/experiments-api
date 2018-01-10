import { mock } from '../jestUtil'
import TagValidator from '../../src/validations/TagValidator'
import AppError from '../../src/services/utility/AppError'
import db from '../../src/db/DbManager'

describe('TagValidator', () => {
  let target

  beforeEach(() => {
    target = new TagValidator()
  })

  describe('get VALIDATION_SCHEMA', () => {
    db.experiments = {}
    const schema = [
      {
        paramName: 'category', type: 'text', lengthRange: { min: 1, max: 500 }, required: true,
      },
      {
        paramName: 'value', type: 'text', lengthRange: { min: 1, max: 500 }, required: true,
      },
      { paramName: 'experimentId', type: 'numeric', required: true },
    ]

    expect(TagValidator.VALIDATION_SCHEMA).toEqual(schema)
  })


  describe('getSchema', () => {
    test('returns schema', () => {
      db.experiments = {}
      const schema = [
        {
          paramName: 'category', type: 'text', lengthRange: { min: 1, max: 500 }, required: true,
        },
        {
          paramName: 'value', type: 'text', lengthRange: { min: 1, max: 500 }, required: true,
        },
        { paramName: 'experimentId', type: 'numeric', required: true },
      ]

      expect(target.getSchema()).toEqual(schema)
    })
  })

  describe('getEntityName', () => {
    test('returns name', () => {
      expect(target.getEntityName()).toEqual('Tag')
    })
  })

  describe('getBusinessKeyPropertyNames', () => {
    test('returns business key names', () => {
      expect(target.getBusinessKeyPropertyNames()).toEqual(['category', 'value', 'experimentId'])
    })
  })

  describe('getDuplicateBusinessKeyError', () => {
    test('returns duplicate business key error', () => {
      expect(target.getDuplicateBusinessKeyError()).toEqual('Duplicate Tag in' +
        ' request payload with same experiment id')
    })
  })

  describe('preValidate', () => {
    test('resolves when dependentObj is a filled array', () => {
      AppError.badRequest = mock()

      return target.preValidate([{}]).then(() => {
        expect(AppError.badRequest).not.toHaveBeenCalled()
      })
    })

    test('rejects when dependentObj is undefined', () => {
      AppError.badRequest = mock()

      return target.preValidate(undefined).then(() => {}, () => {
        expect(AppError.badRequest).toHaveBeenCalledWith('Tag request object needs to be an array', undefined, '3E2001')
      })
    })

    test('rejects when dependentObj is an empty array', () => {
      AppError.badRequest = mock()

      return target.preValidate([]).then(() => {}, () => {
        expect(AppError.badRequest).toHaveBeenCalledWith('Tag request object needs to be an array', undefined, '3E2001')
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
      const targetObject = [{ category: 'a', value: 1, experimentId: 1 }, { category: 'b', value: 2, experimentId: 1 }]
      target.getBusinessKeyPropertyNames = mock(['category', 'value', 'experimentId'])

      return target.postValidate(targetObject).then(() => {
        expect(target.messages.length).toEqual(0)
      })
    })

    test('adds a message when there are business key errors', () => {
      const targetObject = [{ category: 'a', value: 1, experimentId: 1 }, { category: 'a', value: 1, experimentId: 1 }]
      target.getBusinessKeyPropertyNames = mock(['category', 'value', 'experimentId'])

      return target.postValidate(targetObject).then(() => {
        expect(target.messages.length).toEqual(1)
      })
    })
  })
})
