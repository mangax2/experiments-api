import { mock, mockReject, mockResolve } from '../jestUtil'
import RefDataSourceTypeService from '../../src/services/RefDataSourceTypeService'
import AppError from '../../src/services/utility/AppError'
import db from '../../src/db/DbManager'

describe('RefDataSourceTypeService', () => {
  describe('getRefDataSourceTypes', () => {
    it('gets ref data source types', () => {
      const target = new RefDataSourceTypeService()
      db.refDataSourceType.all = mockResolve([{}])

      return target.getRefDataSourceTypes().then((data) => {
        expect(db.refDataSourceType.all).toHaveBeenCalled()
        expect(data).toEqual([{}])
      })
    })

    it('rejects when get all fails', () => {
      const target = new RefDataSourceTypeService()
      db.refDataSourceType.all = mockReject('error')

      return target.getRefDataSourceTypes().then(() => {}, (err) => {
        expect(db.refDataSourceType.all).toHaveBeenCalled()
        expect(err).toEqual('error')
      })
    })
  })

  describe('getRefDataSourceTypeById', () => {
    it('returns ref data source type', () => {
      const target = new RefDataSourceTypeService()
      db.refDataSourceType.find = mockResolve({})

      return target.getRefDataSourceTypeById(1).then((data) => {
        expect(db.refDataSourceType.find).toHaveBeenCalledWith(1)
        expect(data).toEqual({})
      })
    })

    it('throws an error when get returns empty', () => {
      const target = new RefDataSourceTypeService()
      db.refDataSourceType.find = mockResolve()
      AppError.notFound = mock()

      return target.getRefDataSourceTypeById(1).then(() => {}, () => {
        expect(db.refDataSourceType.find).toHaveBeenCalledWith(1)
        expect(AppError.notFound).toHaveBeenCalledWith('Ref Data Source Type Not Found for' +
          ' requested id')
      })
    })

    it('rejects when find fails', () => {
      const target = new RefDataSourceTypeService()
      db.refDataSourceType.find = mockReject('error')

      return target.getRefDataSourceTypeById(1).then(() => {}, (err) => {
        expect(db.refDataSourceType.find).toHaveBeenCalledWith(1)
        expect(err).toEqual('error')
      })
    })
  })

  describe('getRefDataSourceTypesWithDataSources', () => {
    it('returns data source types with respective data sources', () => {
      const dataSources = [{ ref_data_source_type_id: 1 }, { ref_data_source_type_id: 1 }, { ref_data_source_type_id: 2 }]
      const dataSourceTypes = [{ id: 1 }, { id: 2 }, { id: 3 }]
      const expectedResult = [{
        id: 1,
        ref_data_sources: [{ ref_data_source_type_id: 1 }, { ref_data_source_type_id: 1 }],
      }, { id: 2, ref_data_sources: [{ ref_data_source_type_id: 2 }] }, {
        id: 3,
        ref_data_sources: [],
      }]
      const target = new RefDataSourceTypeService()
      db.refDataSourceType.all = mockResolve(dataSourceTypes)
      target.refDataSourceService.getRefDataSources = mockResolve(dataSources)

      return target.getRefDataSourceTypesWithDataSources().then((data) => {
        expect(db.refDataSourceType.all).toHaveBeenCalled()
        expect(target.refDataSourceService.getRefDataSources).toHaveBeenCalled()
        expect(data).toEqual(expectedResult)
      })
    })

    it('rejects when getRefDataSources fails', () => {
      const target = new RefDataSourceTypeService()
      db.refDataSourceType.all = mockResolve([])
      target.refDataSourceService.getRefDataSources = mockReject('error')

      return target.getRefDataSourceTypesWithDataSources().then(() => {}, (err) => {
        expect(db.refDataSourceType.all).toHaveBeenCalled()
        expect(target.refDataSourceService.getRefDataSources).toHaveBeenCalled()
        expect(err).toEqual('error')
      })
    })

    it('rejects when get all ref data source types fails', () => {
      const target = new RefDataSourceTypeService()
      db.refDataSourceType.all = mockReject('error')
      target.refDataSourceService.getRefDataSources = mockReject('error')

      return target.getRefDataSourceTypesWithDataSources().then(() => {}, (err) => {
        expect(db.refDataSourceType.all).toHaveBeenCalled()
        expect(target.refDataSourceService.getRefDataSources).not.toHaveBeenCalled()
        expect(err).toEqual('error')
      })
    })
  })
})