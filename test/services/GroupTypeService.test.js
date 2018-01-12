import { mock, mockReject, mockResolve } from '../jestUtil'
import GroupTypeService from '../../src/services/GroupTypeService'
import AppError from '../../src/services/utility/AppError'
import db from '../../src/db/DbManager'

describe('GroupTypeService', () => {
  let target

  beforeEach(() => {
    target = new GroupTypeService()
  })

  describe('getGroupTypeById', () => {
    test('returns a group type', () => {
      db.groupType.find = mockResolve({})

      return target.getGroupTypeById(1).then((data) => {
        expect(db.groupType.find).toHaveBeenCalledWith(1)
        expect(data).toEqual({})
      })
    })

    test('throws an error when find returns empty', () => {
      db.groupType.find = mockResolve()
      AppError.notFound = mock()

      return target.getGroupTypeById(1, { requestId: 5 }).then(() => {}, () => {
        expect(db.groupType.find).toHaveBeenCalledWith(1)
        expect(AppError.notFound).toHaveBeenCalledWith('Group Type Not Found for requested id', undefined, '1H1001')
      })
    })

    test('rejects when find fails', () => {
      const error = { message: 'error' }
      db.groupType.find = mockReject(error)

      return target.getGroupTypeById(1).then(() => {}, (err) => {
        expect(db.groupType.find).toHaveBeenCalledWith(1)
        expect(err).toEqual(error)
      })
    })
  })

  describe('getAllGroupTypes', () => {
    test('gets all group types', () => {
      db.groupType.all = mockResolve([{}])

      return target.getAllGroupTypes().then((data) => {
        expect(db.groupType.all).toHaveBeenCalled()
        expect(data).toEqual([{}])
      })
    })

    test('rejects when get all fails', () => {
      const error = { message: 'error' }
      db.groupType.all = mockReject(error)

      return target.getAllGroupTypes().then(() => {}, (err) => {
        expect(db.groupType.all).toHaveBeenCalled()
        expect(err).toEqual(error)
      })
    })
  })
})
