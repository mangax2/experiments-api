import SetEntryRemovalService from '../../../src/services/prometheus/SetEntryRemovalService'
import { mock } from '../../jestUtil'

SetEntryRemovalService.setInterval = () => {}

describe('SetEntryRemovalService', () => {
  describe('addWarning', () => {
    test('adds 1 to the warning count', () => {
      SetEntryRemovalService.numberOfWarnings = 5

      SetEntryRemovalService.addWarning()

      expect(SetEntryRemovalService.numberOfWarnings).toBe(6)
    })
  })

  describe('setUpPrometheus', () => {
    test('creates the correct number of gauges', () => {
      const gaugeMock = { set: mock() }
      const mockClient = {
        createGauge: mock(gaugeMock),
      }
      SetEntryRemovalService.numberOfWarnings = 3

      SetEntryRemovalService.setUpPrometheus(mockClient)
      expect(mockClient.createGauge).toHaveBeenCalledTimes(1)
      expect(gaugeMock.set).toHaveBeenCalledWith({ period: '10min' }, 3)
    })
  })
})
