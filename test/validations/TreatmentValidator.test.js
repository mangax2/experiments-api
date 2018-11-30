import { mock, mockResolve } from '../jestUtil'
import TreatmentValidator from '../../src/validations/TreatmentValidator'
import AppError from '../../src/services/utility/AppError'
import db from '../../src/db/DbManager'

describe('TreatmentValidator', () => {
  const testTx = { tx: {} }
  let target

  beforeEach(() => {
    expect.hasAssertions()
    target = new TreatmentValidator()
  })

  describe('get POST_VALIDATION_SCHEMA', () => {
    test('gets schema', () => {
      db.experiments = {}
      db.treatment = {}

      const schema = [
        { paramName: 'isControl', type: 'boolean', required: true },
        { paramName: 'treatmentNumber', type: 'numeric', required: true },
        {
          paramName: 'notes', type: 'text', lengthRange: { min: 0, max: 500 }, required: false,
        },
        { paramName: 'experimentId', type: 'numeric', required: true },
        { paramName: 'experimentId', type: 'refData', entity: {} },
        {
          paramName: 'Treatment',
          type: 'businessKey',
          keys: ['experimentId', 'treatmentNumber'],
          entity: {},
        },
        { paramName: 'block', type: 'integer' },
        { paramName: 'inAllBlocks', type: 'boolean' },
      ]

      expect(TreatmentValidator.POST_VALIDATION_SCHEMA).toEqual(schema)
    })
  })

  describe('get PUT_ADDITIONAL_SCHEMA_ELEMENTS', () => {
    test('gets elements', () => {
      db.treatment = {}
      const schema = [
        { paramName: 'id', type: 'numeric', required: true },
        { paramName: 'id', type: 'refData', entity: {} },
      ]

      expect(TreatmentValidator.PUT_ADDITIONAL_SCHEMA_ELEMENTS).toEqual(schema)
    })
  })

  describe('getEntityName', () => {
    test('returns name', () => {
      expect(target.getEntityName()).toEqual('Treatment')
    })
  })

  describe('getSchema', () => {
    describe('getSchema', () => {
      test('returns post schema', () => {
        db.experiments = {}
        db.treatment = {}
        const schema = [
          { paramName: 'isControl', type: 'boolean', required: true },
          { paramName: 'treatmentNumber', type: 'numeric', required: true },
          {
            paramName: 'notes', type: 'text', lengthRange: { min: 0, max: 500 }, required: false,
          },
          { paramName: 'experimentId', type: 'numeric', required: true },
          { paramName: 'experimentId', type: 'refData', entity: {} },
          {
            paramName: 'Treatment',
            type: 'businessKey',
            keys: ['experimentId', 'treatmentNumber'],
            entity: {},
          },
          { paramName: 'block', type: 'integer' },
          { paramName: 'inAllBlocks', type: 'boolean' },
        ]

        expect(target.getSchema('POST')).toEqual(schema)
      })

      test('returns put schema', () => {
        db.experiments = {}
        db.treatment = {}
        const schema = [
          { paramName: 'isControl', type: 'boolean', required: true },
          { paramName: 'treatmentNumber', type: 'numeric', required: true },
          {
            paramName: 'notes', type: 'text', lengthRange: { min: 0, max: 500 }, required: false,
          },
          { paramName: 'experimentId', type: 'numeric', required: true },
          { paramName: 'experimentId', type: 'refData', entity: {} },
          {
            paramName: 'Treatment',
            type: 'businessKey',
            keys: ['experimentId', 'treatmentNumber'],
            entity: {},
          },
          { paramName: 'block', type: 'integer' },
          { paramName: 'inAllBlocks', type: 'boolean' },
          { paramName: 'id', type: 'numeric', required: true },
          { paramName: 'id', type: 'refData', entity: {} },
        ]

        expect(target.getSchema('PUT')).toEqual(schema)
      })

      test('throws an error when POST and PUT are not supplied', () => {
        AppError.badRequest = mock('')

        expect(() => { target.getSchema('test') }).toThrow()
        expect(AppError.badRequest).toHaveBeenCalledWith('Invalid Operation', undefined, '3F1001')
      })
    })
  })

  describe('getBusinessKeyPropertyNames', () => {
    test('gets business keys', () => {
      expect(target.getBusinessKeyPropertyNames()).toEqual(['experimentId', 'treatmentNumber'])
    })
  })

  describe('getDuplicateBusinessKeyError', () => {
    test('gets duplicate business key error mesasge', () => {
      expect(target.getDuplicateBusinessKeyError()).toEqual({ message: 'Duplicate treatment number in request payload with same experiment id', errorCode: '3FA001' })
    })
  })

  describe('preValidate', () => {
    test('rejects when treatmentObj is undefined', () => {
      AppError.badRequest = mock()

      return target.preValidate(undefined).then(() => {}, () => {
        expect(AppError.badRequest).toHaveBeenCalledWith('Treatment request object needs to be an array', undefined, '3F2001')
      })
    })

    test('rejects when treatmentObj is an empty array', () => {
      AppError.badRequest = mock()

      return target.preValidate([]).then(() => {}, () => {
        expect(AppError.badRequest).toHaveBeenCalledWith('Treatment request object needs to be an array', undefined, '3F2001')
      })
    })

    test('resolves when treatmentObj is a filled array', () => {
      AppError.badRequest = mock()

      return target.preValidate([{}]).then(() => {
        expect(AppError.badRequest).not.toHaveBeenCalled()
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
      db.factorLevel.findByExperimentId = mockResolve([])
      db.factorLevelAssociation.findByExperimentId = mockResolve([])
      const targetObject = [{ test: 'a', experimentId: 1 }, { test: 'b', experimentId: 1 }]
      target.getBusinessKeyPropertyNames = mock(['experimentId', 'test'])

      return target.postValidate(targetObject).then(() => {
        expect(target.messages.length).toEqual(0)
      })
    })

    test('adds a message when there are business key errors', () => {
      db.factorLevel.findByExperimentId = mockResolve([])
      db.factorLevelAssociation.findByExperimentId = mockResolve([])
      const targetObject = [{ test: 'a', experimentId: 1 }, { test: 'a', experimentId: 1 }]
      target.getBusinessKeyPropertyNames = mock(['experimentId', 'test'])

      return target.postValidate(targetObject).then(() => {
        expect(target.messages.length).toEqual(1)
      })
    })

    test('creates error message when a treatment has a combination that represents an invalid nesting', () => {
      db.factorLevel.findByExperimentId = mockResolve([
        {
          id: 11,
          factor_id: 1,
        },
        {
          id: 12,
          factor_id: 1,
        },
        {
          id: 21,
          factor_id: 2,
        },
        {
          id: 22,
          factor_id: 2,
        },
      ])
      db.factorLevelAssociation.findByExperimentId = mockResolve([
        {
          associated_level_id: 11,
          nested_level_id: 22,
        },
        {
          associated_level_id: 12,
          nested_level_id: 22,
        },
      ])
      const treatments = [
        {
          treatmentNumber: 1,
          experimentId: 41,
          combinationElements: [
            {
              factorLevelId: 11,
            },
            {
              factorLevelId: 21,
            },
          ],
        },
        {
          treatmentNumber: 2,
          experimentId: 41,
          combinationElements: [
            {
              factorLevelId: 12,
            },
            {
              factorLevelId: 22,
            },
          ],
        },
      ]

      return target.postValidate(treatments, {}, testTx).then(() => {
        expect(db.factorLevel.findByExperimentId).toHaveBeenCalledTimes(1)
        expect(db.factorLevel.findByExperimentId).toHaveBeenCalledWith(41, testTx)
        expect(db.factorLevelAssociation.findByExperimentId).toHaveBeenCalledTimes(1)
        expect(db.factorLevelAssociation.findByExperimentId).toHaveBeenCalledWith(41, testTx)
        expect(target.messages).toEqual([
          { message: 'Treatment number: 1 has the following invalid level id combinations: { Associated Level Id: 11, Nested Level Id: 21 }', errorCode: '3F8001' },
        ])
      })
    })

    test('creates error messages when a multiple treatments have combinations that represents invalid nestings', () => {
      db.factorLevel.findByExperimentId = mockResolve([
        {
          id: 11,
          factor_id: 1,
        },
        {
          id: 12,
          factor_id: 1,
        },
        {
          id: 21,
          factor_id: 2,
        },
        {
          id: 22,
          factor_id: 2,
        },
      ])
      db.factorLevelAssociation.findByExperimentId = mockResolve([
        {
          associated_level_id: 11,
          nested_level_id: 22,
        },
        {
          associated_level_id: 12,
          nested_level_id: 21,
        },
      ])
      const treatments = [
        {
          treatmentNumber: 1,
          experimentId: 41,
          combinationElements: [
            {
              factorLevelId: 11,
            },
            {
              factorLevelId: 21,
            },
          ],
        },
        {
          treatmentNumber: 2,
          experimentId: 41,
          combinationElements: [
            {
              factorLevelId: 12,
            },
            {
              factorLevelId: 22,
            },
          ],
        },
      ]

      return target.postValidate(treatments, {}, testTx).then(() => {
        expect(db.factorLevel.findByExperimentId).toHaveBeenCalledTimes(1)
        expect(db.factorLevel.findByExperimentId).toHaveBeenCalledWith(41, testTx)
        expect(db.factorLevelAssociation.findByExperimentId).toHaveBeenCalledTimes(1)
        expect(db.factorLevelAssociation.findByExperimentId).toHaveBeenCalledWith(41, testTx)
        expect(target.messages).toEqual([
          { message: 'Treatment number: 1 has the following invalid level id combinations: { Associated Level Id: 11, Nested Level Id: 21 }', errorCode: '3F8001' },
          { message: 'Treatment number: 2 has the following invalid level id combinations: { Associated Level Id: 12, Nested Level Id: 22 }', errorCode: '3F8001' },
        ])
      })
    })

    test('does not create error messages when all treatment combinations are valid nestings', () => {
      db.factorLevel.findByExperimentId = mockResolve([
        {
          id: 11,
          factor_id: 1,
        },
        {
          id: 12,
          factor_id: 1,
        },
        {
          id: 21,
          factor_id: 2,
        },
        {
          id: 22,
          factor_id: 2,
        },
      ])
      db.factorLevelAssociation.findByExperimentId = mockResolve([
        {
          associated_level_id: 11,
          nested_level_id: 21,
        },
        {
          associated_level_id: 12,
          nested_level_id: 22,
        },
      ])
      const treatments = [
        {
          experimentId: 41,
          treatmentNumber: 1,
          combinationElements: [
            {
              factorLevelId: 11,
            },
            {
              factorLevelId: 21,
            },
          ],
        },
        {
          experimentId: 41,
          treatmentNumber: 2,
          combinationElements: [
            {
              factorLevelId: 12,
            },
            {
              factorLevelId: 22,
            },
          ],
        },
      ]

      return target.postValidate(treatments, {}, testTx).then(() => {
        expect(db.factorLevel.findByExperimentId).toHaveBeenCalledTimes(1)
        expect(db.factorLevel.findByExperimentId).toHaveBeenCalledWith(41, testTx)
        expect(db.factorLevelAssociation.findByExperimentId).toHaveBeenCalledTimes(1)
        expect(db.factorLevelAssociation.findByExperimentId).toHaveBeenCalledWith(41, testTx)
        expect(target.messages).toEqual([])
      })
    })

    test('does not create error messages when all treatment combinations are valid and not all factors are in a relationship', () => {
      db.factorLevel.findByExperimentId = mockResolve([
        {
          id: 11,
          factor_id: 1,
        },
        {
          id: 12,
          factor_id: 1,
        },
        {
          id: 21,
          factor_id: 2,
        },
        {
          id: 22,
          factor_id: 2,
        },
        {
          id: 31,
          factor_id: 3,
        },
        {
          id: 32,
          factor_id: 3,
        },
      ])
      db.factorLevelAssociation.findByExperimentId = mockResolve([
        {
          associated_level_id: 11,
          nested_level_id: 21,
        },
        {
          associated_level_id: 12,
          nested_level_id: 22,
        },
      ])
      const treatments = [
        {
          experimentId: 41,
          treatmentNumber: 1,
          combinationElements: [
            {
              factorLevelId: 11,
            },
            {
              factorLevelId: 21,
            },
            {
              factorLevelId: 31,
            },
          ],
        },
        {
          experimentId: 41,
          treatmentNumber: 2,
          combinationElements: [
            {
              factorLevelId: 12,
            },
            {
              factorLevelId: 22,
            },
            {
              factorLevelId: 31,
            },
          ],
        },
        {
          experimentId: 41,
          treatmentNumber: 3,
          combinationElements: [
            {
              factorLevelId: 11,
            },
            {
              factorLevelId: 21,
            },
            {
              factorLevelId: 32,
            },
          ],
        },
        {
          experimentId: 41,
          treatmentNumber: 4,
          combinationElements: [
            {
              factorLevelId: 12,
            },
            {
              factorLevelId: 22,
            },
            {
              factorLevelId: 32,
            },
          ],
        },
      ]

      return target.postValidate(treatments, {}, testTx).then(() => {
        expect(db.factorLevel.findByExperimentId).toHaveBeenCalledTimes(1)
        expect(db.factorLevel.findByExperimentId).toHaveBeenCalledWith(41, testTx)
        expect(db.factorLevelAssociation.findByExperimentId).toHaveBeenCalledTimes(1)
        expect(db.factorLevelAssociation.findByExperimentId).toHaveBeenCalledWith(41, testTx)
        expect(target.messages).toEqual([])
      })
    })

    test('Creates error messages when their are invalid treatment combinations in a multi-tiered nested relationship', () => {
      db.factorLevel.findByExperimentId = mockResolve([
        {
          id: 11,
          factor_id: 1,
        },
        {
          id: 12,
          factor_id: 1,
        },
        {
          id: 21,
          factor_id: 2,
        },
        {
          id: 22,
          factor_id: 2,
        },
        {
          id: 31,
          factor_id: 3,
        },
        {
          id: 32,
          factor_id: 3,
        },
      ])
      db.factorLevelAssociation.findByExperimentId = mockResolve([
        {
          associated_level_id: 11,
          nested_level_id: 21,
        },
        {
          associated_level_id: 12,
          nested_level_id: 22,
        },
        {
          associated_level_id: 21,
          nested_level_id: 31,
        },
        {
          associated_level_id: 22,
          nested_level_id: 32,
        },
      ])
      const treatments = [
        {
          experimentId: 41,
          treatmentNumber: 1,
          combinationElements: [
            {
              factorLevelId: 11,
            },
            {
              factorLevelId: 21,
            },
            {
              factorLevelId: 31,
            },
          ],
        },
        {
          experimentId: 41,
          treatmentNumber: 2,
          combinationElements: [
            {
              factorLevelId: 12,
            },
            {
              factorLevelId: 22,
            },
            {
              factorLevelId: 31,
            },
          ],
        },
        {
          experimentId: 41,
          treatmentNumber: 3,
          combinationElements: [
            {
              factorLevelId: 11,
            },
            {
              factorLevelId: 21,
            },
            {
              factorLevelId: 32,
            },
          ],
        },
        {
          experimentId: 41,
          treatmentNumber: 4,
          combinationElements: [
            {
              factorLevelId: 12,
            },
            {
              factorLevelId: 22,
            },
            {
              factorLevelId: 32,
            },
          ],
        },
      ]

      return target.postValidate(treatments, {}, testTx).then(() => {
        expect(db.factorLevel.findByExperimentId).toHaveBeenCalledTimes(1)
        expect(db.factorLevel.findByExperimentId).toHaveBeenCalledWith(41, testTx)
        expect(db.factorLevelAssociation.findByExperimentId).toHaveBeenCalledTimes(1)
        expect(db.factorLevelAssociation.findByExperimentId).toHaveBeenCalledWith(41, testTx)
        expect(target.messages).toEqual([
          { message: 'Treatment number: 2 has the following invalid level id combinations: { Associated Level Id: 22, Nested Level Id: 31 }', errorCode: '3F8001' },
          { message: 'Treatment number: 3 has the following invalid level id combinations: { Associated Level Id: 21, Nested Level Id: 32 }', errorCode: '3F8001' },
        ])
      })
    })

    test('Creates no error messages for associated factor with multiple nestings when all combinations are valid.', () => {
      db.factorLevel.findByExperimentId = mockResolve([
        {
          id: 11,
          factor_id: 1,
        },
        {
          id: 12,
          factor_id: 1,
        },
        {
          id: 21,
          factor_id: 2,
        },
        {
          id: 22,
          factor_id: 2,
        },
        {
          id: 31,
          factor_id: 3,
        },
        {
          id: 32,
          factor_id: 3,
        },
      ])
      db.factorLevelAssociation.findByExperimentId = mockResolve([
        {
          associated_level_id: 11,
          nested_level_id: 21,
        },
        {
          associated_level_id: 12,
          nested_level_id: 22,
        },
        {
          associated_level_id: 11,
          nested_level_id: 31,
        },
        {
          associated_level_id: 12,
          nested_level_id: 32,
        },
      ])
      const treatments = [
        {
          experimentId: 41,
          treatmentNumber: 1,
          combinationElements: [
            {
              factorLevelId: 11,
            },
            {
              factorLevelId: 21,
            },
            {
              factorLevelId: 31,
            },
          ],
        },
        {
          experimentId: 41,
          treatmentNumber: 2,
          combinationElements: [
            {
              factorLevelId: 12,
            },
            {
              factorLevelId: 22,
            },
            {
              factorLevelId: 32,
            },
          ],
        },
      ]

      return target.postValidate(treatments, {}, testTx).then(() => {
        expect(db.factorLevel.findByExperimentId).toHaveBeenCalledTimes(1)
        expect(db.factorLevel.findByExperimentId).toHaveBeenCalledWith(41, testTx)
        expect(db.factorLevelAssociation.findByExperimentId).toHaveBeenCalledTimes(1)
        expect(db.factorLevelAssociation.findByExperimentId).toHaveBeenCalledWith(41, testTx)
        expect(target.messages).toEqual([])
      })
    })

    test('Creates error messages for associated factor with multiple nestings when multiple combinations within a treatment are invalid.', () => {
      db.factorLevel.findByExperimentId = mockResolve([
        {
          id: 11,
          factor_id: 1,
        },
        {
          id: 12,
          factor_id: 1,
        },
        {
          id: 21,
          factor_id: 2,
        },
        {
          id: 22,
          factor_id: 2,
        },
        {
          id: 31,
          factor_id: 3,
        },
        {
          id: 32,
          factor_id: 3,
        },
      ])
      db.factorLevelAssociation.findByExperimentId = mockResolve([
        {
          associated_level_id: 11,
          nested_level_id: 21,
        },
        {
          associated_level_id: 12,
          nested_level_id: 22,
        },
        {
          associated_level_id: 11,
          nested_level_id: 31,
        },
        {
          associated_level_id: 12,
          nested_level_id: 32,
        },
      ])
      const treatments = [
        {
          experimentId: 41,
          treatmentNumber: 1,
          combinationElements: [
            {
              factorLevelId: 11,
            },
            {
              factorLevelId: 21,
            },
            {
              factorLevelId: 31,
            },
          ],
        },
        {
          experimentId: 41,
          treatmentNumber: 2,
          combinationElements: [
            {
              factorLevelId: 11,
            },
            {
              factorLevelId: 21,
            },
            {
              factorLevelId: 32,
            },
          ],
        },
        {
          experimentId: 41,
          treatmentNumber: 3,
          combinationElements: [
            {
              factorLevelId: 12,
            },
            {
              factorLevelId: 22,
            },
            {
              factorLevelId: 32,
            },
          ],
        },
        {
          experimentId: 41,
          treatmentNumber: 4,
          combinationElements: [
            {
              factorLevelId: 11,
            },
            {
              factorLevelId: 22,
            },
            {
              factorLevelId: 32,
            },
          ],
        },
      ]

      return target.postValidate(treatments, {}, testTx).then(() => {
        expect(db.factorLevel.findByExperimentId).toHaveBeenCalledTimes(1)
        expect(db.factorLevel.findByExperimentId).toHaveBeenCalledWith(41, testTx)
        expect(db.factorLevelAssociation.findByExperimentId).toHaveBeenCalledTimes(1)
        expect(db.factorLevelAssociation.findByExperimentId).toHaveBeenCalledWith(41, testTx)
        expect(target.messages).toEqual([
          { message: 'Treatment number: 2 has the following invalid level id combinations: { Associated Level Id: 11, Nested Level Id: 32 }', errorCode: '3F8001' },
          { message: 'Treatment number: 4 has the following invalid level id combinations: { Associated Level Id: 11, Nested Level Id: 22 }, { Associated Level Id: 11, Nested Level Id: 32 }', errorCode: '3F8001' },
        ])
      })
    })
  })

  describe('validateBlockValue', () => {
    test('treatments with conflict block info', () => {
      const treatments = [
        {
          isControl: false, notes: null, treatmentNumber: 1, combinationElements: [{ factorLevelId: 82186 }], block: 1, inAllBlocks: true,
        },
        {
          isControl: false, notes: null, treatmentNumber: 2, combinationElements: [{ factorLevelId: 82187 }], block: 1,
        },
        {
          isControl: false, notes: null, treatmentNumber: 3, combinationElements: [{ factorLevelId: 82188 }], block: 1,
        },
      ]
      const testError = { message: 'error' }
      AppError.badRequest = mock(testError)
      return expect(target.validateBlockValue(treatments)).rejects.toEqual({ errorCode: '3F4000', message: 'error' })
    })

    test('treatments with some block info', () => {
      const treatments = [
        {
          isControl: false, notes: null, treatmentNumber: 1, combinationElements: [{ factorLevelId: 82186 }],
        },
        {
          isControl: false, notes: null, treatmentNumber: 2, combinationElements: [{ factorLevelId: 82187 }], block: 1,
        },
        {
          isControl: false, notes: null, treatmentNumber: 3, combinationElements: [{ factorLevelId: 82188 }], block: 1,
        },
      ]
      const testError = { message: 'error' }
      AppError.badRequest = mock(testError)
      return expect(target.validateBlockValue(treatments)).rejects.toEqual({ errorCode: '3F4000', message: 'error' })
    })

    test('treatments with no block info and treatments with all blocks', () => {
      const treatments = [
        {
          isControl: false, notes: null, treatmentNumber: 1, combinationElements: [{ factorLevelId: 82186 }], inAllBlocks: true,
        },
        {
          isControl: false, notes: null, treatmentNumber: 2, combinationElements: [{ factorLevelId: 82187 }],
        },
        {
          isControl: false, notes: null, treatmentNumber: 3, combinationElements: [{ factorLevelId: 82188 }],
        },
      ]
      const testError = { message: 'error' }
      AppError.badRequest = mock(testError)
      return expect(target.validateBlockValue(treatments)).rejects.toEqual({ errorCode: '3F4000', message: 'error' })
    })

    test('all treatments with block info', () => {
      const treatments = [
        {
          isControl: false, notes: null, treatmentNumber: 1, combinationElements: [{ factorLevelId: 82186 }], block: 1,
        },
        {
          isControl: false, notes: null, treatmentNumber: 2, combinationElements: [{ factorLevelId: 82187 }], block: 1,
        },
        {
          isControl: false, notes: null, treatmentNumber: 3, combinationElements: [{ factorLevelId: 82188 }], block: 3,
        },
      ]
      expect.assertions(1)
      return expect(target.validateBlockValue(treatments)).resolves.toEqual()
    })

    test('all treatments with block info or in all blocks', () => {
      const treatments = [
        {
          isControl: false, notes: null, treatmentNumber: 1, combinationElements: [{ factorLevelId: 82186 }], inAllBlocks: true,
        },
        {
          isControl: false, notes: null, treatmentNumber: 2, combinationElements: [{ factorLevelId: 82187 }], inAllBlocks: true,
        },
        {
          isControl: false, notes: null, treatmentNumber: 3, combinationElements: [{ factorLevelId: 82188 }], block: 3,
        },
      ]
      return expect(target.validateBlockValue(treatments)).resolves.toEqual()
    })

    test('all treatments are in all blocks', () => {
      const treatments = [
        {
          isControl: false, notes: null, treatmentNumber: 1, combinationElements: [{ factorLevelId: 82186 }], inAllBlocks: true,
        },
        {
          isControl: false, notes: null, treatmentNumber: 2, combinationElements: [{ factorLevelId: 82187 }], inAllBlocks: true,
        },
        {
          isControl: false, notes: null, treatmentNumber: 3, combinationElements: [{ factorLevelId: 82188 }], inAllBlocks: true,
        },
      ]
      const testError = { message: 'error' }
      AppError.badRequest = mock(testError)
      return expect(target.validateBlockValue(treatments)).rejects.toEqual({ errorCode: '3F4000', message: 'error' })
    })
  })
})
