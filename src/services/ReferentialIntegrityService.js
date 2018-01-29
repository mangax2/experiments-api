import setErrorDecorator from '../decorators/setErrorDecorator'

const { setErrorCode } = setErrorDecorator()

class ReferentialIntegrityService {
  @setErrorCode('1N1000')
  getById = (id, entity, tx) => entity.find(id, tx)

  @setErrorCode('1N2000')
  getByBusinessKey = (keys, entity, tx) => entity.findByBusinessKey(keys, tx)

  @setErrorCode('1N3000')
  getEntitiesByKeys = (businessKeyObjects, entity, tx) =>
    entity.batchFindByBusinessKey(businessKeyObjects, tx)

  @setErrorCode('1N4000')
  getEntitiesByIds = (ids, entity, tx) => entity.batchFind(ids, tx)
}

module.exports = ReferentialIntegrityService
