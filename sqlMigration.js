const fs = require('fs')
const pgPromise = require('pg-promise')
const _ = require('lodash')
const configurator = require('./src/configs/configurator')

const runMigrations = async () => {
  if (!configurator.initalized) {
    await configurator.init()
  }

  const pgp = pgPromise()
  const db = pgp({
    alias: 'experimentsDataSource',
    application_name: 'experiments-api-migration',
    type: 'conn',
    min: 10,
    max: 10,
    idleTimeoutMillis: 30000,
    ssl: {
      ca: fs.readFileSync('./sqlMigration.cert', 'utf8'),
    },
    ...configurator.get('migrations'),
  })
  configurator.set('migrations', null)

  const files = fs.readdirSync('./migration-scripts')
  db.tx('migrations', tx =>
    tx.any('SELECT name FROM applied_migrations').then((appliedFiles) => {
      const appliedFileNames = _.map(appliedFiles, 'name')
      const filesToApply = _.difference(files, appliedFileNames)
      const queriesToRun = []

      _.forEach(filesToApply, (fileName) => {
        queriesToRun.push(tx.none('INSERT INTO applied_migrations (name) VALUES ($1)', fileName).then())
        const sqlContents = fs.readFileSync(`./migration-scripts/${fileName}`, { encoding: 'utf8' })
        queriesToRun.push(tx.query(sqlContents).then())
      })

      return tx.batch(queriesToRun)
    }),
  )
}

if (['np', 'prod'].includes(process.env.VAULT_ENV)) {
  runMigrations()
} else {
  console.info('Environment is not np or prod; Not running SQL Migrations')
}
