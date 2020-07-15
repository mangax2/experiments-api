import * as _ from 'lodash'
import AppError from './utility/AppError'
import HttpUtil from './utility/HttpUtil'
import PingUtil from './utility/PingUtil'
import apiUrls from '../config/apiUrls'

const { setErrorCode } = require('@monsantoit/error-decorator')()

// Error Codes 1WXXXX
class ListsService {
  constructor(preferencesService) {
    this.preferencesService = preferencesService
  }

  @setErrorCode('1W1000')
  getLists = (userId, listIds) =>
    PingUtil.getMonsantoHeader()
      .then((headers) => {
        headers.push({ headerName: 'user-id', headerValue: userId.toLowerCase() })
        return HttpUtil.get(`${apiUrls.materialListsAPIUrl}/lists?${_.map(listIds, id => `id=${id}`).join('&')}`, headers)
      })

  @setErrorCode('1W2000')
  setUserLists = (userId, listIds, headers, context) => {
    if (_.isNil(userId) || _.isNil(headers) || _.isNil(headers.authorization)) {
      throw AppError.badRequest('UserId and Authorization Header must be present', null, '1W2001')
    } else {
      return this.getLists(userId, listIds).then((returnedLists) => {
        const returnedListIds = _.map(returnedLists.body.content, 'id')
        const invalidListIds = _.filter(listIds, id => !returnedListIds.includes(id))
        if (invalidListIds.length > 0) {
          throw AppError.badRequest(`Not all provided list ids are valid. Invalid List Ids: ${invalidListIds}`, null, '1W2002')
        }

        return this.preferencesService.getPreferences('material-lists-integration', 'experiments-ui', headers.authorization, context)
          .then((data) => {
            const preferences = data.body
            preferences.listIds = _.uniq(_.compact(([].concat(preferences.listIds, listIds))))
            return this.preferencesService.setPreferences('material-lists-integration', 'experiments-ui', preferences, headers.authorization, context)
              .then(() => ({ success: true, url: `${apiUrls.velocityUrl}/experiments`, method: 'newtab' }))
          })
      }, (err) => { throw AppError.internalServerError('Error Retrieving Lists', JSON.parse(err.response.text), '1W2003') })
    }
  }
}

module.exports = ListsService
