import { mock, mockReject, mockResolve } from '../../jestUtil'
import VaultUtil from '../../../src/services/utility/VaultUtil'
import HttpUtil from '../../../src/services/utility/HttpUtil'

describe('VaultUtil', () => {
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
    it('returns a resolved promise when env is local', () => {
      return VaultUtil.configureDbCredentials('local', {}).then((value) => {
        expect(value).toBe(undefined)
      })
    })

    it('calls HttpUtil and sets dbAppUser and dbAppPassword', () => {
      HttpUtil.post = mockResolve({body: {auth: {client_token: 'testToken'}}})
      HttpUtil.get = mockResolve({body: {data: {appUser: 'testUser', appUserPassword: 'testPassword'}}})

      return VaultUtil.configureDbCredentials('np', {roleId: 'id', secretId: 'id'}).then(() => {
        expect(VaultUtil.dbAppPassword).toEqual('testPassword')
        expect(VaultUtil.dbAppUser).toEqual('testUser')
      })
    })

    it('rejects when the post to HttpUtil fails', () => {
      HttpUtil.post = mockReject('error')
      HttpUtil.get = mock()

      return VaultUtil.configureDbCredentials('np', {}).then(() => {}, () => {
        expect(HttpUtil.get).not.toHaveBeenCalled()
      })
    })

    it('rejects when the get to HttpUtil fails', () => {
      HttpUtil.post = mockResolve({body: {auth: {client_token: 'testToken'}}})
      HttpUtil.get = mock()

      return VaultUtil.configureDbCredentials('prod', {baseUrl: 'localhost/', secretUri: 'vault'}).then(() => {}, () => {
        expect(HttpUtil.get).toHaveBeenCalledWith(
          'localhost/vault/prod/db',
          [{headerName: 'X-Vault-Token', headerValue: 'testToken'}]
        )
      })
    })
  })
})