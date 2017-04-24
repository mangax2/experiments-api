import { mock } from '../jestUtil'
import TreatmentValidator from '../../src/validations/TreatmentValidator'
import AppError from '../../src/services/utility/AppError'
import db from '../../src/db/DbManager'

describe('TreatmentValidator', () => {
  let target

  beforeEach(() => {
    target = new TreatmentValidator()
  })

  describe('get POST_VALIDATION_SCHEMA', () => {
    it('gets schema', () => {
      db.experiments = {}
      db.treatment = {}

      const schema = [
        { paramName: 'isControl', type: 'boolean', required: true },
        { paramName: 'treatmentNumber', type: 'numeric', required: true },
        { paramName: 'notes', type: 'text', lengthRange: { min: 0, max: 500 }, required: false },
        { paramName: 'experimentId', type: 'numeric', required: true },
        { paramName: 'experimentId', type: 'refData', entity: {} },
        {
          paramName: 'Treatment',
          type: 'businessKey',
          keys: ['experimentId', 'treatmentNumber'],
          entity: {},
        },
      ]

      expect(TreatmentValidator.POST_VALIDATION_SCHEMA).toEqual(schema)
    })
  })

  describe('get PUT_ADDITIONAL_SCHEMA_ELEMENTS', () => {
    it('gets elements', () => {
      db.treatment = {}
      const schema = [
        { paramName: 'id', type: 'numeric', required: true },
        { paramName: 'id', type: 'refData', entity: {} },
      ]

      expect(TreatmentValidator.PUT_ADDITIONAL_SCHEMA_ELEMENTS).toEqual(schema)
    })
  })

  describe('getEntityName', () => {
    it('returns name', () => {
      expect(target.getEntityName()).toEqual('Treatment')
    })
  })

  describe('getSchema', () => {
    describe('getSchema', () => {
      it('returns post schema', () => {
        db.experiments = {}
        db.treatment = {}
        const schema = [
          { paramName: 'isControl', type: 'boolean', required: true },
          { paramName: 'treatmentNumber', type: 'numeric', required: true },
          { paramName: 'notes', type: 'text', lengthRange: { min: 0, max: 500 }, required: false },
          { paramName: 'experimentId', type: 'numeric', required: true },
          { paramName: 'experimentId', type: 'refData', entity: {} },
          {
            paramName: 'Treatment',
            type: 'businessKey',
            keys: ['experimentId', 'treatmentNumber'],
            entity: {},
          },
        ]

        expect(target.getSchema('POST')).toEqual(schema)
      })

      it('returns put schema', () => {
        db.experiments = {}
        db.treatment = {}
        const schema = [
          { paramName: 'isControl', type: 'boolean', required: true },
          { paramName: 'treatmentNumber', type: 'numeric', required: true },
          { paramName: 'notes', type: 'text', lengthRange: { min: 0, max: 500 }, required: false },
          { paramName: 'experimentId', type: 'numeric', required: true },
          { paramName: 'experimentId', type: 'refData', entity: {} },
          {
            paramName: 'Treatment',
            type: 'businessKey',
            keys: ['experimentId', 'treatmentNumber'],
            entity: {},
          },
          { paramName: 'id', type: 'numeric', required: true },
          { paramName: 'id', type: 'refData', entity: {} },
        ]

        expect(target.getSchema('PUT')).toEqual(schema)
      })

      it('throws an error when POST and PUT are not supplied', () => {
        AppError.badRequest = mock('')

        expect(() => {target.getSchema('test')}).toThrow()
        expect(AppError.badRequest).toHaveBeenCalledWith('Invalid Operation')
      })
    })
  })

  describe('getBusinessKeyPropertyNames', () => {
    it('gets business keys', () => {
      expect(target.getBusinessKeyPropertyNames()).toEqual(['experimentId', 'treatmentNumber'])
    })
  })

  describe('getDuplicateBusinessKeyError', () => {
    it('gets duplicate business key error mesasge', () => {
      expect(target.getDuplicateBusinessKeyError()).toEqual('Duplicate treatment name in request payload with same experiment id')
    })
  })

  describe('preValidate', () => {
    it('resolves when treatmentObj is a filled array', () => {
      AppError.badRequest = mock()

      return target.preValidate([{}]).then(() => {
        expect(AppError.badRequest).not.toHaveBeenCalled()
      })
    })

    it('rejects when treatmentObj is undefined', () => {
      AppError.badRequest = mock()

      return target.preValidate(undefined).then(() => {}, () => {
        expect(AppError.badRequest).toHaveBeenCalledWith('Treatment request object' +
          ' needs to be an array')
      })
    })

    it('rejects when treatmentObj is an empty array', () => {
      AppError.badRequest = mock()

      return target.preValidate([]).then(() => {}, () => {
        expect(AppError.badRequest).toHaveBeenCalledWith('Treatment request object' +
          ' needs to be an array')
      })
    })
  })

  describe('postValidate', () => {
    it('resolves if there are errors', () => {
      target.hasErrors = mock(true)
      target.getBusinessKeyPropertyNames = mock()

      return target.postValidate({}).then(() => {
        expect(target.getBusinessKeyPropertyNames).not.toHaveBeenCalled()
      })
    })

    it('does not add a message if there are not any business key errors', () => {
      const targetObject = [{test: 'a', experimentId: 1},{test: 'b', experimentId: 1}]
      target.getBusinessKeyPropertyNames = mock(['experimentId', 'test'])

      return target.postValidate(targetObject).then(() => {
        expect(target.messages.length).toEqual(0)
      })
    })

    it('adds a message when there are business key errors', () => {
      const targetObject = [{test: 'a', experimentId: 1},{test: 'a', experimentId: 1}]
      target.getBusinessKeyPropertyNames = mock(['experimentId', 'test'])

      return target.postValidate(targetObject).then(() => {
        expect(target.messages.length).toEqual(1)
      })
    })
  })
})