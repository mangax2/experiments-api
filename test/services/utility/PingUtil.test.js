import oauthPing from '@monsantoit/oauth-ping'
import { mock } from '../../jestUtil'
import PingUtil from '../../../src/services/utility/PingUtil'

describe('PingUtil', () => {
  beforeEach(() => {
    expect.hasAssertions()
  })

  describe('getMonsantoHeader', () => {
    test('calls oauth and returns headers', () => {
      oauthPing.httpGetToken = mock(() => () => Promise.resolve('token'))

      return PingUtil.getMonsantoHeader().then((data) => {
        expect(oauthPing.httpGetToken).toHaveBeenCalled()
        expect(data).toEqual([{ headerName: 'authorization', headerValue: 'Bearer token' },
          { headerName: 'Content-Type', headerValue: 'application/json' },
        ])
      })
    })

    test('rejects if oauth call fails', () => {
      oauthPing.httpGetToken = mock(() => () => Promise.reject())

      return PingUtil.getMonsantoHeader().then(() => {}, (err) => {
        expect(oauthPing.httpGetToken).toHaveBeenCalled()
        expect(err.data).toEqual('Authentication service returned an error')
        expect(err.message).toEqual('Internal Server Error')
      })
    })
  })
})
