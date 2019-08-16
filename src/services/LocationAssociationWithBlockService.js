import _ from 'lodash'
import Transactional from '@monsantoit/pg-transactional'
import db from '../db/DbManager'
import BlockService from './BlockService'

const { setErrorCode } = require('@monsantoit/error-decorator')()

// Error Codes 2ZXXXX
class LocationAssociationWithBlockService {
  constructor() {
    this.blockService = new BlockService()
  }

  @setErrorCode('2Z1000')
  @Transactional('getLocationAssociationByExperimentId')
  getByExperimentId(id, tx) {
    return db.locationAssociation.findByExperimentId(id, tx)
      .then((locationAssociations) => {
        if (locationAssociations.length === 0) {
          return []
        }
        return db.block.batchFindByBlockIds(_.uniq(_.map(locationAssociations, 'block_id')), tx)
          .then(blocks =>
            _.map(locationAssociations, (la) => {
              const block = _.find(blocks, { id: la.block_id })
              return this.addBlockInfoToLocationAssociation(la, block)
            }),
          )
      })
  }

  @setErrorCode('2Z2000')
  @Transactional('getLocationAssociationBySetId')
  getBySetId(id, tx) {
    return db.locationAssociation.findBySetId(id, tx)
      .then(locationAssociation => (_.isNil(locationAssociation) ? null :
        db.block.findByBlockId(locationAssociation.block_id, tx)
          .then(block => this.addBlockInfoToLocationAssociation(locationAssociation, block))),
      )
  }

  @setErrorCode('2Z3000')
  addBlockInfoToLocationAssociation = (locationAssociation, block) => ({
    location: locationAssociation.location,
    set_id: locationAssociation.set_id,
    experiment_id: block.experiment_id,
    block: block.name,
    block_id: block.id,
  })
}

module.exports = LocationAssociationWithBlockService
