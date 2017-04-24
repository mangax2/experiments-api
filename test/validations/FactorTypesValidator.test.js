import { mock } from '../jestUtil'
import FactorTypesValidator from '../../src/validations/FactorTypesValidator'
import AppError from '../../src/services/utility/AppError'
import db from '../../src/db/DbManager'

describe('FactorTypesValidator', () => {
  let target

  beforeEach(() => {
    target = new FactorTypesValidator()
  })

  describe('getSchema', () => {
    it('returns schema', () => {
      db.factorType = {}

      const schema = [
        {
          paramName: 'type',
          type: 'text',
          lengthRange: { min: 1, max: 50 },
          required: true,
        },
        { paramName: 'FactorType', type: 'businessKey', keys: ['type'], entity: {} },]

      expect(target.getSchema()).toEqual(schema)
    })
  })

  describe('getEntityName', () => {
    it('returns name', () => {
      expect(target.getEntityName()).toEqual('FactorType')
    })
  })

  describe('preValidate', () => {
    it('rejects when factorObj is not an array', () => {
      AppError.badRequest = mock()

      return target.preValidate({}).then(() => {}, () => {
        expect(AppError.badRequest).toHaveBeenCalledWith('Factor Types request object needs to' +
          ' be an array')
      })
    })

    it('resolves when factorObj is empty array', () => {
      AppError.badRequest = mock()

      return target.preValidate([]).then(() => {}, () => {
        expect(AppError.badRequest).toHaveBeenCalledWith('Factor Types request object needs to' +
          ' be an array')
      })
    })

    it('resolves when factorObj is filled array', () => {
      AppError.badRequest = mock()

      return target.preValidate([{}]).then(() => {
        expect(AppError.badRequest).not.toHaveBeenCalled()
      })
    })
  })

  describe('postValidate', () => {
    it('resolves', () => {
      return target.postValidate().then(() => {})
    })
  })
})