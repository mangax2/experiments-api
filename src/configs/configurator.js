const path = require('path')
const fs = require('fs')
const { Config, source, processor } = require('@monsantoit/config')

const sources = [
  source.fromJS({ src: path.resolve(__dirname, './coreSource.js') }),
]

if (process.env.NODE_ENV === 'development' && fs.existsSync('./src/config/overrides.json')) {
  sources.push(source.fromFile({ src: path.resolve(__dirname, './overrides.json') }))
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
