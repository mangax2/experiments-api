const formatVaultPath = relativePath => `vault://secret/cosmos/${process.env.VAULT_ENV}/experiments-api/${relativePath}`

const paths = {
  client: {
    clientId: formatVaultPath('client/client_id'),
    clientSecret: formatVaultPath('client/client_secret'),
  },
  aws: {
    accessKeyId: formatVaultPath('aws/accessKeyId'),
    documentationBucketName: formatVaultPath('aws/documentationBucketName'),
    lambdaName: formatVaultPath('aws/lambdaName'),
    secretAccessKey: formatVaultPath('aws/secretAccessKey'),
  },
  database: {
    user: formatVaultPath('db-write/appUser'),
    password: formatVaultPath('db-write/appUserPassword'),
    database: formatVaultPath('db-write/databaseName'),
    host: formatVaultPath('db-write/host'),
    port: formatVaultPath('db-write/port'),
    min: formatVaultPath('db-write/min'),
    max: formatVaultPath('db-write/max'),
    idleTimeoutMillis: formatVaultPath('db-write/idleTimeout'),
    ca: formatVaultPath('db-write/ca'),
  },
  databaseRo: {
    user: formatVaultPath('db-ro/appUser'),
    password: formatVaultPath('db-ro/appUserPassword'),
    database: formatVaultPath('db-ro/databaseName'),
    host: formatVaultPath('db-ro/host'),
    port: formatVaultPath('db-ro/port'),
    min: formatVaultPath('db-ro/min'),
    max: formatVaultPath('db-ro/max'),
    idleTimeoutMillis: formatVaultPath('db-ro/idleTimeout'),
    ca: formatVaultPath('db-ro/ca'),
  },
  kafka: {
    enableKafka: formatVaultPath('kafka/enableKafka'),
    host: formatVaultPath('kafka/host'),
    ssl: {
      ca: formatVaultPath('kafka/ca'),
      cert: formatVaultPath('kafka/clientCert'),
      key: formatVaultPath('kafka/privateKey'),
      passphrase: formatVaultPath('kafka/password'),
    },
    topics: {
      repPackingTopic: formatVaultPath('kafka-topics/repPackingTopic'),
      repPackingResultTopic: formatVaultPath('kafka-topics/repPackingResultTopic'),
      product360OutgoingTopic: formatVaultPath('kafka-topics/product360OutgoingTopic'),
      setsChangesTopic: formatVaultPath('kafka-topics/setsChangesTopic'),
      setEntriesChangesTopic: formatVaultPath('kafka-topics/setEntriesChangesTopic'),
      unitDeactivation: formatVaultPath('kafka-topics/unitDeactivation'),
    },
    schema: {
      product360Outgoing: formatVaultPath('kafka-schema/product360Outgoing'),
      unitDeactivation: formatVaultPath('kafka-schema/unitDeactivation'),
    },
  },
  urls: {
    capacityRequestAPIUrl: formatVaultPath('urls/capacityRequestAPIUrl'),
    chemApAPIUrl: formatVaultPath('urls/chemApAPIUrl'),
    experimentsTaggingAPIUrl: formatVaultPath('urls/experimentsTaggingAPIUrl'),
    materialListsAPIUrl: formatVaultPath('urls/materialListsAPIUrl'),
    oauthUrl: formatVaultPath('urls/oauthUrl'),
    preferencesAPIUrl: formatVaultPath('urls/preferencesAPIUrl'),
    profileAPIUrl: formatVaultPath('urls/profileAPIUrl'),
    questionsV3APIUrl: formatVaultPath('urls/questionsV3APIUrl'),
    randomizeTreatmentsAPIUrl: formatVaultPath('urls/randomizeTreatmentsAPIUrl'),
    setsAPIUrl: formatVaultPath('urls/setsAPIUrl'),
    velocityMessagingAPIUrl: formatVaultPath('urls/velocityMessagingAPIUrl'),
    velocityUrl: formatVaultPath('urls/velocityUrl'),
  },
  settings: {
    maxBlocksToRetrieve: formatVaultPath('settings/maxBlocksToRetrieve'),
    maxExperimentsToRetrieve: formatVaultPath('settings/maxExperimentsToRetrieve'),
  },
}

if (['np', 'prod'].includes(process.env.VAULT_ENV)) {
  paths.migrations = {
    database: formatVaultPath('migrations/database'),
    host: formatVaultPath('migrations/host'),
    password: formatVaultPath('migrations/password'),
    port: formatVaultPath('migrations/port'),
    user: formatVaultPath('migrations/user'),
  }
}

module.exports = paths
