const path = require('path')
const { Config, source, processor } = require('@monsantoit/config')

const sources = [
  source.fromJS({ src: path.resolve(__dirname, './coreSource.js') }),
]

if (process.env.ENV === 'local') {
  sources.push(source.fromFile({ src: path.resolve(__dirname, './overrides.json') }))
}

module.exports = new Config({
  sources,
  processors: [
    processor.readVaultFromConfig({
      enabled: true,
      auth: {
        type: 'auto',
        roleId: process.env.APP_VAULT_ROLE_ID,
        secretId: process.env.APP_VAULT_SERET_ID,
      },
    }),
  ],
})
