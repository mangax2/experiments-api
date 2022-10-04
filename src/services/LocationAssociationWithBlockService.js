import { dbRead } from '../db/DbManager'

const { setErrorCode } = require('@monsantoit/error-decorator')()

// Error Codes 2ZXXXX
class LocationAssociationWithBlockService {
  @setErrorCode('2Z1000')
  getByExperimentId = (id) => dbRead.locationAssociation.findByExperimentId(id)

  @setErrorCode('2Z2000')
  getBySetId = (id) => dbRead.locationAssociation.findBySetId(id)
}

module.exports = LocationAssociationWithBlockService
