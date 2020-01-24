import LambdaPerformanceService from '../../../src/services/prometheus/LambdaPerformanceService'
import db from '../../../src/db/DbManager'
import { mock, mockResolve, mockReject } from '../../jestUtil'

LambdaPerformanceService.setInterval = () => {}

describe('LambdaPerformanceService', () => {
  describe('savePerformanceStats', () => {
    test('correctly calls the database', () => {
      const target = new LambdaPerformanceService()
      db.lambdaPerformance.addPerformance = mockResolve()

      return target.savePerformanceStats(5, 7, 9).then(() => {
        expect(db.lambdaPerformance.addPerformance).toBeCalledWith(5, 7, 9)
      })
    })

    test('does not throw error if database call throws an error', () => {
      const target = new LambdaPerformanceService()
      db.lambdaPerformance.addPerformance = mockReject()

      return target.savePerformanceStats(5, 7, 9).then(() => {
        expect(db.lambdaPerformance.addPerformance).toBeCalled()
      })
    })
  })

  describe('setUpPrometheus', () => {
    test('creates the correct number of gauges', () => {
      const gaugeMock = { set: mock() }
      const mockClient = {
        createGauge: mock(gaugeMock),
      }
      db.lambdaPerformance.getXDaysStats = mockResolve({})

      return LambdaPerformanceService.setUpPrometheus(mockClient, 5).then(() => {
        expect(db.lambdaPerformance.getXDaysStats).toBeCalledWith(5)
        expect(mockClient.createGauge).toHaveBeenCalledTimes(9)
        expect(gaugeMock.set).toHaveBeenCalledTimes(9)
      })
    })

    test('does not throw error if database call throws an error', () => {
      const gaugeMock = { set: mock() }
      const mockClient = {
        createGauge: mock(gaugeMock),
      }
      db.lambdaPerformance.getXDaysStats = mockReject()

      return LambdaPerformanceService.setUpPrometheus(mockClient, 5).then(() => {
        expect(db.lambdaPerformance.getXDaysStats).toBeCalledWith(5)
        expect(mockClient.createGauge).toHaveBeenCalledTimes(9)
        expect(gaugeMock.set).not.toBeCalled()
      })
    })
  })
})
