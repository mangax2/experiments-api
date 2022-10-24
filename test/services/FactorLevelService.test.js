import { mockResolve, mockReject } from '../jestUtil'
import FactorLevelService from '../../src/services/FactorLevelService'
import { dbRead } from '../../src/db/DbManager'

describe('FactorLevelService', () => {
  describe('getFactorLevelsByExperimentIdNoExistenceCheck', () => {
    test('finds factors by that id', () => {
      dbRead.factorLevel.findByExperimentId = mockResolve([])

      return FactorLevelService.getFactorLevelsByExperimentIdNoExistenceCheck(1).then((data) => {
        expect(dbRead.factorLevel.findByExperimentId).toHaveBeenCalledWith(1)
        expect(data).toEqual([])
      })
    })

    test('rejects when findByExperimentId fails', () => {
      const error = { message: 'error' }
      dbRead.factorLevel.findByExperimentId = mockReject(error)

      return FactorLevelService.getFactorLevelsByExperimentIdNoExistenceCheck(1).then(() => {}, (err) => {
        expect(dbRead.factorLevel.findByExperimentId).toHaveBeenCalledWith(1)
        expect(err).toEqual(error)
      })
    })
  })
})
