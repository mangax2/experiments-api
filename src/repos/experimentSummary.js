import setErrorDecorator from '../decorators/setErrorDecorator'

const { setErrorCode } = setErrorDecorator()

// Error Codes 56XXXX
class experimentSummaryRepo {
  constructor(rep) {
    this.rep = rep
  }

  @setErrorCode('560000')
  repository = () => this.rep

  @setErrorCode('561000')
  find = (id, tx = this.rep) => tx.oneOrNone('SELECT * FROM experiment_summary WHERE id = $1', id)

  @setErrorCode('562000')
  all = () => this.rep.any('SELECT * FROM experiment_summary')
}

module.exports = rep => new experimentSummaryRepo(rep)
