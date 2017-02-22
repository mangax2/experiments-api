//TODO update for experiments local db
const cfServices = {
    experimentsDataSource: {
        alias: 'experimentsDataSource',
        host: 'localhost',
        port: '9000',
        user: process.env.EXPERIMENTS_DB_LOCAL_USER,
        password: process.env.EXPERIMENTS_DB_LOCAL_PASSWORD,
        database: 'draft',
        type: 'conn',
        min: 10,
        max: 10,
        idleTimeoutMillis: 30000
    }
}

module.exports = cfServices
