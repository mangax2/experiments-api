import { mock, mockReject, mockResolve } from '../jestUtil'
import BaseValidator from '../../src/validations/BaseValidator'
import AppError from '../../src/services/utility/AppError'

describe('BaseValidator', () => {
  let target

  beforeEach(() => {
    target = new BaseValidator()
    target.fileCode = ''
  })

  describe('hasError', () => {
    test('returns false if messages are empty', () => {
      expect(target.hasErrors()).toEqual(false)
    })

    test('returns true when there is at least one message', () => {
      target.messages.push('error')

      expect(target.hasErrors()).toEqual(true)
    })
  })

  describe('validateArray', () => {
    test('calls validateEntity and validateBatchForRI', () => {
      target.validateEntity = mockResolve()
      target.validateBatchForRI = mockResolve()

      return target.validateArray([{}], 'POST').then(() => {
        expect(target.validateEntity).toHaveBeenCalledWith({}, 'POST')
        expect(target.validateBatchForRI).toHaveBeenCalledWith([{}], 'POST')
      })
    })

    test('does not call validateBatchForRI due to errors', () => {
      target.messages.push('error')
      target.validateEntity = mockResolve()
      target.validateBatchForRI = mock()

      return target.validateArray([{}], 'POST').then(() => {
        expect(target.validateEntity).toHaveBeenCalledWith({}, 'POST')
        expect(target.validateBatchForRI).not.toHaveBeenCalled()
      })
    })

    test('rejects when validateBatchForRI fails', () => {
      target.validateEntity = mockResolve()
      target.validateBatchForRI = mockReject('error')

      return target.validateArray([{}], 'POST').then(() => {}, (err) => {
        expect(target.validateEntity).toHaveBeenCalledWith({}, 'POST')
        expect(target.validateBatchForRI).toHaveBeenCalledWith([{}], 'POST')
        expect(err).toEqual('error')
      })
    })

    test('rejects when validateEntity fails', () => {
      target.validateEntity = mockReject('error')
      target.validateBatchForRI = mockReject('error')

      return target.validateArray([{}], 'POST').then(() => {}, (err) => {
        expect(target.validateEntity).toHaveBeenCalledWith({}, 'POST')
        expect(target.validateBatchForRI).not.toHaveBeenCalled()
        expect(err).toEqual('error')
      })
    })
  })

  describe('validateArray or SingleEntity', () => {
    test('calls validateArray when passed in object is an array', () => {
      target.validateArray = mock()
      target.validateEntity = mock()

      target.validateArrayOrSingleEntity([], 'POST')
      expect(target.validateArray).toHaveBeenCalledWith([], 'POST')
      expect(target.validateEntity).not.toHaveBeenCalled()
    })

    test('calls validateEntity when passed in object is not an array', () => {
      target.validateArray = mock()
      target.validateEntity = mock()

      target.validateArrayOrSingleEntity({}, 'POST')
      expect(target.validateEntity).toHaveBeenCalledWith({}, 'POST')
      expect(target.validateArray).not.toHaveBeenCalled()
    })
  })

  describe('validate', () => {
    test('calls preValidate, validateArrayOrSingleEntity, postValidate, and check', () => {
      target.preValidate = mockResolve()
      target.validateArrayOrSingleEntity = mockResolve()
      target.postValidate = mockResolve()
      target.check = mockResolve()

      return target.validate([], 'POST').then(() => {
        expect(target.preValidate).toHaveBeenCalledWith([])
        expect(target.validateArrayOrSingleEntity).toHaveBeenCalledWith([], 'POST')
        expect(target.postValidate).toHaveBeenCalledWith([], undefined)
        expect(target.check).toHaveBeenCalled()
      })
    })

    test('calls rejects when check fails', () => {
      target.preValidate = mockResolve()
      target.validateArrayOrSingleEntity = mockResolve()
      target.postValidate = mockResolve()
      target.check = mockReject('error')

      return target.validate([], 'POST').then(() => {}, (err) => {
        expect(target.preValidate).toHaveBeenCalledWith([])
        expect(target.validateArrayOrSingleEntity).toHaveBeenCalledWith([], 'POST')
        expect(target.postValidate).toHaveBeenCalledWith([], undefined)
        expect(target.check).toHaveBeenCalled()
        expect(err).toEqual('error')
      })
    })

    test('calls rejects when postValidate fails', () => {
      target.preValidate = mockResolve()
      target.validateArrayOrSingleEntity = mockResolve()
      target.postValidate = mockReject('error')
      target.check = mockReject('error')

      return target.validate([], 'POST').then(() => {}, (err) => {
        expect(target.preValidate).toHaveBeenCalledWith([])
        expect(target.validateArrayOrSingleEntity).toHaveBeenCalledWith([], 'POST')
        expect(target.postValidate).toHaveBeenCalledWith([], undefined)
        expect(target.check).not.toHaveBeenCalled()
        expect(err).toEqual('error')
      })
    })

    test('calls rejects when validateArrayOrSingleEntity fails', () => {
      target.preValidate = mockResolve()
      target.validateArrayOrSingleEntity = mockReject('error')
      target.postValidate = mockReject('error')
      target.check = mockReject('error')

      return target.validate([], 'POST').then(() => {}, (err) => {
        expect(target.preValidate).toHaveBeenCalledWith([])
        expect(target.validateArrayOrSingleEntity).toHaveBeenCalledWith([], 'POST')
        expect(target.postValidate).not.toHaveBeenCalled()
        expect(target.check).not.toHaveBeenCalled()
        expect(err).toEqual('error')
      })
    })

    test('calls rejects when preValidate fails', () => {
      target.preValidate = mockReject('error')
      target.validateArrayOrSingleEntity = mockReject('error')
      target.postValidate = mockReject('error')
      target.check = mockReject('error')

      return target.validate([], 'POST').then(() => {}, (err) => {
        expect(target.preValidate).toHaveBeenCalledWith([])
        expect(target.validateArrayOrSingleEntity).not.toHaveBeenCalled()
        expect(target.postValidate).not.toHaveBeenCalled()
        expect(target.check).not.toHaveBeenCalled()
        expect(err).toEqual('error')
      })
    })
  })

  describe('preValidate', () => {
    test('returns a resolved Promise', () => expect(target.preValidate()).resolves.toBe(undefined))
  })

  describe('postValidate', () => {
    test('returns a resolved Promise', () => expect(target.postValidate()).resolves.toBe(undefined))
  })

  describe('validateEntity', () => {
    test('rejects with an error', () => target.validateEntity().then(() => {}, (err) => {
      expect(err.status).toEqual(500)
      expect(err.code).toEqual('Internal Server Error')
      expect(err.message).toEqual('Server error, please contact support')
    }))
  })

  describe('validateBatchForRI', () => {
    test('rejects with an error', () => target.validateBatchForRI().then(() => {}, (err) => {
      expect(err.status).toEqual(500)
      expect(err.code).toEqual('Internal Server Error')
      expect(err.message).toEqual('Server error, please contact support')
    }))
  })

  describe('checkLength', () => {
    test('adds a message if value is not a string', () => {
      target.checkLength({}, { min: 0, max: 0 }, 'test')
      expect(target.messages[0]).toEqual({ message: 'test must be a string', errorCode: 'ZZ01' })
    })

    test('adds a message if value is too short', () => {
      target.checkLength('', { min: 1, max: 2 }, 'test')
      expect(target.messages[0]).toEqual({ message: 'test length is out of range(min=1 max=2)', errorCode: 'ZZ02' })
    })

    test('adds a message if value is too long', () => {
      target.checkLength('abc', { min: 1, max: 2 }, 'test')
      expect(target.messages[0]).toEqual({ message: 'test length is out of range(min=1 max=2)', errorCode: 'ZZ02' })
    })

    test('does not add a message if the string value is within the min and max', () => {
      target.checkLength('ab', { min: 1, max: 2 }, 'test')
      expect(target.messages.length).toEqual(0)
    })
  })

  describe('literalCheck', () => {
    test('adds a message if value is an object', () => {
      expect(target.literalCheck({}, 'test')).toEqual(false)
      expect(target.messages[0]).toEqual({ message: 'test must be a literal value. Object and Arrays are not supported.', errorCode: 'ZZ03' })
    })

    test('adds a message if value is an array', () => {
      expect(target.literalCheck([], 'test')).toEqual(false)
      expect(target.messages[0]).toEqual({ message: 'test must be a literal value. Object and Arrays are not supported.', errorCode: 'ZZ03' })
    })

    test('returns true if values is not an object or array', () => {
      expect(target.literalCheck('hi', 'test')).toEqual(true)
      expect(target.messages.length).toEqual(0)
    })
  })

  describe('checkRequired', () => {
    test('adds a message if value is undefined', () => {
      target.checkRequired(undefined, 'test')

      expect(target.messages[0]).toEqual({ message: 'test is required', errorCode: 'ZZ04' })
    })

    test('adds a message if value is null', () => {
      target.checkRequired(null, 'test')

      expect(target.messages[0]).toEqual({ message: 'test is required', errorCode: 'ZZ04' })
    })

    test('adds a message if value is empty', () => {
      target.checkRequired('', 'test')

      expect(target.messages[0]).toEqual({ message: 'test is required', errorCode: 'ZZ04' })
    })

    test('does not add a message if value is filled', () => {
      target.checkRequired('test', 'test')

      expect(target.messages.length).toEqual(0)
    })
  })

  describe('checkNumeric', () => {
    test('adds a message if the value is not numeric', () => {
      target.checkNumeric('test', 'test')

      expect(target.messages[0]).toEqual({ message: 'test must be numeric', errorCode: 'ZZ05' })
    })

    test('adds a message if the value is numeric but in string format', () => {
      target.checkNumeric('1', 'test')

      expect(target.messages[0]).toEqual({ message: 'test must be numeric', errorCode: 'ZZ05' })
    })

    test('does not add a message if the value is numeric', () => {
      target.checkNumeric(1, 'test')

      expect(target.messages.length).toEqual(0)
    })
  })

  describe('integer', () => {
    test('adds a message if the value is not integer', () => {
      target.checkInteger('t', 'block')

      expect(target.messages[0]).toEqual({ message: 'block must be an integer', errorCode: 'ZZ10' })
    })

    test('adds a message if the value is an integer but in string format', () => {
      target.checkInteger('1', 'block')

      expect(target.messages[0]).toEqual({ message: 'block must be an integer', errorCode: 'ZZ10' })
    })

    test('adds a message if the value is a floating point', () => {
      target.checkInteger(1.1, 'block')

      expect(target.messages[0]).toEqual({ message: 'block must be an integer', errorCode: 'ZZ10' })
    })

    test('does not add a message if the value is an integer', () => {
      target.checkInteger(1, 'block')

      expect(target.messages.length).toEqual(0)
    })
  })

  describe('checkNumericRange', () => {
    test('adds a message if the value is too low', () => {
      target.checkNumericRange(0, { min: 1, max: 2 }, 'test')

      expect(target.messages[0]).toEqual({ message: 'test value is out of numeric range(min=1 max=2)', errorCode: 'ZZ06' })
    })

    test('adds a message if the value is too high', () => {
      target.checkNumericRange(3, { min: 1, max: 2 }, 'test')

      expect(target.messages[0]).toEqual({ message: 'test value is out of numeric range(min=1 max=2)', errorCode: 'ZZ06' })
    })

    test('does not add a message if the value is within the range', () => {
      target.checkNumericRange(2, { min: 1, max: 3 }, 'test')

      expect(target.messages.length).toEqual(0)
    })
  })

  describe('checkConstants', () => {
    test('adds a message if value is not found in data', () => {
      target.checkConstants(1, [2], 'test')

      expect(target.messages[0]).toEqual({ message: 'test requires a valid value', errorCode: 'ZZ07' })
    })

    test('does not add a message if value is in data', () => {
      target.checkConstants(1, [1, 2], 'test')

      expect(target.messages.length).toEqual(0)
    })
  })

  describe('checkBoolean', () => {
    test('adds a message if value is not a boolean', () => {
      target.checkBoolean('test', 'test')

      expect(target.messages[0]).toEqual({ message: 'test must be a boolean', errorCode: 'ZZ08' })
    })

    test('does not add a message if value is a boolean', () => {
      target.checkBoolean(true, 'test')

      expect(target.messages.length).toEqual(0)
    })
  })

  describe('checkReferentialIntegrityById', () => {
    test('does not add a message if data is found for id', () => {
      target.referentialIntegrityService.getById = mockResolve({})

      return target.checkReferentialIntegrityById(1, {}).then(() => {
        expect(target.messages.length).toEqual(0)
      })
    })

    test('adds a message if data is not found for id', () => {
      target.referentialIntegrityService.getById = mockResolve()
      target.getEntityName = mock('test')

      return target.checkReferentialIntegrityById(1, {}).then(() => {
        expect(target.referentialIntegrityService.getById).toHaveBeenCalledWith(1, {})
        expect(target.messages[0]).toEqual({ message: 'test not found for id 1', errorCode: 'ZZ09' })
      })
    })

    test('rejects if getById fails', () => {
      target.referentialIntegrityService.getById = mockReject('error')

      return target.checkReferentialIntegrityById(1, {}).then(() => {}, (err) => {
        expect(target.referentialIntegrityService.getById).toHaveBeenCalledWith(1, {})
        expect(err).toEqual('error')
      })
    })
  })

  describe('checkRIBatch', () => {
    test('returns all promises for RI checks', () => {
      target.getPromiseForRIorBusinessKeyCheck = mockResolve()

      return target.checkRIBatch([{}]).then(() => {
        expect(target.getPromiseForRIorBusinessKeyCheck).toHaveBeenCalledTimes(1)
      })
    })

    test('rejects when a promise fails in RI checks', () => {
      target.getPromiseForRIorBusinessKeyCheck = mockReject('error')

      return target.checkRIBatch([{}]).then(() => {}, (err) => {
        expect(target.getPromiseForRIorBusinessKeyCheck).toHaveBeenCalledTimes(1)
        expect(err).toEqual('error')
      })
    })
  })

  describe('checkArray', () => {
    test('does not push a message when entityCount min and max are undefined', () => {
      target.checkArray([], 'test', {})

      expect(target.messages.length).toEqual(0)
    })

    test('pushes a message when value is shorter than min value', () => {
      target.checkArray(['1'], 'test', { min: 2 })
      expect(target.messages.length).toEqual(1)
    })

    test('pushes a message when value is longer than max value', () => {
      target.checkArray(['1', '2'], 'test', { max: 1 })
      expect(target.messages.length).toEqual(1)
    })
  })

  describe('getPromiseForRIorBusinessKeyCheck', () => {
    test('returns a resolved promise if groupSet is empty', () => {
      target.verifyBusinessKeysAreUnique = mock()
      target.verifyIdsExist = mock()

      return target.getPromiseForRIorBusinessKeyCheck([]).then(() => {
        expect(target.verifyBusinessKeysAreUnique).not.toHaveBeenCalled()
        expect(target.verifyIdsExist).not.toHaveBeenCalled()
      })
    })

    test('returns verifyIdsExist when ids are not empty', () => {
      target.verifyBusinessKeysAreUnique = mock()
      target.verifyIdsExist = mockResolve()
      target.getDistinctIds = mock([1])

      return target.getPromiseForRIorBusinessKeyCheck([{}]).then(() => {
        expect(target.verifyBusinessKeysAreUnique).not.toHaveBeenCalled()
        expect(target.verifyIdsExist).toHaveBeenCalled()
      })
    })

    test('returns verifyBusinessKeysAreUnique when ids are empty', () => {
      target.verifyBusinessKeysAreUnique = mockResolve()
      target.verifyIdsExist = mock()
      target.getDistinctIds = mock([])

      return target.getPromiseForRIorBusinessKeyCheck([{}]).then(() => {
        expect(target.verifyBusinessKeysAreUnique).toHaveBeenCalled()
        expect(target.verifyIdsExist).not.toHaveBeenCalled()
      })
    })
  })

  describe('getDistinctIds', () => {
    test('returns ids removing undefined and null values', () => {
      const groupSet = [{ id: 1 }, { id: null }, { id: undefined }, { id: 4 }, { id: 1 }]

      expect(target.getDistinctIds(groupSet)).toEqual([1, 4])
    })
  })

  describe('verifyIdsExist', () => {
    test('does not add a message if all ids exist', () => {
      target.referentialIntegrityService.getEntitiesByIds = mockResolve([{}, {}])

      return target.verifyIdsExist([1, 2], {}, {}).then(() => {
        expect(target.referentialIntegrityService.getEntitiesByIds).toHaveBeenCalledWith([1, 2], {})
        expect(target.messages.length).toEqual(0)
      })
    })

    test('adds a message when not all entities are found for ids requested', () => {
      target.referentialIntegrityService.getEntitiesByIds = mockResolve([{}])
      target.getEntityName = mock('test')
      target.getIdDifference = mock([2])

      return target.verifyIdsExist([1, 2], [{ paramName: 'testParam' }], {}).then(() => {
        expect(target.referentialIntegrityService.getEntitiesByIds).toHaveBeenCalledWith([1, 2], {})
        expect(target.messages.length).toEqual(1)
        expect(target.messages[0]).toEqual({ message: 'test not found for testParam(s): 2', errorCode: 'ZZ0B' })
      })
    })

    test('rejects when getEntitiesByIds fails', () => {
      target.referentialIntegrityService.getEntitiesByIds = mockReject('error')

      return target.verifyIdsExist([1, 2], [], {}).then(() => {}, (err) => {
        expect(err).toEqual('error')
      })
    })
  })

  describe('extractBusinessKeys', () => {
    test('returns an array of objects with keys and updateId', () => {
      expect(target.extractBusinessKeys([{
        keys: [{}],
        updateId: 1,
        test: 'test',
      }])).toEqual([{ keys: [{}], updateId: 1 }])
    })
  })

  describe('verifyBusinessKeysAreUnique', () => {
    test('it does not add a message when business keys are unique', () => {
      target.extractBusinessKeys = mock([{ keys: ['test1'] }])
      target.referentialIntegrityService.getEntitiesByKeys = mockResolve()

      return target.verifyBusinessKeysAreUnique([], {}).then(() => {
        expect(target.messages.length).toEqual(0)
      })
    })

    test('it does not add a message when business keys are unique (empty array)', () => {
      target.extractBusinessKeys = mock([{ keys: ['test1'] }])
      target.referentialIntegrityService.getEntitiesByKeys = mockResolve([])

      return target.verifyBusinessKeysAreUnique([], {}).then(() => {
        expect(target.messages.length).toEqual(0)
      })
    })

    test('adds a message when business keys are not unique', () => {
      target.extractBusinessKeys = mock([{ keys: ['test1', 'test2'] }])
      target.referentialIntegrityService.getEntitiesByKeys = mockResolve([{}])
      target.getEntityName = mock('test')
      target.formatBusinessKey = mock('test1,test2')

      return target.verifyBusinessKeysAreUnique([], {}).then(() => {
        expect(target.messages[0]).toEqual({ message: 'test already exists for business keys test1,test2', errorCode: 'ZZ0C' })
      })
    })

    test('rejects when getEntitiesByKeys fails', () => {
      target.extractBusinessKeys = mock([{ keys: ['test1'] }])
      target.referentialIntegrityService.getEntitiesByKeys = mockReject('error')

      return target.verifyBusinessKeysAreUnique([], {}).then(() => {}, (err) => {
        expect(err).toEqual('error')
      })
    })
  })

  describe('getIdDifference', () => {
    test('returns the difference of database ids and passed in ids', () => {
      expect(target.getIdDifference([1, 2], [{ id: 1 }])).toEqual([2])
    })

    test('returns empty array when ids are the same', () => {
      expect(target.getIdDifference([1, 2], [{ id: 1 }, { id: 2 }])).toEqual([])
    })
  })

  describe('formatBusinessKey', () => {
    test('formats keys into a string separated by commas', () => {
      expect(target.formatBusinessKey(['test1', 'test2'])).toEqual('test1,test2')
    })
  })

  describe('getEntityName', () => {
    test('throws an error', () => {
      expect(() => {
        target.getEntityName()
      }).toThrow()
    })
  })

  describe('check', () => {
    test('returns resolved promise when there are no messages', () => {
      AppError.badRequest = mock()

      return target.check().then(() => {
        expect(AppError.badRequest).not.toHaveBeenCalled()
      })
    })

    test('rejects when messages exist', () => {
      target.messages.push({ message: 'error!', errorCode: 'code' })
      AppError.badRequest = mock()

      return target.check().then(() => {}, () => {
        expect(AppError.badRequest).toHaveBeenCalledWith('error!', undefined, 'code')
      })
    })
  })
})
