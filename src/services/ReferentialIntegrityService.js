class ReferentialIntegrityService {
  getById = (id, entity, tx) => entity.find(id, tx)

  getByBusinessKey = (keys, entity, tx) => entity.findByBusinessKey(keys, tx)

  getEntitiesByKeys = (businessKeyObjects, entity, tx) =>
    entity.batchFindByBusinessKey(businessKeyObjects, tx)

  getEntitiesByIds = (ids, entity, tx) => entity.batchFind(ids, tx)
}

module.exports = ReferentialIntegrityService
