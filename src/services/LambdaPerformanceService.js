import db from '../db/DbManager'

class LambdaPerformanceService {
  savePerformanceStats = (bodySize, responseSize, responseTime) =>
    db.lambdaPerformance.addPerformance(bodySize, responseSize, responseTime)
      .catch((err) => { console.error(err) })
}

module.exports = LambdaPerformanceService
