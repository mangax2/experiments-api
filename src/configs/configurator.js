const path = require('path')
const fs = require('fs')
const { Config, source, processor } = require('@monsantoit/config')
const coreSource = require('./coreSource')

const sources = [
  source.fromJS({ src: path.resolve(__dirname, './coreSource.js') }),
]

if (process.env.NODE_ENV === 'development') {
  sources.push(() => ({
    database: {
      ...coreSource.database,
      host: 'localhost',
      port: '9000',
    },
    databaseRo: {
      ...coreSource.databaseRo,
      host: 'localhost',
      port: '9001',
    },
    kafka: {
      ...coreSource.kafka,
      enableKafka: false,
    },
  }))

  if (fs.existsSync('./src/config/overrides.json')) {
    sources.push(source.fromFile({ src: path.resolve(__dirname, './overrides.json') }))
  }
}

module.exports = new Config({
  sources,
  processors: [
    processor.readVaultFromConfig({
      enabled: true,
      auth: {
        type: 'auto',
        roleName: `cosmos-admin-experiments-api-${process.env.VAULT_ENV}`,
      },
    }),
  ],
})
