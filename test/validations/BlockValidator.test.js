import { mock } from '../jestUtil'
import BlockValidator from '../../src/validations/BlockValidator'
import AppError from '../../src/services/utility/AppError'
import db from '../../src/db/DbManager'

describe('BlockValidator', () => {
  describe('getEntityName', () => {
    test('gets name', () => {
      const target = new BlockValidator()
      expect(target.getEntityName()).toEqual('Block')
    })
  })

  describe('getSchema', () => {
    test('gets patch schema', () => {
      const target = new BlockValidator()
      const schema = [
        { paramName: 'id', type: 'numeric', required: true },
        { paramName: 'id', type: 'refData', entity: db.block },
        { paramName: 'name', type: 'string', required: true },
      ]

      expect(target.getSchema('PATCH')).toEqual(schema)
    })

    test('error to be thrown when neither POST nor PUT are supplied', () => {
      const target = new BlockValidator()
      AppError.badRequest = mock('')

      expect(() => { target.getSchema('test') }).toThrow()
      expect(AppError.badRequest).toHaveBeenCalledWith('Invalid Operation', undefined, '3I1001')
    })
  })

  test('getBusinessKeyPropertyNames', () => {
    expect(new BlockValidator().getBusinessKeyPropertyNames()).toEqual(['name'])
  })

  describe('preValidate', () => {
    test('resolves when unitSpecificationDetailObj is a filled array', () => {
      const target = new BlockValidator()
      AppError.badRequest = mock()

      return target.preValidate([{}]).then(() => {
        expect(AppError.badRequest).not.toHaveBeenCalled()
      })
    })

    test('rejects when unitSpecificationDetailObj is undefined', () => {
      const target = new BlockValidator()
      AppError.badRequest = mock()

      return target.preValidate(undefined).catch(() => {
        expect(AppError.badRequest).toHaveBeenCalledWith('Block request object needs to be an array', undefined, '3I2001')
      })
    })

    test('rejects when unitSpecificationDetailObj is an empty array', () => {
      const target = new BlockValidator()
      AppError.badRequest = mock()

      return target.preValidate([]).catch(() => {
        expect(AppError.badRequest).toHaveBeenCalledWith('Block request object needs to be an array', undefined, '3I2001')
      })
    })

    test('rejects when two blocks have same name', () => {
      const target = new BlockValidator()
      AppError.badRequest = mock()

      return target.preValidate([{ name: 'block' }, { name: 'block' }]).catch(() => {
        expect(AppError.badRequest).toHaveBeenCalledWith('Block names must be unique', undefined, '3I2002')
      })
    })
  })
})
