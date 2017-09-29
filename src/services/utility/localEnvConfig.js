//TODO update for experiments local db
const config = require('../../../config')

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
      randomizationAPIUrl: 'https://api01-np.agro.services/randomizer-v3/v3',
      profileAPIUrl: 'https://profile.velocity-np.ag/v2',
      experimentsTaggingAPIUrl: 'https://experiments-tagging-api-d.velocity-np.ag/experiments-tagging-api'
    },
  },
  kafkaTopics:{
    repPackingTopic:'rsr.field-experiments.test.incoming.json'
  }
}

module.exports = cfServices
