const HttpUtil = require('./HttpUtil')

class VaultUtil {
  constructor() {
    this.dbAppUser = ''
    this.dbAppPassword = ''
    this.clientId = ''
    this.clientSecret = ''
    this.kafkaPrivateKey = ''
    this.kafkaPassword = ''
    this.kafkaClientCert = ''
    this.kafkaCA = ''
  }

  static configureDbCredentials(env, vaultRoleId, vaultSecretId, vaultConfig) {
    if (env === 'local') {
      this.clientId = process.env.EXPERIMENTS_API_CLIENT_ID
      this.clientSecret = process.env.EXPERIMENTS_API_CLIENT_SECRET
      this.dbAppUser = process.env.EXPERIMENTS_DB_LOCAL_USER
      this.dbAppPassword = process.env.EXPERIMENTS_DB_LOCAL_PASSWORD
      this.awsAccessKeyId = process.env.AWS_ACCESS_KEY_ID
      this.awsSecretAccessKey = process.env.AWS_SECRET_ACCESS_KEY
      this.kafkaPassword = process.env.KAFKA_PASSWORD
      this.awsLambdaName = 'group-generation-lambda-dev'
      this.awsDocumentationBucketName = 'cosmos-experiments-286985534438'
      const fs = require('bluebird').promisifyAll(require('fs'))
      const privateKeyPromise = fs.readFileAsync('./src/experiments-api-cosmos.pem', 'utf8')
        .then((data) => { this.kafkaPrivateKey = data })
      const clientCertPromise = fs.readFileAsync('./src/experiments-api-cosmos.cert', 'utf8')
        .then((data) => { this.kafkaClientCert = data })
      const kafkaCaPromise = fs.readFileAsync('./src/kafka_ca.cert', 'utf8')
        .then((data) => { this.kafkaCA = data })

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
          this.awsDocumentationBucketName = vaultObj.body.data.documentationBucketName
        })
        return Promise.all([dbPromise, clientPromise, kafkaPromise, awsPromise])
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
