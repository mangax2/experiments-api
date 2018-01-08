import setErrorCode from '../../src/decorators/setErrorCode'

class testClass {
  @setErrorCode('TEST123456')
  static arrowFunc = method => method()

  @setErrorCode('TEST654321')
  static regularFunc(method) {
    return method()
  }
}

describe('setErrorCode', () => {
  it('adds error code to exception when it is not present in an arrow function', (done) => {
    const testMethod = () => { throw new Error('test') }

    try {
      testClass.arrowFunc(testMethod)
    } catch (err) {
      expect(err.message).toBe('test')
      expect(err.errorCode).toBe('TEST123456')
      done()
    }
  })

  it('adds error code to exception from promise when it is not present in an arrow function', (done) => {
    const testMethod = () => Promise.reject(new Error('test'))

    testClass.arrowFunc(testMethod)
      .catch((err) => {
        expect(err.message).toBe('test')
        expect(err.errorCode).toBe('TEST123456')
        done()
      })
  })

  it('does not add error code to exception when it is already present in an arrow function', (done) => {
    const error = new Error('test')
    error.errorCode = 'TEST741258'
    const testMethod = () => { throw error }

    try {
      testClass.arrowFunc(testMethod)
    } catch (err) {
      expect(err.message).toBe('test')
      expect(err.errorCode).toBe('TEST741258')
      done()
    }
  })

  it('does not add error code to exception from promise when it is already present in an arrow function', (done) => {
    const error = new Error('test')
    error.errorCode = 'TEST741258'
    const testMethod = () => Promise.reject(error)

    testClass.arrowFunc(testMethod)
      .catch((err) => {
        expect(err.message).toBe('test')
        expect(err.errorCode).toBe('TEST741258')
        done()
      })
  })

  it('does nothing to non-exception in an arrow function', () => {
    const testMethod = () => 5

    const result = testClass.arrowFunc(testMethod)

    expect(result).toBe(5)
  })

  it('does nothing to non-exception in promise in an arrow function', () => {
    const testMethod = () => Promise.resolve(5)

    return testClass.arrowFunc(testMethod).then((result) => {
      expect(result).toBe(5)
    })
  })

  it('adds error code to exception when it is not present in a regular function', (done) => {
    const testMethod = () => { throw new Error('test') }

    try {
      testClass.regularFunc(testMethod)
    } catch (err) {
      expect(err.message).toBe('test')
      expect(err.errorCode).toBe('TEST654321')
      done()
    }
  })

  it('adds error code to exception from promise when it is not present in a regular function', (done) => {
    const testMethod = () => Promise.reject(new Error('test'))

    testClass.regularFunc(testMethod)
      .catch((err) => {
        expect(err.message).toBe('test')
        expect(err.errorCode).toBe('TEST654321')
        done()
      })
  })

  it('does not add error code to exception when it is already present in a regular function', (done) => {
    const error = new Error('test')
    error.errorCode = 'TEST741258'
    const testMethod = () => { throw error }

    try {
      testClass.regularFunc(testMethod)
    } catch (err) {
      expect(err.message).toBe('test')
      expect(err.errorCode).toBe('TEST741258')
      done()
    }
  })

  it('does not add error code to exception from promise when it is already present in a regular function', (done) => {
    const error = new Error('test')
    error.errorCode = 'TEST741258'
    const testMethod = () => Promise.reject(error)

    testClass.regularFunc(testMethod)
      .catch((err) => {
        expect(err.message).toBe('test')
        expect(err.errorCode).toBe('TEST741258')
        done()
      })
  })

  it('does nothing to non-exception in a regular function', () => {
    const testMethod = () => 5

    const result = testClass.regularFunc(testMethod)

    expect(result).toBe(5)
  })

  it('does nothing to non-exception in promise in a regular function', () => {
    const testMethod = () => Promise.resolve(5)

    return testClass.regularFunc(testMethod).then((result) => {
      expect(result).toBe(5)
    })
  })
})
