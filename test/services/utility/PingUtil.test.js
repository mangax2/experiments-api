import { mockReject, mockResolve } from '../../jestUtil'
import oauthPing from '@monsantoit/oauth-ping'
import PingUtil from '../../../src/services/utility/PingUtil'

describe('PingUtil', () => {
  describe('getMonsantoHeader', () => {
    it('calls oauth and returns headers', () => {
      oauthPing.httpGetToken = mockResolve('token')

      return PingUtil.getMonsantoHeader().then((data) => {
        expect(oauthPing.httpGetToken).toHaveBeenCalled()
        expect(data).toEqual(
          [{headerName: 'authorization', headerValue: 'Bearer token'},
            {headerName: 'Content-Type', headerValue: 'application/json'}
          ]
        )
      })
    })

    it('rejects if oauth call fails', () => {
      oauthPing.httpGetToken = mockReject('error')

      return PingUtil.getMonsantoHeader().then(() => {}, (err) => {
        expect(oauthPing.httpGetToken).toHaveBeenCalled()
        expect(err).toEqual('error')
      })
    })
  })
})