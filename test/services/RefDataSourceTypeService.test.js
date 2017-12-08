import { mockReject, mockResolve } from '../jestUtil'
import RefDataSourceTypeService from '../../src/services/RefDataSourceTypeService'
import db from '../../src/db/DbManager'

describe('RefDataSourceTypeService', () => {
  let target

  beforeEach(() => {
    target = new RefDataSourceTypeService()
  })

  describe('getRefDataSourceTypes', () => {
    test('gets ref data source types', () => {
      db.refDataSourceType.all = mockResolve([{}])

      return target.getRefDataSourceTypes().then((data) => {
        expect(db.refDataSourceType.all).toHaveBeenCalled()
        expect(data).toEqual([{}])
      })
    })

    test('rejects when get all fails', () => {
      db.refDataSourceType.all = mockReject('error')

      return target.getRefDataSourceTypes().then(() => {}, (err) => {
        expect(db.refDataSourceType.all).toHaveBeenCalled()
        expect(err).toEqual('error')
      })
    })
  })

  describe('getRefDataSourceTypesWithDataSources', () => {
    test('returns data source types with respective data sources', () => {
      const dataSources = [{ ref_data_source_type_id: 1 }, { ref_data_source_type_id: 1 }, { ref_data_source_type_id: 2 }]
      const dataSourceTypes = [{ id: 1 }, { id: 2 }, { id: 3 }]
      const expectedResult = [{
        id: 1,
        ref_data_sources: [{ ref_data_source_type_id: 1 }, { ref_data_source_type_id: 1 }],
      }, { id: 2, ref_data_sources: [{ ref_data_source_type_id: 2 }] }, {
        id: 3,
        ref_data_sources: [],
      }]

      db.refDataSourceType.all = mockResolve(dataSourceTypes)
      target.refDataSourceService.getRefDataSources = mockResolve(dataSources)

      return target.getRefDataSourceTypesWithDataSources().then((data) => {
        expect(db.refDataSourceType.all).toHaveBeenCalled()
        expect(target.refDataSourceService.getRefDataSources).toHaveBeenCalled()
        expect(data).toEqual(expectedResult)
      })
    })

    test('rejects when getRefDataSources fails', () => {
      db.refDataSourceType.all = mockResolve([])
      target.refDataSourceService.getRefDataSources = mockReject('error')

      return target.getRefDataSourceTypesWithDataSources().then(() => {}, (err) => {
        expect(db.refDataSourceType.all).toHaveBeenCalled()
        expect(target.refDataSourceService.getRefDataSources).toHaveBeenCalled()
        expect(err).toEqual('error')
      })
    })

    test('rejects when get all ref data source types fails', () => {
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
