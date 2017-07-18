const HttpUtil = require('./HttpUtil')

class VaultUtil {
  constructor() {
    this.dbAppUser = ''
    this.dbAppPassword = ''
    this.clientId = ''
    this.clientSecret = ''
    this.cloudFrontKeyPair = ''
    this.cloudFrontPrivateKey = ''
    this.cloudFrontUrl = ''
  }

  static configureDbCredentials(env, vaultConfig) {
    if (env === 'local') {
      return Promise.resolve()
    }
    const vaultEnv = env
    const body = {}
    body.role_id = vaultConfig.roleId
    body.secret_id = vaultConfig.secretId

    return HttpUtil.post(`${vaultConfig.baseUrl}${vaultConfig.authUri}`, [{
      headerName: 'Accept',
      headerValue: 'application/json',
    }], JSON.stringify(body))
      .then((result) => {
        const vaultToken = result.body.auth.client_token
        const dbPromise = HttpUtil.get(`${vaultConfig.baseUrl}${vaultConfig.secretUri}/${vaultEnv}/db`, VaultUtil.getVaultHeader(vaultToken)).then((vaultObj) => {
          this.dbAppUser = vaultObj.body.data.appUser
          this.dbAppPassword = vaultObj.body.data.appUserPassword
        })
        const clientPromise = HttpUtil.get(`${vaultConfig.baseUrl}${vaultConfig.secretUri}/${vaultEnv}/client`, VaultUtil.getVaultHeader(vaultToken)).then((vaultObj) => {
          this.clientId = vaultObj.body.data.client_id
          this.clientSecret = vaultObj.body.data.client_secret
        })
        const cloudFrontPromise = HttpUtil.get(`${vaultConfig.baseUrl}${vaultConfig.secretUri}/${vaultEnv}/cloudFront`, VaultUtil.getVaultHeader(vaultToken)).then((vaultObj) => {
          this.cloudFrontKeyPair = vaultObj.body.data.keyPair
          this.cloudFrontPrivateKey = vaultObj.body.data.privateKey
          this.cloudFrontUrl = vaultObj.body.data.url
        })
        return Promise.all([dbPromise, clientPromise, cloudFrontPromise])
      }).catch((err) => {
        console.error(err)
        return Promise.reject(err)
      })
  }

  static getVaultHeader(vaultToken) {
    return [{
      headerName: 'X-Vault-Token',
      headerValue: vaultToken,
    }]
  }
}

module.exports = VaultUtil
