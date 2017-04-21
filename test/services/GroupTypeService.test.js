import { mock, mockReject, mockResolve } from '../jestUtil'
import GroupTypeService from '../../src/services/GroupTypeService'
import AppError from '../../src/services/utility/AppError'
import db from '../../src/db/DbManager'

describe('GroupTypeService', () => {
  describe('getGroupTypeById', () => {
    it('returns a group type', () => {
      const target = new GroupTypeService()
      db.groupType.find = mockResolve({})

      return target.getGroupTypeById(1).then((data) => {
        expect(db.groupType.find).toHaveBeenCalledWith(1)
        expect(data).toEqual({})
      })
    })

    it('throws an error when find returns empty', () => {
      const target = new GroupTypeService()
      db.groupType.find = mockResolve()
      AppError.notFound = mock()

      return target.getGroupTypeById(1).then(() => {}, () => {
        expect(db.groupType.find).toHaveBeenCalledWith(1)
        expect(AppError.notFound).toHaveBeenCalledWith('Group Type Not Found for requested id')
      })
    })

    it('rejects when find fails', () => {
      const target = new GroupTypeService()
      db.groupType.find = mockReject('error')

      return target.getGroupTypeById(1).then(() => {}, (err) => {
        expect(db.groupType.find).toHaveBeenCalledWith(1)
        expect(err).toEqual('error')
      })
    })
  })

  describe('getAllGroupTypes', () => {
    it('gets all group types', () => {
      const target = new GroupTypeService()
      db.groupType.all = mockResolve([{}])

      return target.getAllGroupTypes().then((data) => {
        expect(db.groupType.all).toHaveBeenCalled()
        expect(data).toEqual([{}])
      })
    })

    it('rejects when get all fails', () => {
      const target = new GroupTypeService()
      db.groupType.all = mockReject('error')

      return target.getAllGroupTypes().then(() => {}, (err) => {
        expect(db.groupType.all).toHaveBeenCalled()
        expect(err).toEqual('error')
      })
    })
  })
})