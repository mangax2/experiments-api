import { mock } from '../jestUtil'
import ExperimentDesignsValidator from '../../src/validations/ExperimentDesignsValidator'
import AppError from '../../src/services/utility/AppError'
import db from '../../src/db/DbManager'

describe('ExperimentDesignsValidator', () => {
  let target

  beforeEach(() => {
    target = new ExperimentDesignsValidator()
  })

  describe('getSchema', () => {
    test('returns schema', () => {
      db.experimentDesign = {}

      const schema = [
        {
          paramName: 'name', type: 'text', lengthRange: { min: 1, max: 50 }, required: true,
        },
        {
          paramName: 'ExperimentDesign',
          type: 'businessKey',
          keys: ['name'],
          entity: {},
        },
      ]

      expect(target.getSchema()).toEqual(schema)
    })
  })

  describe('getEntityName', () => {
    test('returns the name', () => {
      expect(target.getEntityName()).toEqual('ExperimentDesign')
    })
  })

  describe('preValidate', () => {
    test('resolves when designObj is a filled array', () => {
      AppError.badRequest = mock()

      return target.preValidate([{}]).then(() => {
        expect(AppError.badRequest).not.toHaveBeenCalled()
      })
    })

    test('rejects when designObj is not an array', () => {
      AppError.badRequest = mock()

      return target.preValidate({}).then(() => {}, () => {
        expect(AppError.badRequest).toHaveBeenCalledWith('Experiment Designs request object' +
          ' needs to be an array')
      })
    })

    test('rejects when designObj is an empty array', () => {
      AppError.badRequest = mock()

      return target.preValidate([]).then(() => {}, () => {
        expect(AppError.badRequest).toHaveBeenCalledWith('Experiment Designs request object' +
          ' needs to be an array')
      })
    })
  })

  describe('postValidate', () => {
    test('resolves', () => target.postValidate().then(() => {}))
  })
})
