import { mock, mockReject, mockResolve } from '../jestUtil'
import RefDataSourceService from '../../src/services/RefDataSourceService'
import AppError from '../../src/services/utility/AppError'
import db from '../../src/db/DbManager'

describe('RefDataSourceService', () => {
  let target

  beforeEach(() => {
    target = new RefDataSourceService()
  })

  describe('getRefDataSources', () => {
    it('returns ref data sources', () => {
      db.refDataSource.all = mockResolve([{}])

      return target.getRefDataSources().then((data) => {
        expect(db.refDataSource.all).toHaveBeenCalled()
        expect(data).toEqual([{}])
      })
    })

    it('rejects when get all fails', () => {
      db.refDataSource.all = mockReject('error')

      return target.getRefDataSources().then(() => {}, (err) => {
        expect(db.refDataSource.all).toHaveBeenCalled()
        expect(err).toEqual('error')
      })
    })
  })

  describe('getRefDataSourcesByRefDataSourceTypeId', () => {
    it('returns data sources for a type', () => {
      db.refDataSource.findByTypeId = mockResolve([{}])

      return target.getRefDataSourcesByRefDataSourceTypeId(1).then((data) => {
        expect(db.refDataSource.findByTypeId).toHaveBeenCalledWith(1)
        expect(data).toEqual([{}])
      })
    })

    it('rejects when findByTypeId fails', () => {
      db.refDataSource.findByTypeId = mockReject('error')

      return target.getRefDataSourcesByRefDataSourceTypeId(1).then(() => {}, (err) => {
        expect(db.refDataSource.findByTypeId).toHaveBeenCalledWith(1)
        expect(err).toEqual('error')
      })
    })
  })
})