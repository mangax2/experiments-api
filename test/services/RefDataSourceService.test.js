import { mockReject, mockResolve } from '../jestUtil'
import RefDataSourceService from '../../src/services/RefDataSourceService'
import { dbRead } from '../../src/db/DbManager'

describe('RefDataSourceService', () => {
  let target

  beforeEach(() => {
    target = new RefDataSourceService()
  })

  describe('getRefDataSources', () => {
    test('returns ref data sources', () => {
      dbRead.refDataSource.all = mockResolve([{}])

      return target.getRefDataSources().then((data) => {
        expect(dbRead.refDataSource.all).toHaveBeenCalled()
        expect(data).toEqual([{}])
      })
    })

    test('rejects when get all fails', () => {
      const error = { message: 'error' }
      dbRead.refDataSource.all = mockReject(error)

      return target.getRefDataSources().then(() => {}, (err) => {
        expect(dbRead.refDataSource.all).toHaveBeenCalled()
        expect(err).toEqual(error)
      })
    })
  })

  describe('getRefDataSourcesByRefDataSourceTypeId', () => {
    test('returns data sources for a type', () => {
      dbRead.refDataSource.findByTypeId = mockResolve([{}])

      return target.getRefDataSourcesByRefDataSourceTypeId(1).then((data) => {
        expect(dbRead.refDataSource.findByTypeId).toHaveBeenCalledWith(1)
        expect(data).toEqual([{}])
      })
    })

    test('rejects when findByTypeId fails', () => {
      const error = { message: 'error' }
      dbRead.refDataSource.findByTypeId = mockReject(error)

      return target.getRefDataSourcesByRefDataSourceTypeId(1).then(() => {}, (err) => {
        expect(dbRead.refDataSource.findByTypeId).toHaveBeenCalledWith(1)
        expect(err).toEqual(error)
      })
    })
  })
})
