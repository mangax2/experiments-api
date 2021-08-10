import { dbRead } from '../db/DbManager'

const { setErrorCode } = require('@monsantoit/error-decorator')()

// Error Codes 1KXXXX
class RefDataSourceService {
  @setErrorCode('1K1000')
  getRefDataSources = () => dbRead.refDataSource.all()

  @setErrorCode('1K2000')
  getRefDataSourcesByRefDataSourceTypeId = id => dbRead.refDataSource.findByTypeId(id)
}

module.exports = RefDataSourceService
