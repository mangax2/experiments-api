import bluebird from 'bluebird'
import { mock, mockReject, mockResolve } from '../../jestUtil'
import VaultUtil from '../../../src/services/utility/VaultUtil'
import HttpUtil from '../../../src/services/utility/HttpUtil'

describe('VaultUtil', () => {
  beforeEach(() => {
    expect.hasAssertions()
  })

  beforeAll(() => {
    console.error = mock()
  })

  afterAll(() => {
    console.error.restore()
  })

  describe('constructor', () => {
    const target = new VaultUtil()

    expect(target.dbAppUser).toEqual('')
    expect(target.dbAppPassword).toEqual('')
  })

  describe('configureDbCredentials', () => {
    test('returns a resolved promise when env is local', () => {
      bluebird.promisifyAll = () => ({ readFileAsync: mockResolve() })
      return VaultUtil.configureDbCredentials('local', {}).then((value) => {
        expect(value).toEqual([undefined, undefined, undefined])
      })
    })

    test('calls HttpUtil and sets dbAppUser and dbAppPassword', () => {
      HttpUtil.post = mockResolve({ body: { auth: { client_token: 'testToken' } } })
      HttpUtil.get = mockResolve({
        body: {
          data: {
            appUser: 'testUser', appUserPassword: 'testPassword', privateKey: '', clientCert: '', ca: '',
          },
        },
      })

      return VaultUtil.configureDbCredentials('np', { roleId: 'id', secretId: 'id' }).then(() => {
        expect(VaultUtil.dbAppPassword).toEqual('testPassword')
        expect(VaultUtil.dbAppUser).toEqual('testUser')
      })
    })

    test('rejects when the post to HttpUtil fails', () => {
      HttpUtil.post = mockReject('error')
      HttpUtil.get = mock()

      return VaultUtil.configureDbCredentials('np', {}).then(() => {}, () => {
        expect(HttpUtil.get).not.toHaveBeenCalled()
      })
    })

    test('rejects when the get to HttpUtil fails', () => {
      HttpUtil.post = mockResolve({ body: { auth: { client_token: 'testToken' } } })
      HttpUtil.get = mock()

      return VaultUtil.configureDbCredentials('prod', { baseUrl: 'localhost/', secretUri: 'vault' }).then(() => {}, () => {
        expect(HttpUtil.get).toHaveBeenCalledWith(
          'localhost/vault/prod/db',
          [{ headerName: 'X-Vault-Token', headerValue: 'testToken' }],
        )
      })
    })
  })
})
