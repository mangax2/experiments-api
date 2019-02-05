import _ from 'lodash'
import Transactional from '@monsantoit/pg-transactional'
import db from '../db/DbManager'
import AppError from './utility/AppError'
import ExperimentsService from './ExperimentsService'
import ExperimentalUnitService from './ExperimentalUnitService'

const { getFullErrorCode, setErrorCode } = require('@monsantoit/error-decorator')()

// Error Codes 1YXXXX
class LocationAssociationService {
  constructor() {
    this.experimentService = new ExperimentsService()
    this.experimentalUnitService = new ExperimentalUnitService()
  }

  @setErrorCode('1Y1000')
  @Transactional('associateSetsToLocations')
  associateSetsToLocations = (experimentId, groups, context, tx) =>
    tx.batch([
      this.experimentalUnitService
        .getExperimentalUnitsByExperimentIdNoValidate(experimentId, tx),
      this.experimentService.getExperimentById(experimentId, false, context, tx),
    ]).then(([units]) => {
      const locations = _.uniq(_.map(units, 'location'))
      const blocks = _.uniq(_.compact(_.map(units, 'block')))

      const assocations = _.map(groups, (group) => {
        const splitGroupId = group.id.split('.')
        const experimentIdFromGroup = Number(splitGroupId[0])
        const location = Number(splitGroupId[1])
        const block = parseInt(splitGroupId[2], 10)

        if (_.isNil(experimentIdFromGroup)
          || _.isNaN(experimentIdFromGroup)
          || experimentIdFromGroup !== Number(experimentId)
        ) {
          throw AppError.badRequest('Experiment Id from Group Id does not match Experiment Id on route', null, getFullErrorCode('1Y1003'))
        }

        if (_.isNil(location) || _.isNaN(location)) {
          throw AppError.badRequest('Unable to determine location from group id', null, getFullErrorCode('1Y1001'))
        }

        if (!locations.includes(location)) {
          throw AppError.badRequest('Location does not match valid locations for this experiment', null, getFullErrorCode('1Y1002'))
        }

        if (blocks.length > 0) {
          if (!blocks.includes(block)) {
            throw AppError.badRequest('Invalid block value passed for association', null, getFullErrorCode('1Y1004'))
          }
        } else if (!_.isNaN(block)) {
          throw AppError.badRequest('Invalid block value passed for association', null, getFullErrorCode('1Y1005'))
        }

        return {
          experimentId: Number(experimentId),
          location,
          setId: group.setId,
          block: _.isNaN(block) ? null : block,
        }
      })

      return db.locationAssociation.batchRemoveByExperimentIdAndLocationAndBlock(assocations, tx)
        .then(() => db.locationAssociation.batchCreate(assocations, context, tx))
    })

  @setErrorCode('1Y2000')
  @Transactional('getLocationAssociationByExperimentId')
  getLocationAssociationByExperimentId = (experimentId, tx) =>
    db.locationAssociation.findByExperimentId(experimentId, tx)
}

module.exports = LocationAssociationService
