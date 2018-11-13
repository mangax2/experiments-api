const db = require('../../db/DbManager')

class LambdaPerformanceService {
  savePerformanceStats = (bodySize, responseSize, responseTime) =>
    db.lambdaPerformance.addPerformance(bodySize, responseSize, responseTime)
      .catch((err) => { console.error(err) })

  static setUpPrometheus = (prometheusClient, numberOfDays) => {
    const labels = {
      period: '5min',
    }
    const minRequestSizeGauge = prometheusClient.createGauge({
      namespace: 'experiments',
      name: `min_request_size_in_${numberOfDays}_days`,
      help: `The minimum size of the lambda request in the last ${numberOfDays} days.`,
    })
    const maxRequestSizeGauge = prometheusClient.createGauge({
      namespace: 'experiments',
      name: `max_request_size_in_${numberOfDays}_days`,
      help: `The maximum size of the lambda request in the last ${numberOfDays} days.`,
    })
    const avgRequestSizeGauge = prometheusClient.createGauge({
      namespace: 'experiments',
      name: `avg_request_size_in_${numberOfDays}_days`,
      help: `The average size of the lambda request in the last ${numberOfDays} days.`,
    })
    const minResponseSizeGauge = prometheusClient.createGauge({
      namespace: 'experiments',
      name: `min_response_size_in_${numberOfDays}_days`,
      help: `The minimum size of the lambda response in the last ${numberOfDays} days.`,
    })
    const maxResponseSizeGauge = prometheusClient.createGauge({
      namespace: 'experiments',
      name: `max_response_size_in_${numberOfDays}_days`,
      help: `The maximum size of the lambda response in the last ${numberOfDays} days.`,
    })
    const avgResponseSizeGauge = prometheusClient.createGauge({
      namespace: 'experiments',
      name: `avg_response_size_in_${numberOfDays}_days`,
      help: `The average size of the lambda response in the last ${numberOfDays} days.`,
    })
    const minResponseTimeGauge = prometheusClient.createGauge({
      namespace: 'experiments',
      name: `min_response_time_in_${numberOfDays}_days`,
      help: `The minimum time of the lambda response in the last ${numberOfDays} days.`,
    })
    const maxResponseTimeGauge = prometheusClient.createGauge({
      namespace: 'experiments',
      name: `max_response_time_in_${numberOfDays}_days`,
      help: `The maximum time of the lambda response in the last ${numberOfDays} days.`,
    })
    const avgResponseTimeGauge = prometheusClient.createGauge({
      namespace: 'experiments',
      name: `avg_response_time_in_${numberOfDays}_days`,
      help: `The average time of the lambda response in the last ${numberOfDays} days.`,
    })
    const updateFunc = () => db.lambdaPerformance.getXDaysStats(numberOfDays).then((data) => {
      minRequestSizeGauge.set(labels, data.min_request_size)
      maxRequestSizeGauge.set(labels, data.max_request_size)
      avgRequestSizeGauge.set(labels, data.avg_request_size)
      minResponseSizeGauge.set(labels, data.min_response_size)
      maxResponseSizeGauge.set(labels, data.max_response_size)
      avgResponseSizeGauge.set(labels, data.avg_response_size)
      minResponseTimeGauge.set(labels, data.min_response_time)
      maxResponseTimeGauge.set(labels, data.max_response_time)
      avgResponseTimeGauge.set(labels, data.avg_response_time)
    }).catch((err) => { console.error('An error occurred while retrieving lambda stats.', err) })

    LambdaPerformanceService.setInterval(updateFunc)
    return updateFunc()
  }

  /* istanbul ignore next */
  static setInterval(intervalFunc) {
    setInterval(intervalFunc, 300000)
  }
}

module.exports = LambdaPerformanceService
