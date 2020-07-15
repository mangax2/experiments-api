const localVaultConfig = undefined
const vaultConfig = process.env.VAULT_CONFIG
  ? JSON.parse(process.env.VAULT_CONFIG)
  : localVaultConfig

export default vaultConfig
