import db from '../db/DbManager'
import setErrorDecorator from '../decorators/setErrorDecorator'

const { setErrorCode } = setErrorDecorator()

// Error Codes 1KXXXX
class RefDataSourceService {
  @setErrorCode('1K1000')
  getRefDataSources = () => db.refDataSource.all()

  @setErrorCode('1K2000')
  getRefDataSourcesByRefDataSourceTypeId = id => db.refDataSource.findByTypeId(id)
}

module.exports = RefDataSourceService
