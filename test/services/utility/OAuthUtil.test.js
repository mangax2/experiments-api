import agent from 'superagent'
import { mock } from '../../jestUtil'
import OAuthUtil from '../../../src/services/utility/OAuthUtil'

describe('OAuthUtil', () => {
  describe('getAuthorizationHeaders', () => {
    test('calls oauth and returns headers', () => {
      const agentPost = {
        set: () => agentPost,
        send: () => Promise.resolve({ body: { access_token: 'token' } }),
      }
      agent.post = mock(() => agentPost)

      return OAuthUtil.getAuthorizationHeaders().then((data) => {
        expect(agent.post).toHaveBeenCalled()
        expect(data).toEqual([{ headerName: 'authorization', headerValue: 'Bearer token' },
          { headerName: 'Content-Type', headerValue: 'application/json' },
        ])
      })
    })

    test('rejects if oauth call fails', (done) => {
      const agentPost = {
        set: () => agentPost,
        send: () => Promise.reject(new Error()),
      }
      agent.post = mock(() => agentPost)

      OAuthUtil.getAuthorizationHeaders().catch((err) => {
        expect(agent.post).toHaveBeenCalled()
        expect(err.data).toEqual('Authentication service returned an error')
        expect(err.message).toEqual('Internal Server Error')
        done()
      })
    })
  })
})
