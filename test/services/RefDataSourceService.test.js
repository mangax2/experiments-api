import { mock, mockReject, mockResolve } from '../jestUtil'
import RefDataSourceService from '../../src/services/RefDataSourceService'
import AppError from '../../src/services/utility/AppError'
import db from '../../src/db/DbManager'

describe('RefDataSourceService', () => {
  describe('getRefDataSources', () => {
    it('returns ref data sources', () => {
      const target = new RefDataSourceService()
      db.refDataSource.all = mockResolve([{}])

      return target.getRefDataSources().then((data) => {
        expect(db.refDataSource.all).toHaveBeenCalled()
        expect(data).toEqual([{}])
      })
    })

    it('rejects when get all fails', () => {
      const target = new RefDataSourceService()
      db.refDataSource.all = mockReject('error')

      return target.getRefDataSources().then(() => {}, (err) => {
        expect(db.refDataSource.all).toHaveBeenCalled()
        expect(err).toEqual('error')
      })
    })
  })

  describe('getRefDataSourceById', () => {
    it('returns a ref data source', () => {
      const target = new RefDataSourceService()
      db.refDataSource.find = mockResolve({})

      return target.getRefDataSourceById(1).then((data) => {
        expect(db.refDataSource.find).toHaveBeenCalledWith(1)
        expect(data).toEqual({})
      })
    })

    it('throws an error when find returns empty', () => {
      const target = new RefDataSourceService()
      db.refDataSource.find = mockResolve()
      AppError.notFound = mock()

      return target.getRefDataSourceById(1).then(() => {}, () => {
        expect(db.refDataSource.find).toHaveBeenCalledWith(1)
        expect(AppError.notFound).toHaveBeenCalledWith('Ref Data Source Not Found for requested id')
      })
    })

    it('rejects when find fails', () => {
      const target = new RefDataSourceService()
      db.refDataSource.find = mockReject('error')

      return target.getRefDataSourceById(1).then(() => {}, (err) => {
        expect(db.refDataSource.find).toHaveBeenCalledWith(1)
        expect(err).toEqual('error')
      })
    })
  })

  describe('getRefDataSourcesByRefDataSourceTypeId', () => {
    it('returns data sources for a type', () => {
      const target = new RefDataSourceService()
      db.refDataSource.findByTypeId = mockResolve([{}])

      return target.getRefDataSourcesByRefDataSourceTypeId(1).then((data) => {
        expect(db.refDataSource.findByTypeId).toHaveBeenCalledWith(1)
        expect(data).toEqual([{}])
      })
    })

    it('rejects when findByTypeId fails', () => {
      const target = new RefDataSourceService()
      db.refDataSource.findByTypeId = mockReject('error')

      return target.getRefDataSourcesByRefDataSourceTypeId(1).then(() => {}, (err) => {
        expect(db.refDataSource.findByTypeId).toHaveBeenCalledWith(1)
        expect(err).toEqual('error')
      })
    })
  })

  describe('getCompleteRefDataSourceById', () => {
    it('gets ref data source, type, and combines them', () => {
      const target = new RefDataSourceService()
      db.refDataSource.find = mockResolve({ ref_data_source_type_id: 2 })
      db.refDataSourceType.find = mockResolve({ id: 2 })

      return target.getCompleteRefDataSourceById(1).then((data) => {
        expect(db.refDataSource.find).toHaveBeenCalledWith(1)
        expect(db.refDataSourceType.find).toHaveBeenCalledWith(2)
        expect(data).toEqual({ ref_data_source_type_id: 2, ref_data_source_type: { id: 2 } })
      })
    })

    it('throws an error when ref data source is empty', () => {
      const target = new RefDataSourceService()
      db.refDataSource.find = mockResolve()
      AppError.notFound = mock()

      return target.getCompleteRefDataSourceById(1).then(() => {}, () => {
        expect(db.refDataSource.find).toHaveBeenCalledWith(1)
        expect(AppError.notFound).toHaveBeenCalledWith('Ref Data Source Not Found for requested id')
      })
    })

    it('rejects when it fails to find data source type', () => {
      const target = new RefDataSourceService()
      db.refDataSource.find = mockResolve({ ref_data_source_type_id: 2 })
      db.refDataSourceType.find = mockReject('error')

      return target.getCompleteRefDataSourceById(1).then(() => {}, (err) => {
        expect(db.refDataSource.find).toHaveBeenCalledWith(1)
        expect(db.refDataSourceType.find).toHaveBeenCalledWith(2)
        expect(err).toEqual('error')
      })
    })

    it('rejects when find data source fails', () => {
      const target = new RefDataSourceService()
      db.refDataSource.find = mockReject('error')
      db.refDataSourceType.find = mock()

      return target.getCompleteRefDataSourceById(1).then(() => {}, (err) => {
        expect(db.refDataSource.find).toHaveBeenCalledWith(1)
        expect(db.refDataSourceType.find).not.toHaveBeenCalled()
        expect(err).toEqual('error')
      })
    })
  })
})