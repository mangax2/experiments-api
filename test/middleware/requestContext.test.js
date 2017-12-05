import { mock } from '../jestUtil'
import AppError from '../../src/services/utility/AppError'
import requestContextMiddlewareFunction from '../../src/middleware/requestContext'

describe('requestContextMiddlewareFunction', () => {
  it('calls next if a url is in the whitelisted urls', () => {
    const nextFunc = mock()
    const req = { url: '/experiments-api/api-docs' }
    const res = { set: mock() }

    requestContextMiddlewareFunction(req, res, nextFunc)
    expect(res.set).toHaveBeenCalled()
    expect(nextFunc).toHaveBeenCalled()
  })

  it('calls next if a url is a png request', () => {
    const nextFunc = mock()
    const req = { url: '/experiments-api/api-docs.png' }
    const res = { set: mock() }

    requestContextMiddlewareFunction(req, res, nextFunc)
    expect(res.set).toHaveBeenCalled()
    expect(nextFunc).toHaveBeenCalled()
  })

  it('calls next if a url is a jpeg request', () => {
    const nextFunc = mock()
    const req = { url: '/experiments-api/api-docs.jpg' }
    const res = { set: mock() }

    requestContextMiddlewareFunction(req, res, nextFunc)
    expect(res.set).toHaveBeenCalled()
    expect(nextFunc).toHaveBeenCalled()
  })

  it('calls next if a url is an markdown request', () => {
    const nextFunc = mock()
    const req = { url: '/experiments-api/api-docs.md' }
    const res = { set: mock() }

    requestContextMiddlewareFunction(req, res, nextFunc)
    expect(res.set).toHaveBeenCalled()
    expect(nextFunc).toHaveBeenCalled()
  })

  it('calls next if url request is a GET call', () => {
    const nextFunc = mock()
    const req = { url: '/experiments-api/experiment', method: 'GET' }
    const res = { set: mock() }

    requestContextMiddlewareFunction(req, res, nextFunc)
    expect(res.set).toHaveBeenCalled()
    expect(nextFunc).toHaveBeenCalled()
  })

  it('throws an error when headers are null', () => {
    const nextFunc = mock()
    AppError.badRequest = mock({})
    const res = { set: mock() }

    expect(() => { requestContextMiddlewareFunction({ method: 'POST' }, res, nextFunc) }).toThrow()
    expect(AppError.badRequest).toHaveBeenCalledWith('oauth_resourceownerinfo headers is null.')
    expect(res.set).toHaveBeenCalled()
    expect(nextFunc).not.toHaveBeenCalled()
  })

  it('throws an error when oauth_resourceownerinfo header not found', () => {
    const nextFunc = mock()
    AppError.badRequest = mock({})
    const res = { set: mock() }

    expect(() => {requestContextMiddlewareFunction({ headers: {}, method: 'POST' }, res, nextFunc)}).toThrow()
    expect(AppError.badRequest).toHaveBeenCalledWith('oauth_resourceownerinfo header not found.')
    expect(res.set).toHaveBeenCalled()
    expect(nextFunc).not.toHaveBeenCalled()
  })

  it('throws an error when header not found among multiple headers', () => {
    const nextFunc = mock()
    AppError.badRequest = mock({})
    const res = { set: mock() }

    expect(() => {
      requestContextMiddlewareFunction({
        headers: {
          header1: 'blah',
          'header2': 'blah2',
        },
        method: 'POST',
      }, res, nextFunc)
    }).toThrow()
    expect(AppError.badRequest).toHaveBeenCalledWith('oauth_resourceownerinfo header not found.')
    expect(res.set).toHaveBeenCalled()
    expect(nextFunc).not.toHaveBeenCalled()
  })

  it('throws an error when username is missing from header value', () => {
    const nextFunc = mock()
    AppError.badRequest = mock({})
    const res = { set: mock() }

    expect(() => { requestContextMiddlewareFunction({ headers: { oauth_resourceownerinfo: 'notUserId=blah' }, method: 'POST' }, res, nextFunc)}).toThrow()
    expect(AppError.badRequest).toHaveBeenCalledWith('username not found within' +
      ' oauth_resourceownerinfo.')
    expect(res.set).toHaveBeenCalled()
    expect(nextFunc).not.toHaveBeenCalled()
  })

  it('throws an error when username does not represent a key value pair', () => {
    const nextFunc = mock()
    AppError.badRequest = mock({})
    const res = { set: mock() }

    expect(() => { requestContextMiddlewareFunction({ headers: { oauth_resourceownerinfo: 'username' }, method: 'POST' }, res, nextFunc)}).toThrow()
    expect(AppError.badRequest).toHaveBeenCalledWith('username within oauth_resourceownerinfo' +
      ' does not represent key=value pair.')
    expect(res.set).toHaveBeenCalled()
    expect(nextFunc).not.toHaveBeenCalled()
  })

  it('throws an error when username value is empty', () => {
    const nextFunc = mock()
    AppError.badRequest = mock({})
    const res = { set: mock() }

    expect(() => { requestContextMiddlewareFunction({ headers: { oauth_resourceownerinfo: 'username=' }, method: 'POST' }, res, nextFunc)}).toThrow()
    expect(AppError.badRequest).toHaveBeenCalledWith('username within oauth_resourceownerinfo is' +
      ' empty string.')
    expect(res.set).toHaveBeenCalled()
    expect(nextFunc).not.toHaveBeenCalled()
  })

  it('throws an error when username value is a space', () => {
    const nextFunc = mock()
    AppError.badRequest = mock({})
    const res = { set: mock() }

    expect(() => { requestContextMiddlewareFunction({ headers: { oauth_resourceownerinfo: 'username= ' }, method: 'POST' }, res, nextFunc)}).toThrow()
    expect(AppError.badRequest).toHaveBeenCalledWith('username within oauth_resourceownerinfo is' +
      ' empty string.')
    expect(res.set).toHaveBeenCalled()
    expect(nextFunc).not.toHaveBeenCalled()
  })

  it('creates context when user id is only valid key value pair in header.', () => {
    const nextFunc = mock()
    AppError.badRequest = mock()
    const res = { set: mock() }

    const req = { headers: { oauth_resourceownerinfo: 'username=testUser' }, method: 'POST' }
    requestContextMiddlewareFunction(req, res, nextFunc)
    expect(req.context.userId).toEqual('TESTUSER')
    expect(nextFunc).toHaveBeenCalledTimes(1)
    expect(res.set).toHaveBeenCalled()
    expect(AppError.badRequest).not.toHaveBeenCalled()
  })

  it('creates context when user id is one of many valid key value pair in header.', () => {
    const nextFunc = mock()
    AppError.badRequest = mock()
    const res = { set: mock() }

    const req = { headers: { oauth_resourceownerinfo: 'notMe=wrongValue,username=testUser,another=value' }, method: 'POST' }
    requestContextMiddlewareFunction(req, res, nextFunc)
    expect(req.context.userId).toEqual('TESTUSER')
    expect(nextFunc).toHaveBeenCalledTimes(1)
    expect(res.set).toHaveBeenCalled()
    expect(AppError.badRequest).not.toHaveBeenCalled()
  })

  it('calls next when all conditions are met', () => {
    const nextFunc = mock()
    AppError.badRequest = mock()
    const res = { set: mock() }

    requestContextMiddlewareFunction({ headers: { oauth_resourceownerinfo: 'username=test' }, method: 'POST' }, res, nextFunc)
    expect(AppError.badRequest).not.toHaveBeenCalled()
    expect(nextFunc).toHaveBeenCalled()
    expect(res.set).toHaveBeenCalled()
  })
})