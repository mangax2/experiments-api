const localSettings = {
  maxExperimentsToRetrieve: 10,
  maxBlocksToRetrieve: 100,
}
const settings = process.env.EXPERIMENTS_API_SETTINGS
  ? JSON.parse(process.env.EXPERIMENTS_API_SETTINGS)
  : localSettings

export default settings
