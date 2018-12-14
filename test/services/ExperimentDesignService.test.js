import { mock, mockReject, mockResolve } from '../jestUtil'
import ExperimentDesignService from '../../src/services/ExperimentDesignService'
import db from '../../src/db/DbManager'

describe('ExperimentDesignService', () => {
  let target
  const testContext = {}
  const testTx = { tx: {} }
  db.experimentDesign.repository = mock({ tx(transactionName, callback) { return callback(testTx) } })

  beforeEach(() => {
    expect.hasAssertions()
    target = new ExperimentDesignService()
  })

  describe('createExperimentDesign', () => {
    test('calls validate and create', () => {
      target.validator.validate = mockResolve()
      db.experimentDesign.create = mockResolve(1)

      return target.createExperimentDesign({}, testContext).then((data) => {
        expect(target.validator.validate).toHaveBeenCalledWith([{}])
        expect(db.experimentDesign.create).toHaveBeenCalledWith(testTx, {}, testContext)
        expect(data).toEqual(1)
      })
    })

    test('rejects when validate fails', () => {
      const error = { message: 'error' }
      target.validator.validate = mockReject(error)
      db.experimentDesign.create = mock()

      return target.createExperimentDesign({}, testContext).then(() => {}, (err) => {
        expect(target.validator.validate).toHaveBeenCalledWith([{}])
        expect(db.experimentDesign.create).not.toHaveBeenCalled()
        expect(err).toEqual(error)
      })
    })
  })
})
