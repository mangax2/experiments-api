class SetEntryRemovalService {
  numberOfWarnings = 0

  addWarning = () => {
    this.numberOfWarnings += 1
  }

  setUpPrometheus = (prometheusClient) => {
    const labels = { period: '10min' }
    const setEntryWarningsGauge = prometheusClient.createGauge({
      namespace: 'experiments',
      name: 'number_of_set_entry_warnings',
      help: 'The number of times set entries have been cleared or not provided when they should have',
    })
    const updateFunc = () => {
      const numberToReport = this.numberOfWarnings
      this.numberOfWarnings = 0
      setEntryWarningsGauge.set(labels, numberToReport)
    }

    this.setInterval(updateFunc)
    return updateFunc()
  }

  setInterval = /* istanbul ignore next */ (intervalFunc) => {
    /* istanbul ignore next */
    setInterval(intervalFunc, 600000)
  }
}

module.exports = new SetEntryRemovalService()
