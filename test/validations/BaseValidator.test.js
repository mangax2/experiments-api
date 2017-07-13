import { mock, mockReject, mockResolve } from '../jestUtil'
import BaseValidator from '../../src/validations/BaseValidator'
import AppError from '../../src/services/utility/AppError'

describe('BaseValidator', () => {
  let target
  const testTx = { tx: {} }

  beforeEach(() => {
    target = new BaseValidator()
  })

  describe('hasError', () => {
    it('returns false if messages are empty', () => {
      expect(target.hasErrors()).toEqual(false)
    })

    it('returns true when there is at least one message', () => {
      target.messages.push('error')

      expect(target.hasErrors()).toEqual(true)
    })
  })

  describe('validateArray', () => {
    it('calls validateEntity and validateBatchForRI', () => {
      target.validateEntity = mockResolve()
      target.validateBatchForRI = mockResolve()

      return target.validateArray([{}], 'POST', testTx).then(() => {
        expect(target.validateEntity).toHaveBeenCalledWith({}, 'POST', testTx)
        expect(target.validateBatchForRI).toHaveBeenCalledWith([{}], 'POST', testTx)
      })
    })

    it('does not call validateBatchForRI due to errors', () => {
      target.messages.push('error')
      target.validateEntity = mockResolve()
      target.validateBatchForRI = mock()

      return target.validateArray([{}], 'POST', testTx).then(() => {
        expect(target.validateEntity).toHaveBeenCalledWith({}, 'POST', testTx)
        expect(target.validateBatchForRI).not.toHaveBeenCalled()
      })
    })

    it('rejects when validateBatchForRI fails', () => {
      target.validateEntity = mockResolve()
      target.validateBatchForRI = mockReject('error')

      return target.validateArray([{}], 'POST', testTx).then(() => {}, (err) => {
        expect(target.validateEntity).toHaveBeenCalledWith({}, 'POST', testTx)
        expect(target.validateBatchForRI).toHaveBeenCalledWith([{}], 'POST', testTx)
        expect(err).toEqual('error')
      })
    })

    it('rejects when validateEntity fails', () => {
      target.validateEntity = mockReject('error')
      target.validateBatchForRI = mockReject('error')

      return target.validateArray([{}], 'POST', testTx).then(() => {}, (err) => {
        expect(target.validateEntity).toHaveBeenCalledWith({}, 'POST', testTx)
        expect(target.validateBatchForRI).not.toHaveBeenCalled()
        expect(err).toEqual('error')
      })
    })
  })

  describe('validateArray or SingleEntity', () => {
    it('calls validateArray when passed in object is an array', () => {
      target.validateArray = mock()
      target.validateEntity = mock()

      target.validateArrayOrSingleEntity([], 'POST', testTx)
      expect(target.validateArray).toHaveBeenCalledWith([], 'POST', testTx)
      expect(target.validateEntity).not.toHaveBeenCalled()
    })

    it('calls validateEntity when passed in object is not an array', () => {
      target.validateArray = mock()
      target.validateEntity = mock()

      target.validateArrayOrSingleEntity({}, 'POST', testTx)
      expect(target.validateEntity).toHaveBeenCalledWith({}, 'POST', testTx)
      expect(target.validateArray).not.toHaveBeenCalled()
    })
  })

  describe('validate', () => {
    it('calls preValidate, validateArrayOrSingleEntity, postValidate, and check', () => {
      target.preValidate = mockResolve()
      target.validateArrayOrSingleEntity = mockResolve()
      target.postValidate = mockResolve()
      target.check = mockResolve()

      return target.validate([], 'POST', testTx).then(() => {
        expect(target.preValidate).toHaveBeenCalledWith([])
        expect(target.validateArrayOrSingleEntity).toHaveBeenCalledWith([], 'POST', testTx)
        expect(target.postValidate).toHaveBeenCalledWith([], undefined)
        expect(target.check).toHaveBeenCalled()
      })
    })

    it('calls rejects when check fails', () => {
      target.preValidate = mockResolve()
      target.validateArrayOrSingleEntity = mockResolve()
      target.postValidate = mockResolve()
      target.check = mockReject('error')

      return target.validate([], 'POST', testTx).then(() => {}, (err) => {
        expect(target.preValidate).toHaveBeenCalledWith([])
        expect(target.validateArrayOrSingleEntity).toHaveBeenCalledWith([], 'POST', testTx)
        expect(target.postValidate).toHaveBeenCalledWith([], undefined)
        expect(target.check).toHaveBeenCalled()
        expect(err).toEqual('error')
      })
    })

    it('calls rejects when postValidate fails', () => {
      target.preValidate = mockResolve()
      target.validateArrayOrSingleEntity = mockResolve()
      target.postValidate = mockReject('error')
      target.check = mockReject('error')

      return target.validate([], 'POST', testTx).then(() => {}, (err) => {
        expect(target.preValidate).toHaveBeenCalledWith([])
        expect(target.validateArrayOrSingleEntity).toHaveBeenCalledWith([], 'POST', testTx)
        expect(target.postValidate).toHaveBeenCalledWith([], undefined)
        expect(target.check).not.toHaveBeenCalled()
        expect(err).toEqual('error')
      })
    })

    it('calls rejects when validateArrayOrSingleEntity fails', () => {
      target.preValidate = mockResolve()
      target.validateArrayOrSingleEntity = mockReject('error')
      target.postValidate = mockReject('error')
      target.check = mockReject('error')

      return target.validate([], 'POST', testTx).then(() => {}, (err) => {
        expect(target.preValidate).toHaveBeenCalledWith([])
        expect(target.validateArrayOrSingleEntity).toHaveBeenCalledWith([], 'POST', testTx)
        expect(target.postValidate).not.toHaveBeenCalled()
        expect(target.check).not.toHaveBeenCalled()
        expect(err).toEqual('error')
      })
    })

    it('calls rejects when preValidate fails', () => {
      target.preValidate = mockReject('error')
      target.validateArrayOrSingleEntity = mockReject('error')
      target.postValidate = mockReject('error')
      target.check = mockReject('error')

      return target.validate([], 'POST', testTx).then(() => {}, (err) => {
        expect(target.preValidate).toHaveBeenCalledWith([])
        expect(target.validateArrayOrSingleEntity).not.toHaveBeenCalled()
        expect(target.postValidate).not.toHaveBeenCalled()
        expect(target.check).not.toHaveBeenCalled()
        expect(err).toEqual('error')
      })
    })
  })

  describe('preValidate', () => {
    it('returns a resolved Promise', () => {
      return target.preValidate().then(() => {})
    })
  })

  describe('postValidate', () => {
    it('returns a resolved Promise', () => {
      return target.postValidate().then(() => {})
    })
  })

  describe('validateEntity', () => {
    it('rejects with an error', () => {
      return target.validateEntity().then(() => {}, (err) => {
        expect(err).toEqual('Server error, please contact support')
      })
    })
  })

  describe('validateBatchForRI', () => {
    it('rejects with an error', () => {
      return target.validateBatchForRI().then(() => {}, (err) => {
        expect(err).toEqual('Server error, please contact support')
      })
    })
  })

  describe('checkLength', () => {
    it('adds a message if value is not a string', () => {
      target.checkLength({}, { min: 0, max: 0 }, 'test')
      expect(target.messages[0]).toEqual('test must be a string')
    })

    it('adds a message if value is too short', () => {
      target.checkLength('', { min: 1, max: 2 }, 'test')
      expect(target.messages[0]).toEqual('test length is out of range(min=1 max=2)')
    })

    it('adds a message if value is too long', () => {
      target.checkLength('abc', { min: 1, max: 2 }, 'test')
      expect(target.messages[0]).toEqual('test length is out of range(min=1 max=2)')
    })

    it('does not add a message if the string value is within the min and max', () => {
      target.checkLength('ab', { min: 1, max: 2 }, 'test')
      expect(target.messages.length).toEqual(0)
    })
  })

  describe('literalCheck', () => {
    it('adds a message if value is an object', () => {
      expect(target.literalCheck({}, 'test')).toEqual(false)
      expect(target.messages[0]).toEqual('test must be a literal value. Object and Arrays are' +
        ' not supported.')
    })

    it('adds a message if value is an array', () => {
      expect(target.literalCheck([], 'test')).toEqual(false)
      expect(target.messages[0]).toEqual('test must be a literal value. Object and Arrays are' +
        ' not supported.')
    })

    it('returns true if values is not an object or array', () => {
      expect(target.literalCheck('hi', 'test')).toEqual(true)
      expect(target.messages.length).toEqual(0)
    })
  })

  describe('checkRequired', () => {
    it('adds a message if value is undefined', () => {
      target.checkRequired(undefined, 'test')

      expect(target.messages[0]).toEqual('test is required')
    })

    it('adds a message if value is null', () => {
      target.checkRequired(null, 'test')

      expect(target.messages[0]).toEqual('test is required')
    })

    it('adds a message if value is empty', () => {
      target.checkRequired('', 'test')

      expect(target.messages[0]).toEqual('test is required')
    })

    it('does not add a message if value is filled', () => {
      target.checkRequired('test', 'test')

      expect(target.messages.length).toEqual(0)
    })
  })

  describe('checkNumeric', () => {
    it('adds a message if the value is not numeric', () => {
      target.checkNumeric('test', 'test')

      expect(target.messages[0]).toEqual('test must be numeric')
    })

    it('adds a message if the value is numeric but in string format', () => {
      target.checkNumeric('1', 'test')

      expect(target.messages[0]).toEqual('test must be numeric')
    })


    it('does not add a message if the value is numeric', () => {
      target.checkNumeric(1, 'test')

      expect(target.messages.length).toEqual(0)
    })
  })

  describe('checkNumericRange', () => {
    it('adds a message if the value is too low', () => {
      target.checkNumericRange(0, { min: 1, max: 2 }, 'test')

      expect(target.messages[0]).toEqual('test value is out of numeric range(min=1 max=2)')
    })

    it('adds a message if the value is too high', () => {
      target.checkNumericRange(3, { min: 1, max: 2 }, 'test')

      expect(target.messages[0]).toEqual('test value is out of numeric range(min=1 max=2)')
    })

    it('does not add a message if the value is within the range', () => {
      target.checkNumericRange(2, { min: 1, max: 3 }, 'test')

      expect(target.messages.length).toEqual(0)
    })
  })

  describe('checkConstants', () => {
    it('adds a message if value is not found in data', () => {
      target.checkConstants(1, [2], 'test')

      expect(target.messages[0]).toEqual('test requires a valid value')
    })

    it('does not add a message if value is in data', () => {
      target.checkConstants(1, [1, 2], 'test')

      expect(target.messages.length).toEqual(0)
    })
  })

  describe('checkBoolean', () => {
    it('adds a message if value is not a boolean', () => {
      target.checkBoolean('test', 'test')

      expect(target.messages[0]).toEqual('test must be a boolean')
    })

    it('does not add a message if value is a boolean', () => {
      target.checkBoolean(true, 'test')

      expect(target.messages.length).toEqual(0)
    })
  })

  describe('checkReferentialIntegrityById', () => {
    it('does not add a message if data is found for id', () => {
      target.referentialIntegrityService.getById = mockResolve({})

      return target.checkReferentialIntegrityById(1, {}, testTx).then(() => {
        expect(target.messages.length).toEqual(0)
      })
    })

    it('adds a message if data is not found for id', () => {
      target.referentialIntegrityService.getById = mockResolve()
      target.getEntityName = mock('test')

      return target.checkReferentialIntegrityById(1, {}, testTx).then(() => {
        expect(target.referentialIntegrityService.getById).toHaveBeenCalledWith(1, {}, testTx)
        expect(target.messages[0]).toEqual('test not found for id 1')
      })
    })

    it('rejects if getById fails', () => {
      target.referentialIntegrityService.getById = mockReject('error')

      return target.checkReferentialIntegrityById(1, {}, testTx).then(() => {}, (err) => {
        expect(target.referentialIntegrityService.getById).toHaveBeenCalledWith(1, {}, testTx)
        expect(err).toEqual('error')
      })
    })
  })

  describe('checkRIBatch', () => {
    it('returns all promises for RI checks', () => {
      target.getPromiseForRIorBusinessKeyCheck = mockResolve()

      return target.checkRIBatch([{}], testTx).then(() => {
        expect(target.getPromiseForRIorBusinessKeyCheck).toHaveBeenCalledTimes(1)
      })
    })

    it('rejects when a promise fails in RI checks', () => {
      target.getPromiseForRIorBusinessKeyCheck = mockReject('error')

      return target.checkRIBatch([{}], testTx).then(() => {}, (err) => {
        expect(target.getPromiseForRIorBusinessKeyCheck).toHaveBeenCalledTimes(1)
        expect(err).toEqual('error')
      })
    })
  })

  describe('checkArray', () => {
    it('does not push a message when entityCount min and max are undefined', () => {
      target.checkArray([], 'test', {})

      expect(target.messages.length).toEqual(0)
    })

    it('pushes a message when value is shorter than min value', () => {
      target.checkArray(['1'], 'test', {min: 2})
      expect(target.messages.length).toEqual(1)
    })

    it('pushes a message when value is longer than max value', () => {
      target.checkArray(['1','2'], 'test', {max: 1})
      expect(target.messages.length).toEqual(1)
    })
  })

  describe('getPromiseForRIorBusinessKeyCheck', () => {
    it('returns a resolved promise if groupSet is empty', () => {
      target.verifyBusinessKeysAreUnique = mock()
      target.verifyIdsExist = mock()

      return target.getPromiseForRIorBusinessKeyCheck([], testTx).then(() => {
        expect(target.verifyBusinessKeysAreUnique).not.toHaveBeenCalled()
        expect(target.verifyIdsExist).not.toHaveBeenCalled()
      })
    })

    it('returns verifyIdsExist when ids are not empty', () => {
      target.verifyBusinessKeysAreUnique = mock()
      target.verifyIdsExist = mockResolve()
      target.getDistinctIds = mock([1])

      return target.getPromiseForRIorBusinessKeyCheck([{}], testTx).then(() => {
        expect(target.verifyBusinessKeysAreUnique).not.toHaveBeenCalled()
        expect(target.verifyIdsExist).toHaveBeenCalled()
      })
    })

    it('returns verifyBusinessKeysAreUnique when ids are empty', () => {
      target.verifyBusinessKeysAreUnique = mockResolve()
      target.verifyIdsExist = mock()
      target.getDistinctIds = mock([])

      return target.getPromiseForRIorBusinessKeyCheck([{}], testTx).then(() => {
        expect(target.verifyBusinessKeysAreUnique).toHaveBeenCalled()
        expect(target.verifyIdsExist).not.toHaveBeenCalled()
      })
    })
  })

  describe('getDistinctIds', () => {
    it('returns ids removing undefined and null values', () => {
      const groupSet = [{ id: 1 }, { id: null }, { id: undefined }, { id: 4 }, { id: 1 }]

      expect(target.getDistinctIds(groupSet)).toEqual([1, 4])
    })
  })

  describe('verifyIdsExist', () => {
    it('does not add a message if all ids exist', () => {
      target.referentialIntegrityService.getEntitiesByIds = mockResolve([{}, {}])

      return target.verifyIdsExist([1, 2], {}, {}, testTx).then(() => {
        expect(target.referentialIntegrityService.getEntitiesByIds).toHaveBeenCalledWith([1, 2], {}, testTx)
        expect(target.messages.length).toEqual(0)
      })
    })

    it('adds a message when not all entities are found for ids requested', () => {
      target.referentialIntegrityService.getEntitiesByIds = mockResolve([{}])
      target.getEntityName = mock('test')
      target.getIdDifference = mock([2])

      return target.verifyIdsExist([1, 2], [{ paramName: 'testParam' }], {}, testTx).then(() => {
        expect(target.referentialIntegrityService.getEntitiesByIds).toHaveBeenCalledWith([1, 2], {}, testTx)
        expect(target.messages.length).toEqual(1)
        expect(target.messages[0]).toEqual('test not found for testParam(s): 2')
      })
    })

    it('rejects when getEntitiesByIds fails', () => {
      target.referentialIntegrityService.getEntitiesByIds = mockReject('error')

      return target.verifyIdsExist([1, 2], [], {}, testTx).then(() => {}, (err) => {
        expect(err).toEqual('error')
      })
    })
  })

  describe('extractBusinessKeys', () => {
    it('returns an array of objects with keys and updateId', () => {
      expect(target.extractBusinessKeys([{
        keys: [{}],
        updateId: 1,
        test: 'test',
      }])).toEqual([{ keys: [{}], updateId: 1 }])
    })
  })

  describe('verifyBusinessKeysAreUnique', () => {
    it('it does not add a message when business keys are unique', () => {
      target.extractBusinessKeys = mock([{keys: ['test1']}])
      target.referentialIntegrityService.getEntitiesByKeys = mockResolve()

      return target.verifyBusinessKeysAreUnique([], {}, testTx).then(() => {
        expect(target.messages.length).toEqual(0)
      })
    })

    it('it does not add a message when business keys are unique (empty array)', () => {
      target.extractBusinessKeys = mock([{keys: ['test1']}])
      target.referentialIntegrityService.getEntitiesByKeys = mockResolve([])

      return target.verifyBusinessKeysAreUnique([], {}, testTx).then(() => {
        expect(target.messages.length).toEqual(0)
      })
    })

    it('adds a message when business keys are not unique', () => {
      target.extractBusinessKeys = mock([{keys: ['test1','test2']}])
      target.referentialIntegrityService.getEntitiesByKeys = mockResolve([{}])
      target.getEntityName = mock('test')
      target.formatBusinessKey = mock('test1,test2')

      return target.verifyBusinessKeysAreUnique([], {}, testTx).then(() => {
        expect(target.messages[0]).toEqual('test already exists for business' +
          ' keys test1,test2')
      })
    })

    it('rejects when getEntitiesByKeys fails', () => {
      target.extractBusinessKeys = mock([{keys: ['test1']}])
      target.referentialIntegrityService.getEntitiesByKeys = mockReject('error')

      return target.verifyBusinessKeysAreUnique([], {}, testTx).then(() => {}, (err) => {
        expect(err).toEqual('error')
      })
    })
  })

  describe('getIdDifference', () => {
    it('returns the difference of database ids and passed in ids', () => {
      expect(target.getIdDifference([1, 2], [{ id: 1 }])).toEqual([2])
    })

    it('returns empty array when ids are the same', () => {
      expect(target.getIdDifference([1, 2], [{ id: 1 }, { id: 2 }])).toEqual([])
    })
  })

  describe('formatBusinessKey', () => {
    it('formats keys into a string separated by commas', () => {
      expect(target.formatBusinessKey(["test1","test2"])).toEqual('test1,test2')
    })
  })

  describe('getEntityName', () => {
    it('throws an error', () => {
      expect(() => {
       target.getEntityName()
      }).toThrow()
    })
  })

  describe('check', () => {
    it('returns resolved promise when there are no messages', () => {
      AppError.badRequest = mock()

      return target.check().then(() => {
        expect(AppError.badRequest).not.toHaveBeenCalled()
      })
    })

    it('rejects when messages exist', () => {
      target.messages.push('error!')
      AppError.badRequest = mock()

      return target.check().then(() => {}, () => {
        expect(AppError.badRequest).toHaveBeenCalledWith('error!')
      })
    })
  })
})