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
    this.experimentService = ExperimentsService
    this.experimentalUnitService = new ExperimentalUnitService()
  }

  @setErrorCode('1Y1000')
  @Transactional('associateSetsToLocations')
  associateSetsToLocations = (experimentId, rawNewAssociations, context, tx) =>
    tx.batch([
      this.experimentalUnitService
        .getExperimentalUnitsByExperimentIdNoValidate(experimentId, tx),
      db.block.findByExperimentId(experimentId, tx),
      this.experimentService.verifyExperimentExists(experimentId, false, context, tx),
    ]).then(([units, blocks]) => {
      const locations = _.uniq(_.map(units, 'location'))

      const associations = _.map(rawNewAssociations, (rawNewAssociation) => {
        const newAssociation = destructureInput(rawNewAssociation)
        const block = _.find(blocks, { name: newAssociation.block || null })

        validateNewAssociation(newAssociation, experimentId, locations, block)

        return {
          location: newAssociation.location,
          setId: newAssociation.setId,
          block_id: block.id,
        }
      })

      return db.locationAssociation.batchRemoveByLocationAndBlock(associations, tx)
        .then(() => db.locationAssociation.batchCreate(associations, context, tx))
    })
}

const destructureInput = (rawInput) => {
  const splitGroupId = rawInput.id.split('.')
  return {
    experimentId: Number(splitGroupId[0]),
    location: Number(splitGroupId[1]),
    block: splitGroupId.slice(2).join('.'),
    setId: rawInput.setId,
  }
}

const validateNewAssociation = (newAssociation, experimentId, locations, existingBlock) => {
  if (_.isNil(newAssociation.experimentId)
    || _.isNaN(newAssociation.experimentId)
    || newAssociation.experimentId !== Number(experimentId)
  ) {
    throw AppError.badRequest('Experiment Id from Group Id does not match Experiment Id on route', null, getFullErrorCode('1Y1003'))
  }

  if (_.isNil(newAssociation.location) || _.isNaN(newAssociation.location)) {
    throw AppError.badRequest('Unable to determine location from group id', null, getFullErrorCode('1Y1001'))
  }

  if (!locations.includes(newAssociation.location)) {
    throw AppError.badRequest('Location does not match valid locations for this experiment', null, getFullErrorCode('1Y1002'))
  }

  if (!existingBlock) {
    throw AppError.badRequest('Invalid block value passed for association', null, getFullErrorCode('1Y1004'))
  }
}

module.exports = LocationAssociationService
