import { mock, mockReject, mockResolve } from '../jestUtil'
import TagService from '../../src/services/TagService'
import AppError from '../../src/services/utility/AppError'
import AppUtil from '../../src/services/utility/AppUtil'
import db from '../../src/db/DbManager'

describe('TagService', () => {
  let target
  const testContext = {}
  const testTx = { tx: {} }

  beforeEach(() => {
    target = new TagService()
  })

  describe('batchCreateTags', () => {
    it('creates tags', () => {
      target.validator.validate = mockResolve()
      db.tag.batchCreate = mockResolve({})
      AppUtil.createPostResponse = mock()

      return target.batchCreateTags([], testContext, testTx).then(() => {
        expect(target.validator.validate).toHaveBeenCalledWith([], 'POST', testTx)
        expect(db.tag.batchCreate).toHaveBeenCalledWith([], testContext, testTx)
        expect(AppUtil.createPostResponse).toHaveBeenCalledWith({})
      })
    })

    it('rejects when batchCreate fails', () => {
      target.validator.validate = mockResolve()
      db.tag.batchCreate = mockReject('error')

      return target.batchCreateTags([], testContext, testTx).then(() => {}, (err) => {
        expect(target.validator.validate).toHaveBeenCalledWith([], 'POST', testTx)
        expect(db.tag.batchCreate).toHaveBeenCalledWith([], testContext, testTx)
        expect(err).toEqual('error')
      })
    })

    it('rejects when validate fails', () => {
      target.validator.validate = mockReject('error')
      db.tag.batchCreate = mock()

      return target.batchCreateTags([], testContext, testTx).then(() => {}, (err) => {
        expect(target.validator.validate).toHaveBeenCalledWith([], 'POST', testTx)
        expect(db.tag.batchCreate).not.toHaveBeenCalled()
        expect(err).toEqual('error')
      })
    })
  })

  describe('getTagsByExperimentId', () => {
    it('gets tags for an experiment', () => {
      db.tag.findByExperimentId = mockResolve([{}])

      return target.getTagsByExperimentId(1, testTx).then((data) => {
        expect(db.tag.findByExperimentId).toHaveBeenCalledWith(1, testTx)
        expect(data).toEqual([{}])
      })
    })

    it('rejects when get tags fails', () => {
      db.tag.findByExperimentId = mockReject('error')

      return target.getTagsByExperimentId(1, testTx).then(() => {}, (err) => {
        expect(db.tag.findByExperimentId).toHaveBeenCalledWith(1, testTx)
        expect(err).toEqual('error')
      })
    })
  })

  describe('getTagsByExperimentsIds', () => {
    it('gets all tags for passed in ids', () => {
      db.tag.batchFindByExperimentIds = mockResolve([{}])

      return target.getTagsByExperimentIds([1, 2], testTx).then((data) => {
        expect(db.tag.batchFindByExperimentIds).toHaveBeenCalledWith([1, 2], testTx)
        expect(data).toEqual([{}])
      })
    })

    it('rejects when batchFindByExperimentIds fails', () => {
      db.tag.batchFindByExperimentIds = mockReject('error')

      return target.getTagsByExperimentIds([1, 2], testTx).then(() => {}, (err) => {
        expect(db.tag.batchFindByExperimentIds).toHaveBeenCalledWith([1, 2], testTx)
        expect(err).toEqual('error')
      })
    })
  })

  describe('getTagById', () => {
    it('returns a tag', () => {
      db.tag.find = mockResolve({})

      return target.getTagById(1, testTx).then((data) => {
        expect(db.tag.find).toHaveBeenCalledWith(1, testTx)
        expect(data).toEqual({})
      })
    })

    it('throws an error when no tag is returned', () => {
      db.tag.find = mockResolve()
      AppError.notFound = mock()

      return target.getTagById(1, testTx).then(() => {}, () => {
        expect(db.tag.find).toHaveBeenCalledWith(1, testTx)
        expect(AppError.notFound).toHaveBeenCalledWith('Tag Not Found for requested id')
      })
    })

    it('rejects when find fails', () => {
      db.tag.find = mockReject('error')

      return target.getTagById(1, testTx).then(() => {}, (err) => {
        expect(db.tag.find).toHaveBeenCalledWith(1, testTx)
        expect(err).toEqual('error')
      })
    })
  })

  describe('batchGetTagByIds', () => {
    it('returns tags for ids', () => {
      db.tag.batchFind = mockResolve([{}])

      return target.batchGetTagByIds([1, 2], testTx).then((data) => {
        expect(db.tag.batchFind).toHaveBeenCalledWith([1, 2], testTx)
        expect(data).toEqual([{}])
      })
    })

    it('rejects when batchFind fails', () => {
      db.tag.batchFind = mockReject('error')

      return target.batchGetTagByIds([1, 2], testTx).then(() => {}, (err) => {
        expect(db.tag.batchFind).toHaveBeenCalledWith([1, 2], testTx)
        expect(err).toEqual('error')
      })
    })
  })

  describe('batchUpdateTags', () => {
    it('updates tags', () => {
      target.validator.validate = mockResolve()
      db.tag.batchUpdate = mockResolve({})
      AppUtil.createPutResponse = mock()

      return target.batchUpdateTags([{}], testContext, testTx).then(() => {
        expect(target.validator.validate).toHaveBeenCalledWith([{}], 'PUT', testTx)
        expect(db.tag.batchUpdate).toHaveBeenCalledWith([{}], testContext, testTx)
        expect(AppUtil.createPutResponse).toHaveBeenCalledWith({})
      })
    })

    it('rejects when batchUpdate fails', () => {
      target.validator.validate = mockResolve()
      db.tag.batchUpdate = mockReject('error')

      return target.batchUpdateTags([{}], testContext, testTx).then(() => {}, (err) => {
        expect(target.validator.validate).toHaveBeenCalledWith([{}], 'PUT', testTx)
        expect(db.tag.batchUpdate).toHaveBeenCalledWith([{}], testContext, testTx)
        expect(err).toEqual('error')
      })
    })

    it('rejects when validate fails', () => {
      target.validator.validate = mockReject('error')
      db.tag.batchUpdate = mockReject('error')

      return target.batchUpdateTags([{}], testContext, testTx).then(() => {}, (err) => {
        expect(target.validator.validate).toHaveBeenCalledWith([{}], 'PUT', testTx)
        expect(db.tag.batchUpdate).not.toHaveBeenCalled()
        expect(err).toEqual('error')
      })
    })
  })

  describe('deleteTag', () => {
    it('deletes a tag', () => {
      db.tag.remove = mockResolve(1)

      return target.deleteTag(1, testTx).then((data) => {
        expect(db.tag.remove).toHaveBeenCalledWith(1, testTx)
        expect(data).toEqual(1)
      })
    })

    it('throws an error when delete returns an empty value', () => {
      db.tag.remove = mockResolve()
      AppError.notFound = mock()

      return target.deleteTag(1, testTx).then(() => {}, () => {
        expect(db.tag.remove).toHaveBeenCalledWith(1, testTx)
        expect(AppError.notFound).toHaveBeenCalledWith('Tag Not Found for requested id')
      })
    })

    it('rejects when remove fails', () => {
      db.tag.remove = mockReject('error')

      return target.deleteTag(1, testTx).then(() => {}, (err) => {
        expect(db.tag.remove).toHaveBeenCalledWith(1, testTx)
        expect(err).toEqual('error')
      })
    })
  })

  describe('batchDeleteTags', () => {
    it('removes tags', () => {
      db.tag.batchRemove = mockResolve([1, 2])

      return target.batchDeleteTags([1, 2], testTx).then((data) => {
        expect(db.tag.batchRemove).toHaveBeenCalledWith([1, 2], testTx)
        expect(data).toEqual([1, 2])
      })
    })

    it('rejects when batchRemove fails', () => {
      db.tag.batchRemove = mockReject('error')

      return target.batchDeleteTags([1, 2], testTx).then(() => {}, (err) => {
        expect(db.tag.batchRemove).toHaveBeenCalledWith([1, 2], testTx)
        expect(err).toEqual('error')
      })
    })
  })

  describe('deleteTagsForExperimentId', () => {
    it('deletes tags for an experimentId', () => {
      db.tag.removeByExperimentId = mockResolve([1, 2])

      return target.deleteTagsForExperimentId(1, testTx).then((data) => {
        expect(db.tag.removeByExperimentId).toHaveBeenCalledWith(1, testTx)
        expect(data).toEqual([1, 2])
      })
    })

    it('rejects when removeByExperimentId fails', () => {
      db.tag.removeByExperimentId = mockReject('error')

      return target.deleteTagsForExperimentId(1, testTx).then(() => {}, (err) => {
        expect(db.tag.removeByExperimentId).toHaveBeenCalledWith(1, testTx)
        expect(err).toEqual('error')
      })
    })
  })

  describe('Search Tags By Name Contains', () => {
    it('SearchTagByName', () => {
      db.tag.searchByTagName = mockResolve([1, 2])
      return target.searchByTagName({ tagName: 'test' }).then((data) => {
        expect(db.tag.searchByTagName).toHaveBeenCalledWith('test')
        expect(data).toEqual([1, 2])
        db.tag.searchByTagName.mockReset()
        db.tag.searchByTagName.mockRestore()
      })

    })

    it('SearchTagByName with out Tag filters', () => {
      db.tag.searchByTagName = mockResolve([1, 2])
      return target.searchByTagName({ tagName: '' }).then((data) => {
        expect(db.tag.searchByTagName).toHaveBeenCalledWith('')
        expect(data).toEqual([1, 2])
        db.tag.searchByTagName.mockReset()
        db.tag.searchByTagName.mockRestore()
      })

    })

    it('SearchTagByName and Value', () => {
      db.tag.searchByTagValueForATagName = mockResolve([1, 2])
      return target.searchByTagValueForATagName('org', { tagValue: 'test' }).then((data) => {
        expect(db.tag.searchByTagValueForATagName).toHaveBeenCalledWith('org', 'test')
        expect(data).toEqual([1, 2])
        db.tag.searchByTagValueForATagName.mockReset()
        db.tag.searchByTagValueForATagName.mockRestore()
      })
    })
    it('SearchTagByName and not filter returns all values', () => {
      db.tag.searchByTagValueForATagName = mockResolve([1, 2])
      return target.searchByTagValueForATagName('org', { tagValue: '' }).then((data) => {
        expect(db.tag.searchByTagValueForATagName).toHaveBeenCalledWith('org', '')
        expect(data).toEqual([1, 2])
        db.tag.searchByTagValueForATagName.mockReset()
        db.tag.searchByTagValueForATagName.mockRestore()
      })
    })

  })
})