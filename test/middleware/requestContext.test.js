import { mock } from '../jestUtil'
import AppError from '../../src/services/utility/AppError'
import requestContextMiddlewareFunction from '../../src/middleware/requestContext'

describe('requestContextMiddlewareFunction', () => {
  beforeEach(() => {
    expect.hasAssertions()
  })

  const validHeaders = { oauth_resourceownerinfo: 'username=fakeuser' }
  const invalidRequest1 = { method: 'POST', headers: undefined }
  const invalidRequest2 = { method: 'POST' }
  const invalidRequest3 = { method: 'POST', headers: { oauth_resourceownerinfo: 'test=test' } }
  const invalidRequest4 = { method: 'POST', headers: { oauth_resourceownerinfo: 'username' } }
  const invalidRequest5 = { method: 'POST', headers: { oauth_resourceownerinfo: 'username= ' } }

  test('calls next if headers are valid and is a POST call', () => {
    const nextFunc = mock()
    const req = { method: 'POST', headers: validHeaders }
    const res = { set: mock() }

    requestContextMiddlewareFunction(req, res, nextFunc)
    expect(res.set).toHaveBeenCalled()
    expect(nextFunc).toHaveBeenCalled()
  })

  test('returns the given request id if one is provided', () => {
    const nextFunc = mock()
    const req = { method: 'POST', headers: { oauth_resourceownerinfo: 'username=fakeuser', 'X-Request-Id': '25' } }
    const res = { set: mock() }

    requestContextMiddlewareFunction(req, res, nextFunc)
    expect(res.set).toHaveBeenCalledWith('X-Request-Id', '25')
    expect(nextFunc).toHaveBeenCalled()
  })

  test('calls next if headers are valid and is a PUT call', () => {
    const nextFunc = mock()
    const req = { method: 'PUT', headers: validHeaders }
    const res = { set: mock() }

    requestContextMiddlewareFunction(req, res, nextFunc)
    expect(res.set).toHaveBeenCalled()
    expect(nextFunc).toHaveBeenCalled()
  })

  test('calls next if headers are valid and is a PATCH call', () => {
    const nextFunc = mock()
    const req = { method: 'PATCH', headers: validHeaders }
    const res = { set: mock() }

    requestContextMiddlewareFunction(req, res, nextFunc)
    expect(res.set).toHaveBeenCalled()
    expect(nextFunc).toHaveBeenCalled()
  })

  test('calls next if headers are valid and is a DELETE call', () => {
    const nextFunc = mock()
    const req = { method: 'DELETE', headers: validHeaders }
    const res = { set: mock() }

    requestContextMiddlewareFunction(req, res, nextFunc)
    expect(res.set).toHaveBeenCalled()
    expect(nextFunc).toHaveBeenCalled()
  })

  test('throws an error when called with undefined headers', () => {
    const nextFunc = mock()
    AppError.badRequest = mock('')
    const res = { set: mock() }

    expect(() => { requestContextMiddlewareFunction(invalidRequest1, res, nextFunc) }).toThrow()
    expect(AppError.badRequest).toHaveBeenCalledWith('oauth_resourceownerinfo header with username=<user_id> value is invalid/missing')
    expect(res.set).toHaveBeenCalled()
    expect(nextFunc).not.toHaveBeenCalled()
  })

  test('throws an error when called with empty headers', () => {
    const nextFunc = mock()
    AppError.badRequest = mock('')
    const res = { set: mock() }

    expect(() => { requestContextMiddlewareFunction(invalidRequest2, res, nextFunc) }).toThrow()
    expect(AppError.badRequest).toHaveBeenCalledWith('oauth_resourceownerinfo header with username=<user_id> value is invalid/missing')
    expect(res.set).toHaveBeenCalled()
    expect(nextFunc).not.toHaveBeenCalled()
  })

  test('throws an error when called with invalid oauth_resourceownerinfo header', () => {
    const nextFunc = mock()
    AppError.badRequest = mock('')
    const res = { set: mock() }

    expect(() => { requestContextMiddlewareFunction(invalidRequest3, res, nextFunc) }).toThrow()
    expect(AppError.badRequest).toHaveBeenCalledWith('oauth_resourceownerinfo header with username=<user_id> value is invalid/missing')
    expect(res.set).toHaveBeenCalled()
    expect(nextFunc).not.toHaveBeenCalled()
  })

  test('throws an error when called with no userId', () => {
    const nextFunc = mock()
    AppError.badRequest = mock('')
    const res = { set: mock() }

    expect(() => { requestContextMiddlewareFunction(invalidRequest4, res, nextFunc) }).toThrow()
    expect(AppError.badRequest).toHaveBeenCalledWith('oauth_resourceownerinfo header with username=<user_id> value is invalid/missing')
    expect(res.set).toHaveBeenCalled()
    expect(nextFunc).not.toHaveBeenCalled()
  })

  test('throws an error when called with empty userId', () => {
    const nextFunc = mock()
    AppError.badRequest = mock('')
    const res = { set: mock() }

    expect(() => { requestContextMiddlewareFunction(invalidRequest5, res, nextFunc) }).toThrow()
    expect(AppError.badRequest).toHaveBeenCalledWith('oauth_resourceownerinfo header with username=<user_id> value is invalid/missing')
    expect(res.set).toHaveBeenCalled()
    expect(nextFunc).not.toHaveBeenCalled()
  })

  test('calls to get client id and sets user to SERVICE-USER when graphql call', () => {
    const nextFunc = mock()
    const req = { method: 'POST', headers: {}, url: '/experiments-api-graphql/graphql' }
    const res = { set: mock() }

    return new Promise(resolve => resolve(requestContextMiddlewareFunction(req, res, nextFunc)))
      .then(() => {
        expect(nextFunc).toHaveBeenCalled()
        expect(req.context.userId).toEqual('SERVICE-USER')
        expect(req.context.clientId).toEqual('PD-EXPERIMENTS-API-DEV-SVC')
      })
  })

  test('retrieves the username from the username header when it ispopulated and the oauth_resourceownerinfo does not have that information', () => {
    const nextFunc = mock()
    const req = { method: 'POST', headers: { oauth_resourceownerinfo: 'test=test', username: 'fakeuser' } }
    const res = { set: mock() }

    return new Promise(resolve => resolve(requestContextMiddlewareFunction(req, res, nextFunc)))
      .then(() => {
        expect(nextFunc).toHaveBeenCalled()
        expect(req.context.userId).toEqual('FAKEUSER')
      })
  })

  test('marks the request as from an API if the oauth_resourceownerinfo does not have username information', () => {
    const nextFunc = mock()
    const req = { method: 'POST', headers: { oauth_resourceownerinfo: 'test=test', username: 'fakeuser' } }
    const res = { set: mock() }

    return new Promise(resolve => resolve(requestContextMiddlewareFunction(req, res, nextFunc)))
      .then(() => {
        expect(nextFunc).toHaveBeenCalled()
        expect(req.context.isApiRequest).toEqual(true)
      })
  })

  test('retrieves the username from the oauth_resourceownerinfo when both it and the username header have that information', () => {
    const nextFunc = mock()
    const req = { method: 'POST', headers: { oauth_resourceownerinfo: 'username=fakeuser2', username: 'fakeuser' } }
    const res = { set: mock() }

    return new Promise(resolve => resolve(requestContextMiddlewareFunction(req, res, nextFunc)))
      .then(() => {
        expect(nextFunc).toHaveBeenCalled()
        expect(req.context.userId).toEqual('FAKEUSER2')
      })
  })

  test('calls to get client id when graphql call', () => {
    const nextFunc = mock()
    const req = { method: 'POST', headers: validHeaders, url: '/experiments-api-graphql/graphql' }
    const res = { set: mock() }

    return new Promise(resolve => resolve(requestContextMiddlewareFunction(req, res, nextFunc)))
      .then(() => {
        expect(nextFunc).toHaveBeenCalled()
        expect(req.context.userId).toEqual('FAKEUSER')
        expect(req.context.clientId).toEqual('PD-EXPERIMENTS-API-DEV-SVC')
      })
  })
})
