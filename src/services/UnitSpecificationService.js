import { dbRead } from '../db/DbManager'

const { setErrorCode } = require('@monsantoit/error-decorator')()
// Error Codes 1TXXXX
class UnitSpecificationService {
  @setErrorCode('1T2000')
  getAllUnitSpecifications = () => dbRead.unitSpecification.all()
}

module.exports = UnitSpecificationService
