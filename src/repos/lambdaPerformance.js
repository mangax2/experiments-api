import setErrorDecorator from '../decorators/setErrorDecorator'

const { setErrorCode } = setErrorDecorator()

// Error Codes 5QXXXX
class lambdaPerformanceRepo {
  constructor(rep) {
    this.rep = rep
  }

  @setErrorCode('5Q0000')
  getXDaysStats = (numberOfDays) => {
    const interval = Number(numberOfDays) + ' days'
    return this.rep.oneOrNone('SELECT MIN(body_size) AS min_request_size, MAX(body_size) AS max_request_size, AVG(body_size) AS avg_request_size, ' +
      'MIN(response_size) AS min_response_size, MAX(response_size) AS max_response_size, AVG(response_size) AS avg_response_size, ' +
      'MIN(response_time) AS min_response_time, MAX(response_time) AS max_response_time, AVG(response_time) AS avg_response_time ' +
      'FROM audit.lambda_performance WHERE date_time > CURRENT_TIMESTAMP - INTERVAL $1', [interval])
  }

  @setErrorCode('5Q1000')
  addPerformance = (bodySize, responseSize, responseTime) => 
    this.rep.none('INSERT INTO audit.lambda_performance (body_size, response_size, response_time) VALUES ($1, $2, $3)', [bodySize, responseSize, responseTime])
}

module.exports = rep => new lambdaPerformanceRepo(rep)
