const pgPromise = require('pg-promise')
const fs = require('fs')
const _ = require('lodash')
const HttpUtil = require('./src/services/utility/HttpUtil')

const dbConfig = {
  alias: 'experimentsDataSource',
  application_name: 'experiments-api-migration',
  type: 'conn',
  min: 10,
  max: 10,
  idleTimeoutMillis: 30000,
}

// call vault to get DB creds/info
const body = {}
body.role_id = process.env.vaultRoleId
body.secret_id = process.env.vaultSecretId

return HttpUtil.post('https://vault.agro.services/v1/auth/approle/login', [{
  headerName: 'Accept',
  headerValue: 'application/json',
}], JSON.stringify(body))
  .then((result) => {
    const vaultToken = result.body.auth.client_token
    return HttpUtil.get(`https://vault.agro.services/v1/secret/cosmos/migration/experiments/${process.env.ENV}/db`, [{
      headerName: 'X-Vault-Token',
      headerValue: vaultToken,
    }])
      .then((vaultObj) => {
        dbConfig.host = vaultObj.body.data.host
        dbConfig.port = vaultObj.body.data.port
        dbConfig.user = vaultObj.body.data.user
        dbConfig.password = vaultObj.body.data.password
        dbConfig.database = vaultObj.body.data.database

        // get a list of sql files
        const files = fs.readdirSync('./migration-scripts')

        // create db object
        const pgp = pgPromise()
        const db = pgp(dbConfig)

        // create the table if it doesn't exist
        return db.query('CREATE TABLE IF NOT EXISTS applied_migrations (name VARCHAR CONSTRAINT applied_migrations_pk PRIMARY KEY)').then(() =>
          db.tx('migrations', tx =>
            // get list of applied files from table
            tx.any('SELECT name FROM applied_migrations').then((appliedFiles) => {
              // get a list of files to apply
              const appliedFileNames = _.map(appliedFiles, 'name')
              const filesToApply = _.difference(files, appliedFileNames)

              // apply said files
              const queriesToRun = []
              _.forEach(filesToApply, (fileName) => {
                queriesToRun.push(tx.none('INSERT INTO applied_migrations (name) VALUES ($1)', fileName).then())
                const sqlContents = fs.readFileSync(`./migration-scripts/${fileName}`, { encoding: 'utf8' })
                queriesToRun.push(tx.query(sqlContents).then())
              })
              return tx.batch(queriesToRun)
            }))).then(() => { process.exit(0) })
      })
  })
  .catch((error) => {
    console.error(error)
    process.exit(-1)
  })
