export class ReferentialIntegrityService {
    getById(id, entity, optionalTransaction){
        if (optionalTransaction) {
            return entity.findTx(optionalTransaction, id)
        } else {
            return entity.find(id)
        }
    }

    getByBusinessKey(keys, entity, optionalTransaction){
        if (optionalTransaction) {
            return entity.findByBusinessKeyTx(optionalTransaction, keys)
        } else {
            return entity.findByBusinessKey(keys)
        }
    }
}

module.exports = ReferentialIntegrityService