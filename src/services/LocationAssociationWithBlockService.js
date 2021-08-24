import _ from 'lodash'
import { dbRead } from '../db/DbManager'
import BlockService from './BlockService'

const { setErrorCode } = require('@monsantoit/error-decorator')()

// Error Codes 2ZXXXX
class LocationAssociationWithBlockService {
  constructor() {
    this.blockService = new BlockService()
  }

  @setErrorCode('2Z1000')
  getByExperimentId(id) {
    return dbRead.locationAssociation.findByExperimentId(id)
      .then((locationAssociations) => {
        if (locationAssociations.length === 0) {
          return []
        }
        return dbRead.block.batchFind(_.uniq(_.map(locationAssociations, 'block_id')))
          .then(blocks =>
            _.map(locationAssociations, (la) => {
              const block = _.find(blocks, { id: la.block_id })
              return this.addBlockInfoToLocationAssociation(la, block)
            }),
          )
      })
  }

  @setErrorCode('2Z2000')
  getBySetId(id) {
    return dbRead.locationAssociation.findBySetId(id)
      .then(locationAssociation => (_.isNil(locationAssociation) ? null :
        dbRead.block.findByBlockId(locationAssociation.block_id)
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
