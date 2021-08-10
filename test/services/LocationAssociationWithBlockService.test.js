import { mockResolve } from '../jestUtil'
import LocationAssociationWithBlockService from '../../src/services/LocationAssociationWithBlockService'
import { dbRead } from '../../src/db/DbManager'

describe('LocationAssociationWithBlockService', () => {
  let target
  const experimentId = 1232
  const setId = 345
  const locationAssociation = { location: 1, set_id: setId, block_id: 123 }
  const locationAssociationWithDifferentBlock = { location: 2, set_id: 4, block_id: 456 }
  const locationAssociationWithSameBlock = { location: 2, set_id: 4, block_id: 123 }
  const block1 = { id: 123, experiment_id: experimentId, name: 'block123' }
  const block2 = { id: 456, experiment_id: experimentId, name: 'block456' }

  beforeEach(() => {
    target = new LocationAssociationWithBlockService()
  })

  describe('getByExperimentId', () => {
    test('returns no locationAssociations', () => {
      dbRead.locationAssociation.findByExperimentId = mockResolve([])

      return target.getByExperimentId(experimentId).then((data) => {
        expect(dbRead.locationAssociation.findByExperimentId).toHaveBeenCalledWith(experimentId)
        expect(data).toEqual([])
      })
    })

    test('returns a list of one locationAssociation with block info', () => {
      dbRead.locationAssociation.findByExperimentId = mockResolve([locationAssociation])
      dbRead.block.batchFind = mockResolve([block1])

      return target.getByExperimentId(experimentId).then((data) => {
        expect(dbRead.locationAssociation.findByExperimentId).toHaveBeenCalledWith(experimentId)
        expect(dbRead.block.batchFind).toHaveBeenCalledWith([block1.id])
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
      dbRead.locationAssociation.findByExperimentId = mockResolve([locationAssociation, locationAssociationWithDifferentBlock])
      dbRead.block.batchFind = mockResolve([block1, block2])

      return target.getByExperimentId(experimentId).then((data) => {
        expect(dbRead.locationAssociation.findByExperimentId).toHaveBeenCalledWith(experimentId)
        expect(dbRead.block.batchFind).toHaveBeenCalledWith([block1.id, block2.id])
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
      dbRead.locationAssociation.findByExperimentId = mockResolve([locationAssociation, locationAssociationWithSameBlock])
      dbRead.block.batchFind = mockResolve([block1])

      return target.getByExperimentId(experimentId).then((data) => {
        expect(dbRead.locationAssociation.findByExperimentId).toHaveBeenCalledWith(experimentId)
        expect(dbRead.block.batchFind).toHaveBeenCalledWith([block1.id])
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
      dbRead.locationAssociation.findBySetId = mockResolve(null)

      return target.getBySetId(setId).then((data) => {
        expect(dbRead.locationAssociation.findBySetId).toHaveBeenCalledWith(setId)
        expect(data).toEqual(null)
      })
    })

    test('returns a locationAssociation with block info', () => {
      dbRead.locationAssociation.findBySetId = mockResolve(locationAssociation)
      dbRead.block.findByBlockId = mockResolve(block1)

      return target.getBySetId(setId).then((data) => {
        expect(dbRead.locationAssociation.findBySetId).toHaveBeenCalledWith(setId)
        expect(dbRead.block.findByBlockId).toHaveBeenCalledWith(block1.id)
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
