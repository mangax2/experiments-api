import db from '../db/DbManager'

class RefDataSourceService {
  getRefDataSources = () => db.refDataSource.all()

  getRefDataSourcesByRefDataSourceTypeId = id => db.refDataSource.findByTypeId(id)
}

module.exports = RefDataSourceService
