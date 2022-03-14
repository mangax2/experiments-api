const coreSource = {
  client: {
    clientId: 'PD-EXPERIMENTS-API-DEV-SVC',
  },
  aws: {
    lambdaName: 'cosmos-group-generation-lambda-dev',
    documentationBucketName: 'bucketName',
  },
  settings: {
    maxBlocksToRetrieve: 100,
    maxExperimentsToRetrieve: 10,
  },
}

export default coreSource
