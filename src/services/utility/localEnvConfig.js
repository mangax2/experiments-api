//TODO update for experiments local db
import config from '../../../config'

const cfServices = {
    experimentsDataSource: {
        alias: 'experimentsDataSource',
        host: config.env === 'dev' ? "velocity-experiments-db.c6ftfip45sqv.us-east-1.rds.amazonaws.com" : 'localhost',
        port: config.env === "dev" ? "5432" : '9000',
        user: process.env.EXPERIMENTS_DB_LOCAL_USER,
        password: process.env.EXPERIMENTS_DB_LOCAL_PASSWORD,
        database: 'draft',
        type: 'conn',
        min: 10,
        max: 10,
        idleTimeoutMillis: 30000
    },
    pingDataSource: {
        url: 'https://test.amp.monsanto.com/as/token.oauth2',
        clientId: process.env.EXPERIMENTS_API_CLIENT_ID,
        clientSecret: process.env.EXPERIMENTS_API_CLIENT_SECRET,
    }
}

module.exports = cfServices
