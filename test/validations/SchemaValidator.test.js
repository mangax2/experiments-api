import { mock, mockReject, mockResolve } from '../jestUtil'
import SchemaValidator from '../../src/validations/SchemaValidator'
import AppError from '../../src/services/utility/AppError'

describe('SchemaValidator', () => {
  let target
  const testTx = { tx: {} }

  beforeEach(() => {
    target = new SchemaValidator()
  })

  describe('schemaCheck', () => {
    test('resolves and checks schema element when the value is null', () => {
      target.schemaElementCheck = mockResolve()

      return target.schemaCheck({ test: 'b' }, [{ paramName: 'a' }], testTx).then(() => {
        expect(target.schemaElementCheck).toHaveBeenCalledWith(null, { paramName: 'a' }, { test: 'b' }, testTx)
      })
    })

    test('rejects when schema element check fails for null', () => {
      target.schemaElementCheck = mockReject('error')

      return target.schemaCheck({ test: 'b' }, [{ paramName: 'a' }], testTx).then(() => {}, (err) => {
        expect(target.schemaElementCheck).toHaveBeenCalledWith(null, { paramName: 'a' }, { test: 'b' }, testTx)
        expect(err).toEqual('error')
      })
    })

    test('resolves and checks schema element for found value', () => {
      target.schemaElementCheck = mockResolve()

      return target.schemaCheck({ test: 'b' }, [{ paramName: 'test' }], testTx).then(() => {
        expect(target.schemaElementCheck).toHaveBeenCalledWith('b', { paramName: 'test' }, { test: 'b' }, testTx)
      })
    })

    test('rejects when schema element check fails', () => {
      target.schemaElementCheck = mockReject('error')

      return target.schemaCheck({ test: 'b' }, [{ paramName: 'test' }], testTx).then(() => {}, (err) => {
        expect(target.schemaElementCheck).toHaveBeenCalledWith('b', { paramName: 'test' }, { test: 'b' }, testTx)
        expect(err).toEqual('error')
      })
    })
  })

  describe('schemaElementCheck', () => {
    test('does nothing when element is not a literal', () => {
      target.literalCheck = mock(false)
      target.checkRequired = mock()
      target.checkNumeric = mock()
      target.checkNumericRange = mock()
      target.checkLength = mock()
      target.checkConstants = mock()
      target.checkBoolean = mock()
      target.checkArray = mock()
      target.checkInteger = mock()

      return target.schemaElementCheck({}, { paramName: 'test' }).then(() => {
        expect(target.literalCheck).toHaveBeenCalledWith({}, 'test', undefined)
        expect(target.checkRequired).not.toHaveBeenCalled()
        expect(target.checkNumeric).not.toHaveBeenCalled()
        expect(target.checkNumericRange).not.toHaveBeenCalled()
        expect(target.checkLength).not.toHaveBeenCalled()
        expect(target.checkConstants).not.toHaveBeenCalled()
        expect(target.checkBoolean).not.toHaveBeenCalled()
        expect(target.checkArray).not.toHaveBeenCalled()
        expect(target.checkInteger).not.toHaveBeenCalled()
      })
    })

    test('only checks literal when value is not required and null', () => {
      target.literalCheck = mock(true)
      target.checkRequired = mock()
      target.checkNumeric = mock()
      target.checkNumericRange = mock()
      target.checkLength = mock()
      target.checkConstants = mock()
      target.checkBoolean = mock()
      target.checkArray = mock()
      target.checkInteger = mock()

      return target.schemaElementCheck({}, { paramName: 'test' }).then(() => {
        expect(target.literalCheck).toHaveBeenCalledWith({}, 'test', undefined)
        expect(target.checkRequired).not.toHaveBeenCalled()
        expect(target.checkNumeric).not.toHaveBeenCalled()
        expect(target.checkNumericRange).not.toHaveBeenCalled()
        expect(target.checkLength).not.toHaveBeenCalled()
        expect(target.checkConstants).not.toHaveBeenCalled()
        expect(target.checkBoolean).not.toHaveBeenCalled()
        expect(target.checkArray).not.toHaveBeenCalled()
        expect(target.checkInteger).not.toHaveBeenCalled()
      })
    })

    test('checks only literal and required when value is undefined', () => {
      target.literalCheck = mock(true)
      target.checkRequired = mock()
      target.checkNumeric = mock()
      target.checkNumericRange = mock()
      target.checkLength = mock()
      target.checkConstants = mock()
      target.checkBoolean = mock()
      target.checkArray = mock()
      target.checkInteger = mock()

      return target.schemaElementCheck(undefined, {
        required: true,
        paramName: 'test',
      }).then(() => {
        expect(target.literalCheck).toHaveBeenCalledWith(undefined, 'test', undefined)
        expect(target.checkRequired).toHaveBeenCalledWith(undefined, 'test')
        expect(target.checkNumeric).not.toHaveBeenCalled()
        expect(target.checkNumericRange).not.toHaveBeenCalled()
        expect(target.checkLength).not.toHaveBeenCalled()
        expect(target.checkConstants).not.toHaveBeenCalled()
        expect(target.checkBoolean).not.toHaveBeenCalled()
        expect(target.checkArray).not.toHaveBeenCalled()
        expect(target.checkInteger).not.toHaveBeenCalled()
      })
    })

    test('checks only literal and required when value is null', () => {
      target.literalCheck = mock(true)
      target.checkRequired = mock()
      target.checkNumeric = mock()
      target.checkNumericRange = mock()
      target.checkLength = mock()
      target.checkConstants = mock()
      target.checkBoolean = mock()
      target.checkArray = mock()
      target.checkInteger = mock()

      return target.schemaElementCheck(null, { required: true, paramName: 'test' }).then(() => {
        expect(target.literalCheck).toHaveBeenCalledWith(null, 'test', undefined)
        expect(target.checkRequired).toHaveBeenCalledWith(null, 'test')
        expect(target.checkNumeric).not.toHaveBeenCalled()
        expect(target.checkNumericRange).not.toHaveBeenCalled()
        expect(target.checkLength).not.toHaveBeenCalled()
        expect(target.checkConstants).not.toHaveBeenCalled()
        expect(target.checkBoolean).not.toHaveBeenCalled()
        expect(target.checkArray).not.toHaveBeenCalled()
        expect(target.checkInteger).not.toHaveBeenCalled()
      })
    })

    test('checks literal, required, numeric, not numeric range', () => {
      target.literalCheck = mock(true)
      target.checkRequired = mock()
      target.checkNumeric = mock()
      target.checkNumericRange = mock()
      target.checkLength = mock()
      target.checkConstants = mock()
      target.checkBoolean = mock()
      target.checkArray = mock()
      target.checkInteger = mock()

      return target.schemaElementCheck({}, {
        required: true,
        type: 'numeric',
        paramName: 'test',
      }).then(() => {
        expect(target.literalCheck).toHaveBeenCalledWith({}, 'test', 'numeric')
        expect(target.checkRequired).toHaveBeenCalledWith({}, 'test')
        expect(target.checkNumeric).toHaveBeenCalledWith({}, 'test')
        expect(target.checkNumericRange).not.toHaveBeenCalled()
        expect(target.checkLength).not.toHaveBeenCalled()
        expect(target.checkConstants).not.toHaveBeenCalled()
        expect(target.checkBoolean).not.toHaveBeenCalled()
        expect(target.checkArray).not.toHaveBeenCalled()
        expect(target.checkInteger).not.toHaveBeenCalled()
      })
    })

    test('check literal, required, numeric, and numeric range', () => {
      target.literalCheck = mock(true)
      target.checkRequired = mock()
      target.checkNumeric = mock()
      target.checkNumericRange = mock()
      target.checkLength = mock()
      target.checkConstants = mock()
      target.checkBoolean = mock()
      target.checkArray = mock()
      target.checkInteger = mock()

      return target.schemaElementCheck({}, {
        required: true,
        type: 'numeric',
        numericRange: {},
        paramName: 'test',
      }).then(() => {
        expect(target.literalCheck).toHaveBeenCalledWith({}, 'test', 'numeric')
        expect(target.checkRequired).toHaveBeenCalledWith({}, 'test')
        expect(target.checkNumeric).toHaveBeenCalledWith({}, 'test')
        expect(target.checkNumericRange).toHaveBeenCalledWith({}, {}, 'test')
        expect(target.checkLength).not.toHaveBeenCalled()
        expect(target.checkConstants).not.toHaveBeenCalled()
        expect(target.checkBoolean).not.toHaveBeenCalled()
        expect(target.checkArray).not.toHaveBeenCalled()
        expect(target.checkInteger).not.toHaveBeenCalled()
      })
    })

    test('checks literal, integer', () => {
      target.literalCheck = mock(true)
      target.checkRequired = mock()
      target.checkNumeric = mock()
      target.checkNumericRange = mock()
      target.checkLength = mock()
      target.checkConstants = mock()
      target.checkBoolean = mock()
      target.checkArray = mock()
      target.checkInteger = mock()

      return target.schemaElementCheck({}, {
        required: false,
        type: 'integer',
        paramName: 'test',
      }).then(() => {
        expect(target.literalCheck).toHaveBeenCalledWith({}, 'test', 'integer')
        expect(target.checkRequired).not.toHaveBeenCalled()
        expect(target.checkNumeric).not.toHaveBeenCalled()
        expect(target.checkNumericRange).not.toHaveBeenCalled()
        expect(target.checkLength).not.toHaveBeenCalled()
        expect(target.checkConstants).not.toHaveBeenCalled()
        expect(target.checkBoolean).not.toHaveBeenCalled()
        expect(target.checkArray).not.toHaveBeenCalled()
        expect(target.checkInteger).toHaveBeenCalledWith({}, 'test')
      })
    })

    test('check literal, required, and text', () => {
      target.literalCheck = mock(true)
      target.checkRequired = mock()
      target.checkNumeric = mock()
      target.checkNumericRange = mock()
      target.checkLength = mock()
      target.checkConstants = mock()
      target.checkBoolean = mock()
      target.checkArray = mock()
      target.checkInteger = mock()

      return target.schemaElementCheck({}, {
        required: true,
        type: 'text',
        lengthRange: {},
        paramName: 'test',
      }).then(() => {
        expect(target.literalCheck).toHaveBeenCalledWith({}, 'test', 'text')
        expect(target.checkRequired).toHaveBeenCalledWith({}, 'test')
        expect(target.checkNumeric).not.toHaveBeenCalled()
        expect(target.checkNumericRange).not.toHaveBeenCalled()
        expect(target.checkLength).toHaveBeenCalledWith({}, {}, 'test')
        expect(target.checkConstants).not.toHaveBeenCalled()
        expect(target.checkBoolean).not.toHaveBeenCalled()
        expect(target.checkArray).not.toHaveBeenCalled()
        expect(target.checkInteger).not.toHaveBeenCalled()
      })
    })

    test('checks literal, required, and constant', () => {
      target.literalCheck = mock(true)
      target.checkRequired = mock()
      target.checkNumeric = mock()
      target.checkNumericRange = mock()
      target.checkLength = mock()
      target.checkConstants = mock()
      target.checkBoolean = mock()
      target.checkArray = mock()
      target.checkInteger = mock()

      return target.schemaElementCheck({}, {
        required: true,
        type: 'constant',
        data: [],
        paramName: 'test',
      }).then(() => {
        expect(target.literalCheck).toHaveBeenCalledWith({}, 'test', 'constant')
        expect(target.checkRequired).toHaveBeenCalledWith({}, 'test')
        expect(target.checkNumeric).not.toHaveBeenCalled()
        expect(target.checkNumericRange).not.toHaveBeenCalled()
        expect(target.checkLength).not.toHaveBeenCalled()
        expect(target.checkConstants).toHaveBeenCalledWith({}, [], 'test')
        expect(target.checkBoolean).not.toHaveBeenCalled()
        expect(target.checkArray).not.toHaveBeenCalled()
        expect(target.checkInteger).not.toHaveBeenCalled()
      })
    })

    test('checks literal, required, and boolean', () => {
      target.literalCheck = mock(true)
      target.checkRequired = mock()
      target.checkNumeric = mock()
      target.checkNumericRange = mock()
      target.checkLength = mock()
      target.checkConstants = mock()
      target.checkBoolean = mock()
      target.checkArray = mock()
      target.checkInteger = mock()

      return target.schemaElementCheck({}, {
        required: true,
        type: 'boolean',
        paramName: 'test',
      }).then(() => {
        expect(target.literalCheck).toHaveBeenCalledWith({}, 'test', 'boolean')
        expect(target.checkRequired).toHaveBeenCalledWith({}, 'test')
        expect(target.checkNumeric).not.toHaveBeenCalled()
        expect(target.checkNumericRange).not.toHaveBeenCalled()
        expect(target.checkLength).not.toHaveBeenCalled()
        expect(target.checkConstants).not.toHaveBeenCalled()
        expect(target.checkBoolean).toHaveBeenCalledWith({}, 'test')
        expect(target.checkArray).not.toHaveBeenCalled()
        expect(target.checkInteger).not.toHaveBeenCalled()
      })
    })

    test('checks literal, required, and array', () => {
      target.literalCheck = mock(true)
      target.checkRequired = mock()
      target.checkNumeric = mock()
      target.checkNumericRange = mock()
      target.checkLength = mock()
      target.checkConstants = mock()
      target.checkBoolean = mock()
      target.checkArray = mock()
      target.checkInteger = mock()

      return target.schemaElementCheck([], {
        required: true,
        type: 'array',
        paramName: 'test',
        entityCount: {},
      }).then(() => {
        expect(target.literalCheck).toHaveBeenCalledWith([], 'test', 'array')
        expect(target.checkRequired).toHaveBeenCalledWith([], 'test')
        expect(target.checkNumeric).not.toHaveBeenCalled()
        expect(target.checkNumericRange).not.toHaveBeenCalled()
        expect(target.checkLength).not.toHaveBeenCalled()
        expect(target.checkConstants).not.toHaveBeenCalled()
        expect(target.checkBoolean).not.toHaveBeenCalled()
        expect(target.checkArray).toHaveBeenCalledWith([], 'test', {})
        expect(target.checkInteger).not.toHaveBeenCalled()
      })
    })
  })

  describe('validateEntity', () => {
    test('calls schemaCheck', () => {
      target.schemaCheck = mock()
      target.getSchema = mock([])

      target.validateEntity({}, 'POST', testTx)
      expect(target.schemaCheck).toHaveBeenCalledWith({}, [], testTx)
      expect(target.getSchema).toHaveBeenCalledWith('POST')
    })
  })

  describe('validateBatchForRI', () => {
    test('resolves when there is no RI to check', () => {
      target.getSchema = mock([])
      target.checkRIBatch = mock()
      const batchPayload = [{ id: 1, test: 'a' }]

      return target.validateBatchForRI(batchPayload, 'POST', testTx).then(() => {
        expect(target.checkRIBatch).not.toHaveBeenCalled()
      })
    })

    test('calls checkRIBatch for Ref Data', () => {
      target.getSchema = mock([{ type: 'refData', paramName: 'test', entity: {} }])
      target.checkRIBatch = mockResolve()
      const batchPayload = [{ id: 1, test: 'a' }]

      return target.validateBatchForRI(batchPayload, 'POST', testTx).then(() => {
        expect(target.checkRIBatch).toHaveBeenCalledWith([[{
          entity: {}, id: 'a', paramName: 'test', updateId: 1,
        }]], testTx)
      })
    })

    test('calls checkRIBatch for Business Keys', () => {
      target.getSchema = mock([{
        type: 'businessKey', paramName: 'test', entity: {}, keys: ['test'],
      }])
      target.checkRIBatch = mockResolve()
      const batchPayload = [{ id: 1, test: 'a' }]

      return target.validateBatchForRI(batchPayload, 'POST', testTx).then(() => {
        expect(target.checkRIBatch).toHaveBeenCalledWith([[{
          entity: {}, keys: ['a'], paramName: 'test', updateId: 1,
        }]], testTx)
      })
    })

    test('does not call checkRIBatch when nothing found to check based on schema', () => {
      target.getSchema = mock([{
        type: 'refData', paramName: 'test', entity: {}, keys: ['test'],
      }])
      target.checkRIBatch = mockResolve()
      const batchPayload = [{ id: 1, test2: 'a' }]

      return target.validateBatchForRI(batchPayload, 'POST', testTx).then(() => {
        expect(target.checkRIBatch).not.toHaveBeenCalled()
      })
    })

    test('rejects when checkRIBatch fails', () => {
      target.getSchema = mock([{
        type: 'businessKey', paramName: 'test', entity: {}, keys: ['test'],
      }])
      target.checkRIBatch = mockReject('error')
      const batchPayload = [{ id: 1, test: 'a' }]

      return target.validateBatchForRI(batchPayload, 'POST', testTx).then(() => {}, (err) => {
        expect(target.checkRIBatch).toHaveBeenCalledWith([[{
          entity: {}, keys: ['a'], paramName: 'test', updateId: 1,
        }]], testTx)
        expect(err).toEqual('error')
      })
    })
  })

  describe('postValidate', () => {
    test('checks business keys when there are no errors', () => {
      target.hasErrors = mock()
      target.getBusinessKeyPropertyNames = mock(['test1', 'test2'])
      AppError.badRequest = mock()

      return target.postValidate([{ test1: 'v', test2: 'v2' }]).then(() => {
        expect(target.getBusinessKeyPropertyNames).toHaveBeenCalled()
        expect(AppError.badRequest).not.toHaveBeenCalled()
      })
    })

    test('throws an error when duplicate business keys exist', () => {
      target.hasErrors = mock()
      target.getBusinessKeyPropertyNames = mock(['test1', 'test2'])
      AppError.badRequest = mock()
      target.getDuplicateBusinessKeyError = mock('business key error!')

      return target.postValidate([{ test1: 'v', test2: 'v2' }, {
        test1: 'v',
        test2: 'v2',
      }]).then(() => {}, () => {
        expect(target.getBusinessKeyPropertyNames).toHaveBeenCalled()
        expect(AppError.badRequest).toHaveBeenCalledWith('business key error!')
      })
    })

    test('does not check business keys if there are errors present', () => {
      target.hasErrors = mock(true)
      target.getBusinessKeyPropertyNames = mock()

      return target.postValidate([]).then(() => {
        expect(target.getBusinessKeyPropertyNames).not.toHaveBeenCalled()
      })
    })
  })

  describe('getSchema', () => {
    test('throws an error', () => {
      expect(() => {
        target.getSchema()
      }).toThrow()
    })
  })

  describe('getBusinessKeyPropertyNames', () => {
    test('throws an error', () => {
      expect(() => {
        target.getBusinessKeyPropertyNames()
      }).toThrow()
    })
  })

  describe('getDuplicateBusinessKeyError', () => {
    test('throws an error', () => {
      expect(() => {
        target.getDuplicateBusinessKeyError()
      }).toThrow()
    })
  })
})
