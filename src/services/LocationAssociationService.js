import _ from 'lodash'
import Transactional from '@monsantoit/pg-transactional'
import db from '../db/DbManager'
import AppError from './utility/AppError'
import ExperimentsService from './ExperimentsService'
import ExperimentalUnitService from './ExperimentalUnitService'
import setErrorDecorator from '../decorators/setErrorDecorator'

const { getFullErrorCode, setErrorCode } = setErrorDecorator()

// Error Codes 1YXXXX
class LocationAssociationService {
  constructor() {
    this.experimentService = new ExperimentsService()
    this.experimentalUnitService = new ExperimentalUnitService()
  }

  @setErrorCode('1Y1000')
  @Transactional('associateSetsToLocations')
  associateSetsToLocations = (experimentId, groups, context, tx) =>
    Promise.all([
      this.experimentalUnitService
        .getExperimentalUnitsByExperimentIdNoValidate(experimentId, tx),
      this.experimentService.getExperimentById(experimentId, false, context, tx),
    ]).then(([units]) => {
      const locations = _.uniq(_.map(units, 'location'))

      const assocations = _.map(groups, (group) => {
        const splitGroupId = group.id.split('.')
        const experimentIdFromGroup = Number(splitGroupId[0])
        const location = Number(splitGroupId[1])

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

        return {
          experimentId: Number(experimentId),
          location,
          setId: group.setId,
        }
      })

      return db.locationAssociation.batchRemoveByExperimentIdAndLocation(assocations, tx).then(() =>
        db.locationAssociation.batchCreate(assocations, context, tx))
    })

  @setErrorCode('1Y2000')
  @Transactional('getLocationAssociationByExperimentId')
  getLocationAssociationByExperimentId = (experimentId, tx) =>
    db.locationAssociation.findByExperimentId(experimentId, tx)
}

module.exports = LocationAssociationService
