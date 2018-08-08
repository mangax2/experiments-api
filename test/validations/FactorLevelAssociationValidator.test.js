import { mock } from '../jestUtil'
import FactorLevelAssociationValidator from '../../src/validations/FactorLevelAssociationValidator'
import AppError from '../../src/services/utility/AppError'
import db from '../../src/db/DbManager'

describe('FactorLevelAssociationValidator', () => {
  let target

  beforeEach(() => {
    expect.hasAssertions()
    target = new FactorLevelAssociationValidator()
  })

  describe('get POST_VALIDATION_SCHEMA', () => {
    test('returns validation schema', () => {
      expect(FactorLevelAssociationValidator.POST_VALIDATION_SCHEMA).toEqual([
        { paramName: 'associatedLevelId', type: 'numeric', required: true },
        { paramName: 'associatedLevelId', type: 'refData', entity: db.factorLevel },
        { paramName: 'nestedLevelId', type: 'numeric', required: true },
        { paramName: 'nestedLevelId', type: 'refData', entity: db.factorLevel },
        {
          paramName: 'FactorLevelAssociation',
          type: 'businessKey',
          keys: ['associatedLevelId', 'nestedLevelId'],
          entity: db.factorLevelAssociation,
        },
      ])
    })
  })

  describe('getSchema', () => {
    test('returns POST schema for POST operation', () => {
      expect(target.getSchema('POST')).toEqual([
        { paramName: 'associatedLevelId', type: 'numeric', required: true },
        { paramName: 'associatedLevelId', type: 'refData', entity: db.factorLevel },
        { paramName: 'nestedLevelId', type: 'numeric', required: true },
        { paramName: 'nestedLevelId', type: 'refData', entity: db.factorLevel },
        {
          paramName: 'FactorLevelAssociation',
          type: 'businessKey',
          keys: ['associatedLevelId', 'nestedLevelId'],
          entity: db.factorLevelAssociation,
        },
      ])
    })

    test('throws exception when operation is not POST', () => {
      AppError.badRequest = mock('')
      expect(() => { target.getSchema('NOT POST') }).toThrow()
      expect(AppError.badRequest).toHaveBeenCalledWith('Invalid Operation', undefined, '371001')
    })
  })

  describe('getBusinessKeyPropertyNames', () => {
    test('returns business key names', () => {
      expect(target.getBusinessKeyPropertyNames())
        .toEqual(['associatedLevelId', 'nestedLevelId'])
    })
  })

  describe('getDuplicateBusinessKeyError', () => {
    test('returns duplicate business key error', () => {
      expect(target.getDuplicateBusinessKeyError())
        .toEqual('Duplicate association in request payload')
    })
  })

  describe('getEntityName', () => {
    test('returns name', () => {
      expect(target.getEntityName())
        .toEqual('FactorLevelAssociation')
    })
  })

  describe('preValidate', () => {
    test('resolves when parameter is a filled array', () => {
      AppError.badRequest = mock()

      return target.preValidate([{}]).then(() => {
        expect(AppError.badRequest).not.toHaveBeenCalled()
      })
    })

    test('rejects when parameter is undefined', () => {
      AppError.badRequest = mock()

      return target.preValidate(undefined).then(() => {}, () => {
        expect(AppError.badRequest).toHaveBeenCalledWith('FactorLevelAssociation request object needs to be an array', undefined, '372001')
      })
    })

    test('rejects when parameter is an empty array', () => {
      AppError.badRequest = mock()

      return target.preValidate([]).then(() => {}, () => {
        expect(AppError.badRequest).toHaveBeenCalledWith('FactorLevelAssociation request object needs to be an array', undefined, '372001')
      })
    })
  })
})
