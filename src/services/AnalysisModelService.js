import Transactional from '@monsantoit/pg-transactional'
import { dbRead, dbWrite } from '../db/DbManager'
import AppUtil from './utility/AppUtil'

const { setErrorCode } = require('@monsantoit/error-decorator')()

// Error Codes 1WXXXX
class AnalysisModelService {
  @setErrorCode('1W1000')
  @Transactional('batchCreateAnalysisModel')
  batchCreateAnalysisModel=(analysisModelInfo, context, tx) =>
    dbWrite.analysisModel.batchCreate(analysisModelInfo, context, tx)
      .then(data => AppUtil.createPostResponse(data))

  @setErrorCode('1W2000')
  getAnalysisModelByExperimentId = id => dbRead.analysisModel.findByExperimentId(id)

  @setErrorCode('1W3000')
  @Transactional('deleteAnalysisModelById')
  deleteAnalysisModelByExperimentId = (id, tx) => dbWrite.analysisModel.removeByExperimentId(id, tx)

  @setErrorCode('1W4000')
  @Transactional('batchUpdateAnalysisModel')
  batchUpdateAnalysisModel=(analysisModelInfo, context, tx) =>
    dbWrite.analysisModel.batchUpdate(analysisModelInfo, context, tx)
      .then(data => AppUtil.createPutResponse(data))
}

module.exports = AnalysisModelService
