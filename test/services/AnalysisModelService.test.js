import { mock, mockResolve, mockReject } from '../jestUtil'
import AppUtil from '../../src/services/utility/AppUtil'
import AnalysisModelService from '../../src/services/AnalysisModelService'
import db from '../../src/db/DbManager'

describe('AnalysisModelService', () => {
  let target
  const testTx = { tx: {} }
  const testContext = {}

  beforeEach(() => {
    expect.hasAssertions()
    target = new AnalysisModelService()
  })

  describe('batchCreateAnalysisModel', () => {
    test('calls batchCreate and succeeds', () => {
      db.analysisModel.batchCreate = mockResolve({})
      AppUtil.createPostResponse = mock()

      return target.batchCreateAnalysisModel([], testContext, testTx).then(() => {
        expect(db.analysisModel.batchCreate).toHaveBeenCalledWith([], testContext, testTx)
        expect(AppUtil.createPostResponse).toHaveBeenCalledWith({})
      })
    })

    test('rejects when batchCreate fails', () => {
      const error = { message: 'error' }
      db.analysisModel.batchCreate = mockReject(error)

      return target.batchCreateAnalysisModel([], testContext, testTx).then(() => {}, (err) => {
        expect(db.analysisModel.batchCreate).toHaveBeenCalledWith([], testContext, testTx)
        expect(err).toEqual(error)
      })
    })
  })

  describe('getAnalysisModelByExperimentId', () => {
    test('returns AnalysisModel for an experimentId', () => {
      db.analysisModel.findByExperimentId = mockResolve(['test'])

      return target.getAnalysisModelByExperimentId(1, testTx).then((data) => {
        expect(db.analysisModel.findByExperimentId).toHaveBeenCalledWith(1, testTx)
        expect(data).toEqual(['test'])
      })
    })

    test('rejects when findByExperimentId fails', () => {
      const error = { message: 'error' }
      db.analysisModel.findByExperimentId = mockReject(error)

      return target.getAnalysisModelByExperimentId(1, testTx).then(() => {}, (err) => {
        expect(db.analysisModel.findByExperimentId).toHaveBeenCalledWith(1, testTx)
        expect(err).toEqual(error)
      })
    })
  })

  describe('batchUpdateAnalysisModel', () => {
    test('updates AnalysisModel for experiments', () => {
      db.analysisModel.batchUpdate = mockResolve({})
      AppUtil.createPutResponse = mock()

      return target.batchUpdateAnalysisModel([], testContext, testTx).then(() => {
        expect(db.analysisModel.batchUpdate).toHaveBeenCalledWith([], testContext, testTx)
        expect(AppUtil.createPutResponse).toHaveBeenCalledWith({})
      })
    })

    test('rejects when batchUpdate fails', () => {
      const error = { message: 'error' }
      db.analysisModel.batchUpdate = mockReject(error)

      return target.batchUpdateAnalysisModel([], testContext, testTx).then(() => {}, (err) => {
        expect(db.analysisModel.batchUpdate).toHaveBeenCalledWith([], testContext, testTx)
        expect(err).toEqual(error)
      })
    })
  })
})
