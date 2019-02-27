import Transactional from '@monsantoit/pg-transactional'
import db from '../db/DbManager'
import AppUtil from './utility/AppUtil'

const { setErrorCode } = require('@monsantoit/error-decorator')()

// Error Codes 1WXXXX
class AnalysisModelService {
  @setErrorCode('1W1000')
  @Transactional('batchCreateAnalysisModel')
  batchCreateAnalysisModel=(analysisModelInfo, context, tx) =>
    db.analysisModel.batchCreate(analysisModelInfo, context, tx)
      .then(data => AppUtil.createPostResponse(data))

  @setErrorCode('1W2000')
  @Transactional('getAnalysisModelByExperimentId')
  getAnalysisModelByExperimentId = (id, tx) => db.analysisModel.findByExperimentId(id, tx)

  @setErrorCode('1W3000')
  @Transactional('deleteAnalysisModelById')
  deleteAnalysisModelByExperimentId = (id, tx) => db.analysisModel.removeByExperimentId(id, tx)

  @setErrorCode('1W4000')
  @Transactional('batchUpdateAnalysisModel')
  batchUpdateAnalysisModel=(analysisModelInfo, context, tx) =>
    db.analysisModel.batchUpdate(analysisModelInfo, context, tx)
      .then(data => AppUtil.createPutResponse(data))
}

module.exports = AnalysisModelService
