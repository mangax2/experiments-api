import setErrorDecorator from '../../src/decorators/setErrorDecorator'

const { addErrorHandling, setErrorCode } = setErrorDecorator()

class testClass {
  @setErrorCode('TEST123456')
  static arrowFunc = method => method()

  @setErrorCode('TEST654321')
  static regularFunc(method) {
    return method()
  }
}

describe('setErrorDecorator', () => {
  beforeEach(() => {
    expect.hasAssertions()
  })

  describe('setErrorCode', () => {
    test('adds error code to exception when it is not present in an arrow function', () => {
      const testMethod = () => { throw new Error('test') }

      try {
        testClass.arrowFunc(testMethod)
      } catch (err) {
        expect(err.message).toBe('test')
        expect(err.errorCode).toBe('TEST123456')
      }
    })

    test('adds error code to exception from promise when it is not present in an arrow function', () => {
      const testMethod = () => Promise.reject(new Error('test'))

      testClass.arrowFunc(testMethod)
        .catch((err) => {
          expect(err.message).toBe('test')
          expect(err.errorCode).toBe('TEST123456')
        })
    })

    test('does not add error code to exception when it is already present in an arrow function', () => {
      const error = new Error('test')
      error.errorCode = 'TEST741258'
      const testMethod = () => { throw error }

      try {
        testClass.arrowFunc(testMethod)
      } catch (err) {
        expect(err.message).toBe('test')
        expect(err.errorCode).toBe('TEST741258')
      }
    })

    test('does not add error code to exception from promise when it is already present in an arrow function', () => {
      const error = new Error('test')
      error.errorCode = 'TEST741258'
      const testMethod = () => Promise.reject(error)

      testClass.arrowFunc(testMethod)
        .catch((err) => {
          expect(err.message).toBe('test')
          expect(err.errorCode).toBe('TEST741258')
        })
    })

    test('does nothing to non-exception in an arrow function', () => {
      const testMethod = () => 5

      const result = testClass.arrowFunc(testMethod)

      expect(result).toBe(5)
    })

    test('does nothing to non-exception in promise in an arrow function', () => {
      const testMethod = () => Promise.resolve(5)

      return testClass.arrowFunc(testMethod).then((result) => {
        expect(result).toBe(5)
      })
    })

    test('adds error code to exception when it is not present in a regular function', () => {
      const testMethod = () => { throw new Error('test') }

      try {
        testClass.regularFunc(testMethod)
      } catch (err) {
        expect(err.message).toBe('test')
        expect(err.errorCode).toBe('TEST654321')
      }
    })

    test('adds error code to exception from promise when it is not present in a regular function', () => {
      const testMethod = () => Promise.reject(new Error('test'))

      testClass.regularFunc(testMethod)
        .catch((err) => {
          expect(err.message).toBe('test')
          expect(err.errorCode).toBe('TEST654321')
        })
    })

    test('does not add error code to exception when it is already present in a regular function', () => {
      const error = new Error('test')
      error.errorCode = 'TEST741258'
      const testMethod = () => { throw error }

      try {
        testClass.regularFunc(testMethod)
      } catch (err) {
        expect(err.message).toBe('test')
        expect(err.errorCode).toBe('TEST741258')
      }
    })

    test('does not add error code to exception from promise when it is already present in a regular function', () => {
      const error = new Error('test')
      error.errorCode = 'TEST741258'
      const testMethod = () => Promise.reject(error)

      testClass.regularFunc(testMethod)
        .catch((err) => {
          expect(err.message).toBe('test')
          expect(err.errorCode).toBe('TEST741258')
        })
    })

    test('does nothing to non-exception in a regular function', () => {
      const testMethod = () => 5

      const result = testClass.regularFunc(testMethod)

      expect(result).toBe(5)
    })

    test('does nothing to non-exception in promise in a regular function', () => {
      const testMethod = () => Promise.resolve(5)

      return testClass.regularFunc(testMethod).then((result) => {
        expect(result).toBe(5)
      })
    })
  })

  describe('setErrorPrefix', () => {
    test('sets the prefix property', () => {
      setErrorDecorator().setErrorPrefix('TestPrefix')

      expect(setErrorDecorator().getFullErrorCode('')).toBe('TestPrefix')
    })

    afterAll(() => {
      setErrorDecorator().setErrorPrefix('')
    })
  })

  describe('addErrorHandling', () => {
    test('adds error code to exception when it is not present', () => {
      const testMethod = () => { throw new Error('test') }
      const methodUnderTest = addErrorHandling('TEST123456', testMethod)

      try {
        methodUnderTest()
      } catch (err) {
        expect(err.message).toBe('test')
        expect(err.errorCode).toBe('TEST123456')
      }
    })

    test('adds error code to exception from promise when it is not present', () => {
      const testMethod = () => Promise.reject(new Error('test'))
      const methodUnderTest = addErrorHandling('TEST123456', testMethod)

      methodUnderTest()
        .catch((err) => {
          expect(err.message).toBe('test')
          expect(err.errorCode).toBe('TEST123456')
        })
    })

    test('does not add error code to exception when it is already present', () => {
      const error = new Error('test')
      error.errorCode = 'TEST741258'
      const testMethod = () => { throw error }
      const methodUnderTest = addErrorHandling('TEST123456', testMethod)

      try {
        methodUnderTest()
      } catch (err) {
        expect(err.message).toBe('test')
        expect(err.errorCode).toBe('TEST741258')
      }
    })

    test('does not add error code to exception from promise when it is already present', () => {
      const error = new Error('test')
      error.errorCode = 'TEST741258'
      const testMethod = () => Promise.reject(error)
      const methodUnderTest = addErrorHandling('TEST123456', testMethod)

      methodUnderTest()
        .catch((err) => {
          expect(err.message).toBe('test')
          expect(err.errorCode).toBe('TEST741258')
        })
    })

    test('does nothing to non-exception', () => {
      const testMethod = () => 5
      const methodUnderTest = addErrorHandling('TEST123456', testMethod)

      const result = methodUnderTest()

      expect(result).toBe(5)
    })

    test('does nothing to non-exception in promise', () => {
      const testMethod = () => Promise.resolve(5)
      const methodUnderTest = addErrorHandling('TEST123456', testMethod)

      return methodUnderTest().then((result) => {
        expect(result).toBe(5)
      })
    })
  })
})
