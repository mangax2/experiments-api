import { mock, mockResolve, mockReject } from '../jestUtil'
import AppUtil from '../../src/services/utility/AppUtil'
import AnalysisModelService from '../../src/services/AnalysisModelService'
import { dbRead, dbWrite } from '../../src/db/DbManager'

describe('AnalysisModelService', () => {
  let target
  const testTx = { tx: {} }
  const testContext = {}

  beforeEach(() => {
    target = new AnalysisModelService()
  })

  describe('batchCreateAnalysisModel', () => {
    test('calls batchCreate and succeeds', () => {
      dbWrite.analysisModel.batchCreate = mockResolve({})
      AppUtil.createPostResponse = mock()

      return target.batchCreateAnalysisModel([], testContext, testTx).then(() => {
        expect(dbWrite.analysisModel.batchCreate).toHaveBeenCalledWith([], testContext, testTx)
        expect(AppUtil.createPostResponse).toHaveBeenCalledWith({})
      })
    })

    test('rejects when batchCreate fails', () => {
      const error = { message: 'error' }
      dbWrite.analysisModel.batchCreate = mockReject(error)

      return target.batchCreateAnalysisModel([], testContext, testTx).then(() => {}, (err) => {
        expect(dbWrite.analysisModel.batchCreate).toHaveBeenCalledWith([], testContext, testTx)
        expect(err).toEqual(error)
      })
    })
  })

  describe('getAnalysisModelByExperimentId', () => {
    test('returns AnalysisModel for an experimentId', () => {
      dbRead.analysisModel.findByExperimentId = mockResolve(['test'])

      return target.getAnalysisModelByExperimentId(1).then((data) => {
        expect(dbRead.analysisModel.findByExperimentId).toHaveBeenCalledWith(1)
        expect(data).toEqual(['test'])
      })
    })

    test('rejects when findByExperimentId fails', () => {
      const error = { message: 'error' }
      dbRead.analysisModel.findByExperimentId = mockReject(error)

      return target.getAnalysisModelByExperimentId(1).then(() => {}, (err) => {
        expect(dbRead.analysisModel.findByExperimentId).toHaveBeenCalledWith(1)
        expect(err).toEqual(error)
      })
    })
  })

  describe('deleteAnalysisModelByExperimentId', () => {
    test('deleted AnalysisModel for an experimentId', () => {
      dbWrite.analysisModel.removeByExperimentId = mockResolve(1)
      return target.deleteAnalysisModelByExperimentId(1, testTx).then((data) => {
        expect(dbWrite.analysisModel.removeByExperimentId).toHaveBeenCalledWith(1, testTx)
        expect(data).toEqual(1)
      })
    })
  })

  describe('batchUpdateAnalysisModel', () => {
    test('updates AnalysisModel for experiments', () => {
      dbWrite.analysisModel.batchUpdate = mockResolve({})
      AppUtil.createPutResponse = mock()

      return target.batchUpdateAnalysisModel([], testContext, testTx).then(() => {
        expect(dbWrite.analysisModel.batchUpdate).toHaveBeenCalledWith([], testContext, testTx)
        expect(AppUtil.createPutResponse).toHaveBeenCalledWith({})
      })
    })

    test('rejects when batchUpdate fails', () => {
      const error = { message: 'error' }
      dbWrite.analysisModel.batchUpdate = mockReject(error)

      return target.batchUpdateAnalysisModel([], testContext, testTx).then(() => {}, (err) => {
        expect(dbWrite.analysisModel.batchUpdate).toHaveBeenCalledWith([], testContext, testTx)
        expect(err).toEqual(error)
      })
    })
  })
})
