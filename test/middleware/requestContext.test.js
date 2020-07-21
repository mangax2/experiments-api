import { mock } from '../jestUtil'
import AppError from '../../src/services/utility/AppError'
import requestContextMiddlewareFunction from '../../src/middleware/requestContext'


describe('requestContextMiddlewareFunction', () => {
  const createHeader = (value, provider) => {
    switch (provider) {
      case 'ping': {
        return { oauth_resourceownerinfo: value }
      }
      case 'azure': {
        if (value.startsWith('username=')) {
          value = value.split('=')[1]
          if (value === ' ' || value === '') { value = undefined } // 'username= '
          return { 'x-bayer-cwid': value }
        } else { return {} }  // 'test=test'
      }
      default: {
        throw Error('Invalid option for provider')
      }
    }
  }

  describe.each(['ping', 'azure'])('with %s token', (provider) => {

    const validHeaders = createHeader('username=fakeuser', provider)
    const invalidRequest1 = { method: 'POST', headers: undefined }
    const invalidRequest2 = { method: 'POST' }
    const invalidRequest3 = { method: 'POST', headers: createHeader('test=test', provider) }
    const invalidRequest4 = { method: 'POST', headers: createHeader('username', provider) }
    const invalidRequest5 = { method: 'POST', headers: createHeader('username= ', provider) }

    const nextFunc = jest.fn()
    const res = { set: jest.fn() }

    beforeEach(() => {
      nextFunc.mockReset()
      res.set.mockReset()
    })

    test('calls next if headers are valid and is a POST call', () => {
      const req = { method: 'POST', headers: validHeaders }

      requestContextMiddlewareFunction(req, res, nextFunc)
      expect(res.set).toHaveBeenCalled()
      expect(nextFunc).toHaveBeenCalled()
    })

    test('returns the given request id if one is provided', () => {
      const req = { method: 'POST', headers: { ...createHeader('username=fakeuser', provider),
                                               'X-Request-Id': '25' } }

      requestContextMiddlewareFunction(req, res, nextFunc)
      expect(res.set).toHaveBeenCalledWith('X-Request-Id', '25')
      expect(nextFunc).toHaveBeenCalled()
    })

    test('calls next if headers are valid and is a PUT call', () => {
      const req = { method: 'PUT', headers: validHeaders }

      requestContextMiddlewareFunction(req, res, nextFunc)
      expect(res.set).toHaveBeenCalled()
      expect(nextFunc).toHaveBeenCalled()
    })

    test('calls next if headers are valid and is a PATCH call', () => {
      const req = { method: 'PATCH', headers: validHeaders }

      requestContextMiddlewareFunction(req, res, nextFunc)
      expect(res.set).toHaveBeenCalled()
      expect(nextFunc).toHaveBeenCalled()
    })

    test('calls next if headers are valid and is a DELETE call', () => {
      const req = { method: 'DELETE', headers: validHeaders }

      requestContextMiddlewareFunction(req, res, nextFunc)
      expect(res.set).toHaveBeenCalled()
      expect(nextFunc).toHaveBeenCalled()
    })

    describe('error conditions', () => {
      beforeEach(() => {
        AppError.badRequest = jest.fn().mockReturnValue('')
      })

      afterAll(() => {
        AppError.badRequest.mockRestore()
      })

      test('throws an error when called with undefined headers', () => {
        expect(() => { requestContextMiddlewareFunction(invalidRequest1, res, nextFunc) }).toThrow()
        expect(AppError.badRequest).toHaveBeenCalledTimes(1)
        expect(res.set).toHaveBeenCalled()
        expect(nextFunc).not.toHaveBeenCalled()
      })

      test('throws an error when called with empty headers', () => {
        expect(() => { requestContextMiddlewareFunction(invalidRequest2, res, nextFunc) }).toThrow()
        expect(AppError.badRequest).toHaveBeenCalledTimes(1)
        expect(res.set).toHaveBeenCalled()
        expect(nextFunc).not.toHaveBeenCalled()
      })

      test('throws an error when called with invalid value in header', () => {
        expect(() => { requestContextMiddlewareFunction(invalidRequest3, res, nextFunc) }).toThrow()
        expect(AppError.badRequest).toHaveBeenCalledTimes(1)
        expect(res.set).toHaveBeenCalled()
        expect(nextFunc).not.toHaveBeenCalled()
      })

      test('throws an error when called with no userId', () => {
        expect(() => { requestContextMiddlewareFunction(invalidRequest4, res, nextFunc) }).toThrow()
        expect(AppError.badRequest).toHaveBeenCalledTimes(1)
        expect(res.set).toHaveBeenCalled()
        expect(nextFunc).not.toHaveBeenCalled()
      })

      test('throws an error when called with empty userId', () => {
        expect(() => { requestContextMiddlewareFunction(invalidRequest5, res, nextFunc) }).toThrow()
        expect(AppError.badRequest).toHaveBeenCalledTimes(1)
        expect(res.set).toHaveBeenCalled()
        expect(nextFunc).not.toHaveBeenCalled()
      })
    })

    test('calls to get client id and sets user to SERVICE-USER when graphql call', async () => {
      const req = { method: 'POST', headers: {}, url: '/experiments-api-graphql/graphql' }

      await requestContextMiddlewareFunction(req, res, nextFunc)

      expect(nextFunc).toHaveBeenCalled()
      expect(req.context.userId).toEqual('SERVICE-USER')
      expect(req.context.clientId).toEqual('PD-EXPERIMENTS-API-DEV-SVC')
    })

    test('retrieves the username from the header when it is populated and the oauth_resourceownerinfo does not have that information', async () => {
      const req = { method: 'POST', headers: { ...createHeader('test=test', provider),
                                               username: 'fakeuser' } }

      await requestContextMiddlewareFunction(req, res, nextFunc)
      expect(nextFunc).toHaveBeenCalled()
      expect(req.context.userId).toEqual('FAKEUSER')
    })

    test('marks the request as from an API if the oauth_resourceownerinfo does not have username information', () => {
      const req = { method: 'POST', headers: { ...createHeader('test=test', provider),
                                               username: 'fakeuser' } }

      return new Promise(resolve => resolve(requestContextMiddlewareFunction(req, res, nextFunc)))
          .then(() => {
            expect(nextFunc).toHaveBeenCalled()
            expect(req.context.isApiRequest).toEqual(true)
          })
    })

    test('retrieves the username from the oauth_resourceownerinfo when both it and the username header have that information', () => {
      const req = { method: 'POST', headers: { ...createHeader('username=fakeuser2', provider),
                                               username: 'fakeuser' } }

      return new Promise(resolve => resolve(requestContextMiddlewareFunction(req, res, nextFunc)))
          .then(() => {
            expect(nextFunc).toHaveBeenCalled()
            expect(req.context.userId).toEqual('FAKEUSER2')
          })
    })

    test('calls to get client id when graphql call', () => {
      const req = { method: 'POST', headers: validHeaders, url: '/experiments-api-graphql/graphql' }

      return new Promise(resolve => resolve(requestContextMiddlewareFunction(req, res, nextFunc)))
          .then(() => {
            expect(nextFunc).toHaveBeenCalled()
            expect(req.context.userId).toEqual('FAKEUSER')
            expect(req.context.clientId).toEqual('PD-EXPERIMENTS-API-DEV-SVC')
          })
    })
  })
})
