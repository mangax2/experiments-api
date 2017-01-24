export class ReferentialIntegrityService {
    getById(id, entity, tx){
        return entity.find(id, tx)
    }

    getByBusinessKey(keys, entity, tx){
        return entity.findByBusinessKey(keys, tx)
    }

    getEntitiesByKeys(businessKeyObjects, entity, tx) {
        return entity.batchFindByBusinessKey(businessKeyObjects, tx)
    }


    getEntitiesByIds(ids, entity, tx) {
        return entity.batchFind(ids, tx)
    }

}

module.exports = ReferentialIntegrityService