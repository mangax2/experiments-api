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
    this.kafkaPrivateKey = ''
    this.kafkaPassword = ''
    this.kafkaClientCert = ''
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
        const kafkaPromise = HttpUtil.get(`${vaultConfig.baseUrl}${vaultConfig.secretUri}/${vaultEnv}/kafka`, VaultUtil.getVaultHeader(vaultToken)).then((vaultObj) => {
          this.kafkaPrivateKey = new Buffer(vaultObj.body.data.privateKey, 'base64').toString()
          this.kafkaPassword = vaultObj.body.data.password
          this.kafkaClientCert = new Buffer(vaultObj.body.data.clientCert, 'base64').toString()
        })
        return Promise.all([dbPromise, clientPromise, cloudFrontPromise, kafkaPromise])
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
