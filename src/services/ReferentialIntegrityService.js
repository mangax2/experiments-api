export class ReferentialIntegrityService {
    getById(id, entity, tx){
        return entity.find(id, tx)
    }

    getByBusinessKey(keys, entity, tx){
        return entity.findByBusinessKey(keys, tx)
    }
}

module.exports = ReferentialIntegrityService