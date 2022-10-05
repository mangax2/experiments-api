import _ from 'lodash'
import Transactional from '@monsantoit/pg-transactional'
import { dbRead, dbWrite } from '../db/DbManager'
import AppError from './utility/AppError'

const { getFullErrorCode, setErrorCode } = require('@monsantoit/error-decorator')()

// Error Codes 1YXXXX
class LocationAssociationService {
  @setErrorCode('1Y1000')
  @Transactional('associateSetsToLocations')
  associateSetsToLocations = async (experimentId, newAssociations, context, tx) => {
    const [units, blocks, locationAssociations] = await Promise.all([
      dbRead.unit.findAllByExperimentId(experimentId),
      dbRead.block.findByExperimentId(experimentId),
      dbRead.locationAssociation.findByExperimentId(experimentId),
    ])
    const locations = _.uniq(_.map(units, 'location'))

    validateNewAssociations(newAssociations, locations, blocks, locationAssociations)

    return dbWrite.locationAssociation.batchCreate(newAssociations, context, tx)
  }

  @setErrorCode('1Y2000')
  getByExperimentId = (id) => dbRead.locationAssociation.findByExperimentId(id)

  @setErrorCode('1Y3000')
  getBySetId = (id) => dbRead.locationAssociation.findBySetId(id)
}

const validateNewAssociations = (
  newAssociations,
  locations,
  blocks,
  locationAssociations,
) => {
  const associationWithBadLocation = newAssociations.find(newAssociation =>
    !locations.includes(newAssociation.location))
  if (associationWithBadLocation) {
    throw AppError.badRequest('Location does not match valid locations for this experiment', null, getFullErrorCode('1Y1002'))
  }

  const associationWithBadBlock = newAssociations.find(newAssociation =>
    !blocks.find(block => block.id === newAssociation.blockId))
  if (associationWithBadBlock) {
    throw AppError.badRequest('Invalid block value passed for association', null, getFullErrorCode('1Y1004'))
  }

  const associationAlreadyInDb = newAssociations.find(newAssociation =>
    locationAssociations.find(oldAssociation =>
      oldAssociation.location === newAssociation.location &&
      oldAssociation.block_id === newAssociation.blockId))
  if (associationAlreadyInDb) {
    throw AppError.badRequest('A set already exists for the location and block combination', null, getFullErrorCode('1Y1005'))
  }
}

module.exports = LocationAssociationService
