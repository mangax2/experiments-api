import { mock } from '../jestUtil'
import AppError from '../../src/services/utility/AppError'
import requestContextMiddlewareFunction from '../../src/middleware/requestContext'

describe('requestContextMiddlewareFunction', () => {
  it('calls next if a url is in the whitelisted urls', () => {
    const nextFunc = mock()
    const req = { url: '/experiments-api/api-docs' }

    requestContextMiddlewareFunction(req, null, nextFunc)
    expect(nextFunc).toHaveBeenCalled()
  })

  it('throws an error when headers are null', () => {
    const nextFunc = mock()
    AppError.badRequest = mock({})

    expect(() => { requestContextMiddlewareFunction({}, null, nextFunc) }).toThrow()
    expect(AppError.badRequest).toHaveBeenCalledWith('oauth_resourceownerinfo headers is null.')
    expect(nextFunc).not.toHaveBeenCalled()
  })

  it('throws an error when oauth_resourceownerinfo header not found', () => {
    const nextFunc = mock()
    AppError.badRequest = mock({})

    expect(() => {requestContextMiddlewareFunction({ headers: {} }, null, nextFunc)}).toThrow()
    expect(AppError.badRequest).toHaveBeenCalledWith('oauth_resourceownerinfo header not found.')
    expect(nextFunc).not.toHaveBeenCalled()
  })

  it('throws an error when header not found among multiple headers', () => {
    const nextFunc = mock()
    AppError.badRequest = mock({})

    expect(() => {
      requestContextMiddlewareFunction({
        headers: {
          header1: 'blah',
          'header2': 'blah2',
        },
      }, null, nextFunc)
    }).toThrow()
    expect(AppError.badRequest).toHaveBeenCalledWith('oauth_resourceownerinfo header not found.')
    expect(nextFunc).not.toHaveBeenCalled()
  })

  it('throws an error when user_id is missing from header value', () => {
    const nextFunc = mock()
    AppError.badRequest = mock({})

    expect(() => { requestContextMiddlewareFunction({ headers: { oauth_resourceownerinfo: 'notUserId=blah' } }, null, nextFunc)}).toThrow()
    expect(AppError.badRequest).toHaveBeenCalledWith('user_id not found within oauth_resourceownerinfo.')
    expect(nextFunc).not.toHaveBeenCalled()
  })

  it('throws an error when user_id does not represent a key value pair', () => {
    const nextFunc = mock()
    AppError.badRequest = mock({})

    expect(() => { requestContextMiddlewareFunction({ headers: { oauth_resourceownerinfo: 'user_id' } }, null, nextFunc)}).toThrow()
    expect(AppError.badRequest).toHaveBeenCalledWith('user_id within oauth_resourceownerinfo does not represent key=value pair.')
    expect(nextFunc).not.toHaveBeenCalled()
  })

  it('throws an error when user_id value is empty', () => {
    const nextFunc = mock()
    AppError.badRequest = mock({})

    expect(() => { requestContextMiddlewareFunction({ headers: { oauth_resourceownerinfo: 'user_id=' } }, null, nextFunc)}).toThrow()
    expect(AppError.badRequest).toHaveBeenCalledWith('user_id within oauth_resourceownerinfo is empty string.')
    expect(nextFunc).not.toHaveBeenCalled()
  })

  it('throws an error when user_id value is a space', () => {
    const nextFunc = mock()
    AppError.badRequest = mock({})

    expect(() => { requestContextMiddlewareFunction({ headers: { oauth_resourceownerinfo: 'user_id= ' } }, null, nextFunc)}).toThrow()
    expect(AppError.badRequest).toHaveBeenCalledWith('user_id within oauth_resourceownerinfo is empty string.')
    expect(nextFunc).not.toHaveBeenCalled()
  })

  it('creates context when user id is only valid key value pair in header.', () => {
    const nextFunc = mock()
    AppError.badRequest = mock()

    const req = { headers: { oauth_resourceownerinfo: 'user_id=testUser' } }
    requestContextMiddlewareFunction(req, null, nextFunc)
    expect(req.context.userId).toEqual('testUser')
    expect(nextFunc).toHaveBeenCalledTimes(1)
    expect(AppError.badRequest).not.toHaveBeenCalled()
  })

  it('creates context when user id is one of many valid key value pair in header.', () => {
    const nextFunc = mock()
    AppError.badRequest = mock()

    const req = { headers: { oauth_resourceownerinfo: 'notMe=wrongValue,user_id=testUser,another=value' } }
    requestContextMiddlewareFunction(req, null, nextFunc)
    expect(req.context.userId).toEqual('testUser')
    expect(nextFunc).toHaveBeenCalledTimes(1)
    expect(AppError.badRequest).not.toHaveBeenCalled()
  })

  it('calls next when all conditions are met', () => {
    const nextFunc = mock()
    AppError.badRequest = mock()

    requestContextMiddlewareFunction({ headers: { oauth_resourceownerinfo: 'user_id=test' } }, null, nextFunc)
    expect(AppError.badRequest).not.toHaveBeenCalled()
    expect(nextFunc).toHaveBeenCalled()
  })
})