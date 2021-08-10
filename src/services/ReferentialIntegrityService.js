const { setErrorCode } = require('@monsantoit/error-decorator')()

// Error Codes 1NXXXX
class ReferentialIntegrityService {
  @setErrorCode('1N1000')
  getById = (id, entity) => entity.find(id)

  @setErrorCode('1N2000')
  getByBusinessKey = (keys, entity) => entity.findByBusinessKey(keys)

  @setErrorCode('1N3000')
  getEntitiesByKeys = (businessKeyObjects, entity) =>
    entity.batchFindByBusinessKey(businessKeyObjects)

  @setErrorCode('1N4000')
  getEntitiesByIds = (ids, entity) => entity.batchFind(ids)
}

module.exports = ReferentialIntegrityService
