const path = require('path')
const { Config, source, processor } = require('@monsantoit/config')

const sources = [
  source.fromJS({ src: path.resolve(__dirname, './coreSource.js') }),
]

if (process.env.ENV === 'local') {
  sources.push(source.fromFile({ src: path.resolve(__dirname, './overrides.json') }))
}

console.info(process.env.vaultRoleId, process.env.vaultSecretId)

module.exports = new Config({
  sources,
  processors: [
    processor.readVaultFromConfig({
      enabled: true,
      auth: {
        type: 'appRole',
        roleId: process.env.vaultRoleId,
        secretId: process.env.vaultSecretId,
      },
    }),
  ],
})
