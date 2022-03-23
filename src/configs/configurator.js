const path = require('path')
const fs = require('fs')
const { merge } = require('lodash')
const { Config, source, processor } = require('@monsantoit/config')

const coreSourcePath = path.resolve(__dirname, './coreSource.js')
const overridesPath = path.resolve(__dirname, './overrides.json')
const sources = [
  source.fromJS({ src: coreSourcePath }),
]

if (process.env.NODE_ENV === 'development' && fs.existsSync('./src/configs/overrides.json')) {
  const coreSources = require(coreSourcePath, 'utf8')
  const overrides = JSON.parse(fs.readFileSync(overridesPath, 'utf8'))
  sources.push(() => merge(coreSources, overrides))
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
