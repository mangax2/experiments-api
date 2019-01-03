import db from '../db/DbManager'

const { setErrorCode } = require('@monsantoit/error-decorator')()

// Error Codes 1MXXXX
class RefDesignSpecificationService {
  @setErrorCode('1M2000')
  getAllRefDesignSpecs = () => db.refDesignSpecification.all()
}

module.exports = RefDesignSpecificationService
