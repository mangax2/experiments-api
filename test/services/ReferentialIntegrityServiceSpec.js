import ReferentialIntegrityService from '../../src/services/ReferentialIntegrityService'

describe('ReferentialIntegrityService', () => {
  const RIService = new ReferentialIntegrityService()

  const entity = {
    find(id){
      return new Promise((resolve) => {
        resolve(1)
      })
    },
    findByBusinessKey(keys){
      return new Promise((resolve) => {
        resolve(2)
      })
    },
    batchFindByBusinessKey(keys){
      return new Promise((resolve) => {
        resolve(3)
      })
    },

    batchFind(keys){
      return new Promise((resolve) => {
        resolve(4)
      })
    },

  }
  it('resolves a value when getById is called', () => {
    return RIService.getById(1, entity).then((data) => {
      data.should.equal(1)
    })
  })

  it('resolves a value when getByBusinessKey is called', () => {
    return RIService.getByBusinessKey([], entity).then((data) => {
      data.should.equal(2)
    })
  })

  it('resolves a value when batchFindByBusinessKey is called', () => {
    return RIService.getEntitiesByKeys([], entity).then((data) => {
      data.should.equal(3)
    })
  })

  it('resolves a value when batchFind is called', () => {
    return RIService.getEntitiesByIds([], entity).then((data) => {
      data.should.equal(4)
    })
  })

})