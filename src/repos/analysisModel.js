const { setErrorCode } = require('@monsantoit/error-decorator')()
import _ from 'lodash'

// Error Codes 5NXXXX
class analysisModelRepo {
  constructor(rep) {
    this.rep = rep
  }

  @setErrorCode('5N0000')
  repository = () => this.rep

  @setErrorCode('5N1000')
  findByExperimentId = (experimentId) => this.rep.oneOrNone('SELECT experiment_id,' +
    ' analysis_model_type, analysis_model_sub_type FROM' +
    ' analysis_model WHERE' +
    ' experiment_id = $1', experimentId)

  @setErrorCode('5N4000')
  batchFindByExperimentIds = (ids) => this.rep.any('SELECT * FROM "analysis_model" WHERE' +
    ' experiment_id IN' +
    ' ($1:csv)', [ids]).then(data => {
    const keyedData = _.keyBy(data, 'experiment_id')
    return _.map(ids, id => keyedData[id])
  })

  @setErrorCode('5N9000')
  removeByExperimentId = (id, tx = this.rep) => tx.oneOrNone('DELETE FROM analysis_model WHERE experiment_id = $1 RETURNING id', id)


  @setErrorCode('5N2000')
  batchCreate = (analysisModelInfo, context, tx = this.rep) =>{
    return tx.batch(
    analysisModelInfo.map(
      analysisModel => {
        return tx.one(
        'insert into' +
          ' analysis_model(experiment_id,analysis_model_type,analysis_model_sub_type,created_user_id,created_date,modified_user_id,modified_date) values($1, $2, $3, $4, CURRENT_TIMESTAMP, $4, CURRENT_TIMESTAMP )' +
        '  RETURNING *',
         [analysisModel.experimentId,
          analysisModel.analysisModelType,
          analysisModel.analysisModelSubType,
           context.userId,
          ],
      )},
    ),
  )
}

  @setErrorCode('5N3000')
  batchUpdate = (analysisModelInfo, context, tx = this.rep) => {
    return tx.batch(
      analysisModelInfo.map(
      analysisModel => tx.oneOrNone(
        'UPDATE analysis_model SET (analysis_model_type,analysis_model_sub_type,modified_user_id, modified_date)= ($1, $2, $3, CURRENT_TIMESTAMP ) WHERE experiment_id=$4 RETURNING *',
        [analysisModel.analysisModelType,
          analysisModel.analysisModelSubType,
          context.userId,
          analysisModel.experimentId,
        ],
      )
     )
    )
  }
}

module.exports = rep => new analysisModelRepo(rep)