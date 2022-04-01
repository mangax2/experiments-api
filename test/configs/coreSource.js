const coreSource = {
  client: {
    clientId: 'PD-EXPERIMENTS-API-DEV-SVC',
    adminGroup: 'COSMOS-ADMIN',
  },
  aws: {
    lambdaName: 'cosmos-group-generation-lambda-dev',
    documentationBucketName: 'bucketName',
  },
  settings: {
    maxBlocksToRetrieve: 100,
    maxExperimentsToRetrieve: 10,
  },
  SQS: {
    unitUrl: 'test-unit-queue',
  },
}

export default coreSource
