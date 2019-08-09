import { mockResolve } from '../jestUtil'
import LocationAssociationWithBlockService from '../../src/services/LocationAssociationWithBlockService'
import db from '../../src/db/DbManager'

describe('LocationAssociationWithBlockService', () => {
  let target
  const testTx = { tx: {}, batch: promises => Promise.all(promises) }
  const experimentId = 1232
  const setId = 345
  const locationAssociation = { location: 1, set_id: setId, block_id: 123 }
  const locationAssociationWithDifferentBlock = { location: 2, set_id: 4, block_id: 456 }
  const locationAssociationWithSameBlock = { location: 2, set_id: 4, block_id: 123 }
  const block1 = { id: 123, experiment_id: experimentId, name: 'block123' }
  const block2 = { id: 456, experiment_id: experimentId, name: 'block456' }

  beforeEach(() => {
    expect.hasAssertions()
    target = new LocationAssociationWithBlockService()
  })

  describe('getByExperimentId', () => {
    test('returns no locationAssociations', () => {
      db.locationAssociation.findByExperimentId = mockResolve([])

      return target.getByExperimentId(experimentId, testTx).then((data) => {
        expect(db.locationAssociation.findByExperimentId).toHaveBeenCalledWith(experimentId, testTx)
        expect(data).toEqual([])
      })
    })

    test('returns a list of one locationAssociation with block info', () => {
      db.locationAssociation.findByExperimentId = mockResolve([locationAssociation])
      db.block.batchFindByBlockIds = mockResolve([block1])

      return target.getByExperimentId(experimentId, testTx).then((data) => {
        expect(db.locationAssociation.findByExperimentId).toHaveBeenCalledWith(experimentId, testTx)
        expect(db.block.batchFindByBlockIds).toHaveBeenCalledWith([block1.id], testTx)
        expect(data).toEqual([{
          location: locationAssociation.location,
          set_id: locationAssociation.set_id,
          experiment_id: experimentId,
          block: block1.name,
          block_id: block1.id,
        }])
      })
    })

    test('returns multiple locationAssociations with different block info', () => {
      db.locationAssociation.findByExperimentId = mockResolve([locationAssociation, locationAssociationWithDifferentBlock])
      db.block.batchFindByBlockIds = mockResolve([block1, block2])

      return target.getByExperimentId(experimentId, testTx).then((data) => {
        expect(db.locationAssociation.findByExperimentId).toHaveBeenCalledWith(experimentId, testTx)
        expect(db.block.batchFindByBlockIds).toHaveBeenCalledWith([block1.id, block2.id], testTx)
        expect(data).toEqual([{
          location: locationAssociation.location,
          set_id: locationAssociation.set_id,
          experiment_id: experimentId,
          block: block1.name,
          block_id: block1.id,
        }, {
          location: locationAssociationWithDifferentBlock.location,
          set_id: locationAssociationWithDifferentBlock.set_id,
          experiment_id: experimentId,
          block: block2.name,
          block_id: block2.id,
        }])
      })
    })

    test('returns multiple locationAssociations with the same block info', () => {
      db.locationAssociation.findByExperimentId = mockResolve([locationAssociation, locationAssociationWithSameBlock])
      db.block.batchFindByBlockIds = mockResolve([block1])

      return target.getByExperimentId(experimentId, testTx).then((data) => {
        expect(db.locationAssociation.findByExperimentId).toHaveBeenCalledWith(experimentId, testTx)
        expect(db.block.batchFindByBlockIds).toHaveBeenCalledWith([block1.id], testTx)
        expect(data).toEqual([{
          location: locationAssociation.location,
          set_id: locationAssociation.set_id,
          experiment_id: experimentId,
          block: block1.name,
          block_id: block1.id,
        }, {
          location: locationAssociationWithSameBlock.location,
          set_id: locationAssociationWithSameBlock.set_id,
          experiment_id: experimentId,
          block: block1.name,
          block_id: block1.id,
        }])
      })
    })
  })

  describe('getBySetId', () => {
    test('returns no locationAssociations', () => {
      db.locationAssociation.findBySetId = mockResolve(null)

      return target.getBySetId(setId, testTx).then((data) => {
        expect(db.locationAssociation.findBySetId).toHaveBeenCalledWith(setId, testTx)
        expect(data).toEqual(null)
      })
    })

    test('returns a locationAssociation with block info', () => {
      db.locationAssociation.findBySetId = mockResolve(locationAssociation)
      db.block.batchFindByBlockId = mockResolve(block1)

      return target.getBySetId(setId, testTx).then((data) => {
        expect(db.locationAssociation.findBySetId).toHaveBeenCalledWith(setId, testTx)
        expect(db.block.batchFindByBlockId).toHaveBeenCalledWith(block1.id, testTx)
        expect(data).toEqual({
          location: locationAssociation.location,
          set_id: locationAssociation.set_id,
          experiment_id: experimentId,
          block: block1.name,
          block_id: block1.id,
        })
      })
    })
  })
})
