const cfServices = {
  experimentsDataSource: {
    alias: 'experimentsDataSource',
    host: 'localhost',
    port: '9000',
    user: process.env.EXPERIMENTS_DB_LOCAL_USER,
    password: process.env.EXPERIMENTS_DB_LOCAL_PASSWORD,
    application_name:'experiments-api-local',
    database: 'draft',
    type: 'conn',
    min: 10,
    max: 10,
    idleTimeoutMillis: 30000,
  },
  pingDataSource: {
    url: 'https://test.amp.monsanto.com/as/token.oauth2',
    clientId: process.env.EXPERIMENTS_API_CLIENT_ID,
    clientSecret: process.env.EXPERIMENTS_API_CLIENT_SECRET,
  },
  experimentsExternalAPIUrls: {
    value: {
      capacityRequestAPIUrl: 'https://api01-np.agro.services/capacity-request-api',
      randomizationAPIUrl: 'https://api01-np.agro.services/randomizer/v3',
      profileAPIUrl: 'https://profile.velocity-np.ag/v3',
      experimentsTaggingAPIUrl: 'https://experiments-tagging-api-d.velocity-np.ag/experiments-tagging-api',
      setsAPIUrl: 'https://api01-np.agro.services/sets-api/v2',
    },
  },
  experimentsKafka:{
    value: {
      enableKafka: 'false',
      host: 'kafka.tst.datahub.internal:9093',
      topics: {
        repPackingTopic:'rsr.field-experiments.test.incoming.json',
        repPackingResultTopic: 'rsr.field-experiments.test.outgoing.json',
        product360OutgoingTopic: 'rsr.field-experiments.product360-test.outgoing.avro'
      },
      schema: {
        product360Outgoing: 1726
      }
    }
  }
}

module.exports = cfServices
