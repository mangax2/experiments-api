export class ReferentialIntegrityService {
    getById(id, entity){
        return entity.find(id)
    }

    getByBusinessKey(keys, entity){
        return entity.findByBusinessKey(keys)
    }
}

module.exports = ReferentialIntegrityService