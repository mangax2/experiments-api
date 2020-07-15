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
    this.kafkaCA = ''
  }

  static configureDbCredentials(env, vaultRoleId, vaultSecretId, vaultConfig) {
    if (env === 'local') {
      this.clientId = process.env.EXPERIMENTS_API_CLIENT_ID
      this.clientSecret = process.env.EXPERIMENTS_API_CLIENT_SECRET
      const fs = require('bluebird').promisifyAll(require('fs'))
      const privateKeyPromise = fs.readFileAsync('./src/experiments-api-cosmos.pem', 'utf8')
        .then((data) => { this.kafkaPrivateKey = data })
      const clientCertPromise = fs.readFileAsync('./src/experiments-api-cosmos.cert', 'utf8')
        .then((data) => { this.kafkaClientCert = data })
      const kafkaCaPromise = fs.readFileAsync('./src/kafka_ca.cert', 'utf8')
        .then((data) => { this.kafkaCA = data })
      this.kafkaPassword = vaultConfig.kafkaPassword

      return Promise.all([privateKeyPromise, clientCertPromise, kafkaCaPromise])
    }
    const vaultEnv = env
    const body = {}
    body.role_id = vaultRoleId
    body.secret_id = vaultSecretId

    return HttpUtil.post(`${vaultConfig.baseUrl}${vaultConfig.authUri}`, [{
      headerName: 'Accept',
      headerValue: 'application/json',
    }], JSON.stringify(body))
      .then((result) => {
        const vaultToken = result.body.auth.client_token
        const dbPromise = HttpUtil.get(`${vaultConfig.baseUrl}${vaultConfig.secretUri}/experiments/api/${vaultEnv}/db`, VaultUtil.getVaultHeader(vaultToken)).then((vaultObj) => {
          this.dbAppUser = vaultObj.body.data.appUser
          this.dbAppPassword = vaultObj.body.data.appUserPassword
        })
        const clientPromise = HttpUtil.get(`${vaultConfig.baseUrl}${vaultConfig.secretUri}/experiments/api/${vaultEnv}/client`, VaultUtil.getVaultHeader(vaultToken)).then((vaultObj) => {
          this.clientId = vaultObj.body.data.client_id
          this.clientSecret = vaultObj.body.data.client_secret
        })
        const cloudFrontPromise = HttpUtil.get(`${vaultConfig.baseUrl}${vaultConfig.secretUri}/experiments/api/${vaultEnv}/cloudFront`, VaultUtil.getVaultHeader(vaultToken)).then((vaultObj) => {
          this.cloudFrontKeyPair = vaultObj.body.data.keyPair
          this.cloudFrontPrivateKey = vaultObj.body.data.privateKey
          this.cloudFrontUrl = vaultObj.body.data.url
        })
        const kafkaPromise = HttpUtil.get(`${vaultConfig.baseUrl}${vaultConfig.secretUri}/experiments/api/${vaultEnv}/kafka`, VaultUtil.getVaultHeader(vaultToken)).then((vaultObj) => {
          this.kafkaPrivateKey = Buffer.from(vaultObj.body.data.privateKey, 'base64').toString()
          this.kafkaPassword = vaultObj.body.data.password
          this.kafkaClientCert = Buffer.from(vaultObj.body.data.clientCert, 'base64').toString()
          this.kafkaCA = Buffer.from(vaultObj.body.data.ca, 'base64').toString()
        })
        const awsPromise = HttpUtil.get(`${vaultConfig.baseUrl}${vaultConfig.secretUri}/experiments/api/${vaultEnv}/aws`, VaultUtil.getVaultHeader(vaultToken)).then((vaultObj) => {
          this.awsAccessKeyId = vaultObj.body.data.accessKeyId
          this.awsSecretAccessKey = vaultObj.body.data.secretAccessKey
          this.awsLambdaName = vaultObj.body.data.lambdaNameV2
        })
        return Promise.all([dbPromise, clientPromise, cloudFrontPromise, kafkaPromise, awsPromise])
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
