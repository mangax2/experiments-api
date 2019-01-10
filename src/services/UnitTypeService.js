import db from '../db/DbManager'

const { setErrorCode } = require('@monsantoit/error-decorator')()

// Error Codes 1UXXXX
class UnitTypeService {
  @setErrorCode('1U2000')
  getAllUnitTypes = () => db.unitType.all()
}

module.exports = UnitTypeService
