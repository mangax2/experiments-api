import { mock, mockReject, mockResolve } from '../jestUtil'
import GroupExperimentalUnitCompositeService from '../../src/services/GroupExperimentalUnitCompositeService'
import AppError from '../../src/services/utility/AppError'
import AppUtil from '../../src/services/utility/AppUtil'
import db from '../../src/db/DbManager'

describe('GroupExperimentalUnitCompositeService', () => {
  let target
  const testContext = {}
  const testTx = { tx: {} }

  beforeEach(() => {
    target = new GroupExperimentalUnitCompositeService()
  })

  describe('saveDesignSpecsAndGroupUnitDetails', () => {
    it('saves design specifications, groups, and units', () => {
      target.designSpecificationDetailService = {
        manageAllDesignSpecificationDetails: mockResolve(),
      }
      target.saveGroupAndUnitDetails = mockResolve()
      AppUtil.createCompositePostResponse = mock()

      const designSpecsAndGroupAndUnitDetails = {
        designSpecifications: [],
        groupAndUnitDetails: [],
      }

      return target.saveDesignSpecsAndGroupUnitDetails(1, designSpecsAndGroupAndUnitDetails, testContext, testTx).then(() => {
        expect(target.saveGroupAndUnitDetails).toHaveBeenCalledWith(1, [], testContext, testTx)
        expect(target.designSpecificationDetailService.manageAllDesignSpecificationDetails).toHaveBeenCalledWith([], 1, testContext, testTx)
        expect(AppUtil.createCompositePostResponse).toHaveBeenCalled()
      })
    })

    it('rejects when group and units call fails', () => {
      target.designSpecificationDetailService = {
        manageAllDesignSpecificationDetails: mockResolve(),
      }
      target.saveGroupAndUnitDetails = mockReject('error')
      AppUtil.createCompositePostResponse = mock()

      const designSpecsAndGroupAndUnitDetails = {
        designSpecifications: [],
        groupAndUnitDetails: [],
      }

      return target.saveDesignSpecsAndGroupUnitDetails(1, designSpecsAndGroupAndUnitDetails, testContext, testTx).then(() => {}, (err) => {
        expect(target.saveGroupAndUnitDetails).toHaveBeenCalledWith(1, [], testContext, testTx)
        expect(target.designSpecificationDetailService.manageAllDesignSpecificationDetails).toHaveBeenCalledWith([], 1, testContext, testTx)
        expect(AppUtil.createCompositePostResponse).not.toHaveBeenCalled()
        expect(err).toEqual('error')
      })
    })

    it('rejects when design specification call fails', () => {
      target.designSpecificationDetailService = {
        manageAllDesignSpecificationDetails: mockReject('error'),
      }
      target.saveGroupAndUnitDetails = mockResolve()
      AppUtil.createCompositePostResponse = mock()

      const designSpecsAndGroupAndUnitDetails = {
        designSpecifications: [],
        groupAndUnitDetails: [],
      }

      return target.saveDesignSpecsAndGroupUnitDetails(1, designSpecsAndGroupAndUnitDetails, testContext, testTx).then(() => {}, (err) => {
        expect(target.saveGroupAndUnitDetails).toHaveBeenCalledWith(1, [], testContext, testTx)
        expect(target.designSpecificationDetailService.manageAllDesignSpecificationDetails).toHaveBeenCalledWith([], 1, testContext, testTx)
        expect(AppUtil.createCompositePostResponse).not.toHaveBeenCalled()
        expect(err).toEqual('error')
      })
    })

    it('throws a bad request when passed in object is null', () => {
      AppError.badRequest = mock('')

      const designSpecsAndGroupAndUnitDetails = null
      expect(() => target.saveDesignSpecsAndGroupUnitDetails(1, designSpecsAndGroupAndUnitDetails, testContext, testTx)).toThrow()
    })
  })

  describe('saveGroupAndUnitDetails', () => {
    it('saves groups and units', () => {
      target.securityService.permissionsCheck = mockResolve()
      target.validateGroups = mock(undefined)
      target.groupService.deleteGroupsForExperimentId = mockResolve()
      target.recursiveBatchCreate = mockResolve()
      AppUtil.createCompositePostResponse = mock()

      return target.saveGroupAndUnitDetails(1, [{}], testContext, testTx).then(() => {
        expect(target.validateGroups).toHaveBeenCalledWith([{}])

        expect(target.securityService.permissionsCheck).toHaveBeenCalledWith(1, testContext, testTx)
        expect(target.groupService.deleteGroupsForExperimentId).toHaveBeenCalledWith(1, testTx)
        expect(target.recursiveBatchCreate).toHaveBeenCalledWith(1, [{}], testContext, testTx)
        expect(AppUtil.createCompositePostResponse).toHaveBeenCalled()
      })
    })

    it('rejects when recursiveBatchCreate fails', () => {
      target.securityService.permissionsCheck = mockResolve()
      target.validateGroups = mock(undefined)
      target.groupService.deleteGroupsForExperimentId = mockResolve()
      target.recursiveBatchCreate = mockReject('error')

      return target.saveGroupAndUnitDetails(1, [{}], testContext, testTx).then(() => {}, (err) => {
        expect(target.securityService.permissionsCheck).toHaveBeenCalledWith(1, testContext, testTx)
        expect(target.validateGroups).toHaveBeenCalledWith([{}])
        expect(target.groupService.deleteGroupsForExperimentId).toHaveBeenCalledWith(1, testTx)
        expect(target.recursiveBatchCreate).toHaveBeenCalledWith(1, [{}], testContext, testTx)
        expect(err).toEqual('error')
      })
    })

    it('rejects when deleteGroupsForExperimentId fails', () => {
      target.securityService.permissionsCheck = mockResolve()
      target.validateGroups = mock(undefined)
      target.groupService.deleteGroupsForExperimentId = mockReject('error')
      target.recursiveBatchCreate = mockReject('error')

      return target.saveGroupAndUnitDetails(1, [{}], testContext, testTx).then(() => {}, (err) => {
        expect(target.securityService.permissionsCheck).toHaveBeenCalledWith(1, testContext, testTx)
        expect(target.validateGroups).toHaveBeenCalledWith([{}])
        expect(target.groupService.deleteGroupsForExperimentId).toHaveBeenCalledWith(1, testTx)
        expect(target.recursiveBatchCreate).not.toHaveBeenCalled()
        expect(err).toEqual('error')
      })
    })

    it('throws an error when there are group validation errors', () => {
      target.securityService.permissionsCheck = mockResolve()
      target.validateGroups = mock('error!')
      AppError.badRequest = mock('')
      target.groupService.deleteGroupsForExperimentId = mock()

      return target.saveGroupAndUnitDetails(1, [{}], testContext, testTx).then(() => {}, (err) => {
        expect(target.securityService.permissionsCheck).toHaveBeenCalledWith(1, testContext, testTx)
        expect(target.validateGroups).toHaveBeenCalledWith([{}])
        expect(target.groupService.deleteGroupsForExperimentId).not.toHaveBeenCalled()
        expect(err).toEqual('')
      })

    })
  })

  describe('recursiveBatchCreate', () => {
    it('calls batchCreateGroups and createGroupValuesUnitsAndChildGroups', () => {
      const groupUnitDetails = [{}, {}]
      target.groupService.batchCreateGroups = mockResolve([{}, {}, {}])
      target.createGroupValuesUnitsAndChildGroups = mockResolve()

      return target.recursiveBatchCreate(1, groupUnitDetails, testContext, testTx).then(() => {
        expect(target.groupService.batchCreateGroups).toHaveBeenCalledWith([{ experimentId: 1 }, { experimentId: 1 }], testContext, testTx)
        expect(target.createGroupValuesUnitsAndChildGroups).toHaveBeenCalledWith(1, [{}, {}, {}], [{ experimentId: 1 }, { experimentId: 1 }], testContext, testTx)
      })
    })

    it('rejects when createGroupValuesUnitsAndChildGroups fails', () => {
      const groupUnitDetails = [{}, {}]
      target.groupService.batchCreateGroups = mockResolve([{}, {}, {}])
      target.createGroupValuesUnitsAndChildGroups = mockReject('error')

      return target.recursiveBatchCreate(1, groupUnitDetails, testContext, testTx).then(() => {}, (err) => {
        expect(target.groupService.batchCreateGroups).toHaveBeenCalledWith([{ experimentId: 1 }, { experimentId: 1 }], testContext, testTx)
        expect(target.createGroupValuesUnitsAndChildGroups).toHaveBeenCalledWith(1, [{}, {}, {}], [{ experimentId: 1 }, { experimentId: 1 }], testContext, testTx)
        expect(err).toEqual('error')
      })
    })

    it('rejects when batchCreateGroups fails', () => {
      const groupUnitDetails = [{}, {}]
      target.groupService.batchCreateGroups = mockReject('error')
      target.createGroupValuesUnitsAndChildGroups = mockReject('error')

      return target.recursiveBatchCreate(1, groupUnitDetails, testContext, testTx).then(() => {}, (err) => {
        expect(target.groupService.batchCreateGroups).toHaveBeenCalledWith([{ experimentId: 1 }, { experimentId: 1 }], testContext, testTx)
        expect(target.createGroupValuesUnitsAndChildGroups).not.toHaveBeenCalled()
        expect(err).toEqual('error')
      })
    })
  })

  describe('createGroupValuesUnitsAndChildGroups', () => {
    it('calls batchCreateGroupValues, createExperimentalUnits, and recursiveBatchCreate', () => {
      target.getUnitsAndGroupValues = mock({ groupValues: [{}], units: [{}], childGroups: [{}] })
      target.groupValueService.batchCreateGroupValues = mockResolve()
      target.createExperimentalUnits = mockResolve()
      target.recursiveBatchCreate = mockResolve()

      return target.createGroupValuesUnitsAndChildGroups(1, [{}], [{}], testContext, testTx).then(() => {
        expect(target.getUnitsAndGroupValues).toHaveBeenCalledWith([{}], [{}])
        expect(target.groupValueService.batchCreateGroupValues).toHaveBeenCalledWith([{}], testContext, testTx)
        expect(target.createExperimentalUnits).toHaveBeenCalledWith(1, [{}], testContext, testTx)
        expect(target.recursiveBatchCreate).toHaveBeenCalledWith(1, [{}], testContext, testTx)

      })
    })

    it('rejects when recursiveBatchCreate fails', () => {
      target.getUnitsAndGroupValues = mock({ groupValues: [{}], units: [{}], childGroups: [{}] })
      target.groupValueService.batchCreateGroupValues = mockResolve()
      target.createExperimentalUnits = mockResolve()
      target.recursiveBatchCreate = mockReject('error')

      return target.createGroupValuesUnitsAndChildGroups(1, [{}], [{}], testContext, testTx).then(() => {}, (err) => {
        expect(target.getUnitsAndGroupValues).toHaveBeenCalledWith([{}], [{}])
        expect(target.groupValueService.batchCreateGroupValues).toHaveBeenCalledWith([{}], testContext, testTx)
        expect(target.createExperimentalUnits).toHaveBeenCalledWith(1, [{}], testContext, testTx)
        expect(target.recursiveBatchCreate).toHaveBeenCalledWith(1, [{}], testContext, testTx)
        expect(err).toEqual('error')
      })
    })

    it('rejects when createExperimentalUnits fails', () => {
      target.getUnitsAndGroupValues = mock({ groupValues: [{}], units: [{}], childGroups: [{}] })
      target.groupValueService.batchCreateGroupValues = mockResolve()
      target.createExperimentalUnits = mockReject('error')
      target.recursiveBatchCreate = mockResolve()

      return target.createGroupValuesUnitsAndChildGroups(1, [{}], [{}], testContext, testTx).then(() => {}, (err) => {
        expect(target.getUnitsAndGroupValues).toHaveBeenCalledWith([{}], [{}])
        expect(target.groupValueService.batchCreateGroupValues).toHaveBeenCalledWith([{}], testContext, testTx)
        expect(target.createExperimentalUnits).toHaveBeenCalledWith(1, [{}], testContext, testTx)
        expect(target.recursiveBatchCreate).toHaveBeenCalledWith(1, [{}], testContext, testTx)
        expect(err).toEqual('error')
      })
    })

    it('rejects when batchCreateGroupValues fails', () => {
      target.getUnitsAndGroupValues = mock({ groupValues: [{}], units: [{}], childGroups: [{}] })
      target.groupValueService.batchCreateGroupValues = mockReject('error')
      target.createExperimentalUnits = mockResolve()
      target.recursiveBatchCreate = mockResolve()

      return target.createGroupValuesUnitsAndChildGroups(1, [{}], [{}], testContext, testTx).then(() => {}, (err) => {
        expect(target.getUnitsAndGroupValues).toHaveBeenCalledWith([{}], [{}])
        expect(target.groupValueService.batchCreateGroupValues).toHaveBeenCalledWith([{}], testContext, testTx)
        expect(target.createExperimentalUnits).toHaveBeenCalledWith(1, [{}], testContext, testTx)
        expect(target.recursiveBatchCreate).toHaveBeenCalledWith(1, [{}], testContext, testTx)
        expect(err).toEqual('error')
      })
    })

    it('only calls recursiveBatchCreate', () => {
      target.getUnitsAndGroupValues = mock({ groupValues: [], units: [], childGroups: [{}] })
      target.groupValueService.batchCreateGroupValues = mockResolve()
      target.createExperimentalUnits = mockResolve()
      target.recursiveBatchCreate = mockResolve()

      return target.createGroupValuesUnitsAndChildGroups(1, [{}], [{}], testContext, testTx).then(() => {
        expect(target.getUnitsAndGroupValues).toHaveBeenCalledWith([{}], [{}])
        expect(target.groupValueService.batchCreateGroupValues).not.toHaveBeenCalled()
        expect(target.createExperimentalUnits).not.toHaveBeenCalled()
        expect(target.recursiveBatchCreate).toHaveBeenCalledWith(1, [{}], testContext, testTx)

      })
    })

    it('only calls createExperimentalUnits', () => {
      target.getUnitsAndGroupValues = mock({ groupValues: [], units: [{}], childGroups: [] })
      target.groupValueService.batchCreateGroupValues = mockResolve()
      target.createExperimentalUnits = mockResolve()
      target.recursiveBatchCreate = mockResolve()

      return target.createGroupValuesUnitsAndChildGroups(1, [{}], [{}], testContext, testTx).then(() => {
        expect(target.getUnitsAndGroupValues).toHaveBeenCalledWith([{}], [{}])
        expect(target.groupValueService.batchCreateGroupValues).not.toHaveBeenCalled()
        expect(target.createExperimentalUnits).toHaveBeenCalledWith(1, [{}], testContext, testTx)
        expect(target.recursiveBatchCreate).not.toHaveBeenCalled()
      })
    })

    it('only calls batchCreateGroupValues', () => {
      target.getUnitsAndGroupValues = mock({ groupValues: [{}], units: [], childGroups: [] })
      target.groupValueService.batchCreateGroupValues = mockResolve()
      target.createExperimentalUnits = mockResolve()
      target.recursiveBatchCreate = mockResolve()

      return target.createGroupValuesUnitsAndChildGroups(1, [{}], [{}], testContext, testTx).then(() => {
        expect(target.getUnitsAndGroupValues).toHaveBeenCalledWith([{}], [{}])
        expect(target.groupValueService.batchCreateGroupValues).toHaveBeenCalledWith([{}], testContext, testTx)
        expect(target.createExperimentalUnits).not.toHaveBeenCalled()
        expect(target.recursiveBatchCreate).not.toHaveBeenCalled()
      })
    })
  })

  describe('getUnitsAndGroupValues', () => {
    it('returns an object of units, groupValues, and childGroups', () => {
      const groupResp = [{ id: 1 }, { id: 2 }]
      const updatedGroupAndUnitDetails = [{
        units: [{}],
        groupValues: [{}],
        childGroups: [{}],
      }, { units: [], groupValues: [{}], childGroups: [{}] }]
      const expectedResult = { units: [{}], groupValues: [{}, {}], childGroups: [{}, {}] }

      target.assignGroupIdToGroupValuesAndUnits = mock(updatedGroupAndUnitDetails)

      const result = target.getUnitsAndGroupValues(groupResp, [{}])
      expect(result).toEqual(expectedResult)
      expect(target.assignGroupIdToGroupValuesAndUnits).toHaveBeenCalledWith([{}], [1, 2])
    })
  })

  describe('createExperimentalUnits', () => {
    it('batch creates experimental units', () => {
      db.treatment.getDistinctExperimentIds = mockResolve([{ experiment_id: 1 }])
      target.experimentalUnitService.batchCreateExperimentalUnits = mockResolve([1])

      return target.createExperimentalUnits(1, [{ treatmentId: 1 }], testContext, testTx).then((data) => {
        expect(db.treatment.getDistinctExperimentIds).toHaveBeenCalledWith([1], testTx)
        expect(target.experimentalUnitService.batchCreateExperimentalUnits).toHaveBeenCalledWith([{ treatmentId: 1 }], testContext, testTx)
        expect(data).toEqual([1])
      })
    })

    it('rejects when batchCreate fails', () => {
      db.treatment.getDistinctExperimentIds = mockResolve([{ experiment_id: 1 }])
      target.experimentalUnitService.batchCreateExperimentalUnits = mockReject('error')

      return target.createExperimentalUnits(1, [{ treatmentId: 1 }], testContext, testTx).then(() => {}, (err) => {
        expect(db.treatment.getDistinctExperimentIds).toHaveBeenCalledWith([1], testTx)
        expect(target.experimentalUnitService.batchCreateExperimentalUnits).toHaveBeenCalledWith([{ treatmentId: 1 }], testContext, testTx)
        expect(err).toEqual('error')
      })
    })

    it('rejects when getDistinctExperimentIds fails', () => {
      db.treatment.getDistinctExperimentIds = mockReject('error')
      target.experimentalUnitService.batchCreateExperimentalUnits = mockResolve([1])

      return target.createExperimentalUnits(1, [{ treatmentId: 1 }], testContext, testTx).then(() => {}, (err) => {
        expect(db.treatment.getDistinctExperimentIds).toHaveBeenCalledWith([1], testTx)
        expect(target.experimentalUnitService.batchCreateExperimentalUnits).not.toHaveBeenCalled()
        expect(err).toEqual('error')
      })
    })

    it('throws an error when there are multiple experiment ids returned', () => {
      db.treatment.getDistinctExperimentIds = mockResolve([{ experiment_id: 1 }, { experiment_id: 2 }])
      target.experimentalUnitService.batchCreateExperimentalUnits = mockResolve([1])
      AppError.badRequest = mock()

      return target.createExperimentalUnits(1, [{ treatmentId: 1 }], testContext, testTx).then(() => {}, () => {
        expect(db.treatment.getDistinctExperimentIds).toHaveBeenCalledWith([1], testTx)
        expect(target.experimentalUnitService.batchCreateExperimentalUnits).not.toHaveBeenCalled()
        expect(AppError.badRequest).toHaveBeenCalledWith('Treatments not associated with same' +
          ' experiment')
      })
    })

    it('throws an error when there are returned distinct experiment id does not match passed in', () => {
      db.treatment.getDistinctExperimentIds = mockResolve([{ experiment_id: 2 }])
      target.experimentalUnitService.batchCreateExperimentalUnits = mockResolve([1])
      AppError.badRequest = mock()

      return target.createExperimentalUnits(1, [{ treatmentId: 1 }], testContext, testTx).then(() => {}, () => {
        expect(db.treatment.getDistinctExperimentIds).toHaveBeenCalledWith([1], testTx)
        expect(target.experimentalUnitService.batchCreateExperimentalUnits).not.toHaveBeenCalled()
        expect(AppError.badRequest).toHaveBeenCalledWith('Treatments not associated with same' +
          ' experiment')
      })
    })
  })

  describe('validateGroups', () => {
    it('returns undefined when no groups are passed in', () => {
      expect(target.validateGroups([])).toEqual(undefined)
    })

    it('returns undefined when groups have no issues', () => {
      target.validateGroup = mock()
      expect(target.validateGroups([{}])).toEqual(undefined)
    })

    it('calls validateGroup only once for multiple groups when an earlier one has an error', () => {
      target.validateGroup = mock('error!')
      expect(target.validateGroups([{}, {}])).toEqual('error!')
      expect(target.validateGroup).toHaveBeenCalledTimes(1)
    })
  })

  describe('validateGroup', () => {
    it('returns undefined when no errors are in the group', () => {
      const group = { units: [], childGroups: [{}] }
      target.validateGroups = mock()

      expect(target.validateGroup(group)).toEqual(undefined)
      expect(target.validateGroups).toHaveBeenCalledWith([{}])
    })

    it('returns an error from validateGroups', () => {
      const group = { units: [], childGroups: [{}] }
      target.validateGroups = mock('error!')

      expect(target.validateGroup(group)).toEqual('error!')
      expect(target.validateGroups).toHaveBeenCalledWith([{}])
    })

    it('returns an error due to units and childGroups being empty', () => {
      const group = { units: [], childGroups: [] }
      target.validateGroups = mock()

      expect(target.validateGroup(group)).toEqual('Each group should have at least one unit or' +
        ' at least one child group')
      expect(target.validateGroups).not.toHaveBeenCalled()
    })

    it('returns an error when units and child groups are populated', () => {
      const group = { units: [{}], childGroups: [{}] }
      target.validateGroups = mock()

      expect(target.validateGroup(group)).toEqual('Only leaf child groups should have units')
      expect(target.validateGroups).not.toHaveBeenCalled()
    })

    it('returns no error when there are just units', () => {
      const group = { units: [{}], childGroups: [] }
      target.validateGroups = mock()

      expect(target.validateGroup(group)).toEqual(undefined)
      expect(target.validateGroups).not.toHaveBeenCalled()
    })

    it('defaults units and child groups to empty arrays if they are not present', () => {
      const group = {}
      target.validateGroups = mock()

      expect(target.validateGroup(group)).toEqual('Each group should have at least one unit or' +
        ' at least one child group')
      expect(target.validateGroups).not.toHaveBeenCalled()
    })
  })

  describe('assignGroupIdToGroupValuesAndUnits', () => {
    it('returns group and unit details', () => {
      const groupAndUnitDetails = [{ groupValues: [{}], units: [{}], childGroups: [{}] }]
      const expectedResult = [{
        groupValues: [{ groupId: 1 }],
        units: [{ groupId: 1 }],
        childGroups: [{ parentId: 1 }],
      }]

      expect(target.assignGroupIdToGroupValuesAndUnits(groupAndUnitDetails, [1])).toEqual(expectedResult)
    })

    it('returns group and unit details for multiple groups', () => {
      const groupAndUnitDetails = [
        { groupValues: [{}], units: [{}], childGroups: [{}] },
        { groupValues: [{}], units: [{}], childGroups: [{}] },
      ]
      const expectedResult = [{
        groupValues: [{ groupId: 1 }],
        units: [{ groupId: 1 }],
        childGroups: [{ parentId: 1 }],
      }, {
        groupValues: [{ groupId: 2 }],
        units: [{ groupId: 2 }],
        childGroups: [{ parentId: 2 }],
      },
      ]

      expect(target.assignGroupIdToGroupValuesAndUnits(groupAndUnitDetails, [1, 2])).toEqual(expectedResult)
    })
  })

  describe('getGroupAndUnitDetails', () => {
    it('returns an empty array if groupIds are empty', () => {
      target.groupService.getGroupsByExperimentId = mockResolve([])

      return target.getGroupAndUnitDetails(1, testTx).then((data) => {
        expect(target.groupService.getGroupsByExperimentId).toHaveBeenCalledWith(1, testTx)
        expect(data).toEqual([])
      })
    })

    it('returns a list of groups with groupValues and units', () => {
      const groups = [{ id: 1 }, { id: 2 }]
      const groupValues = [{ group_id: 1, value: 'testValue' }, {
        group_id: 2,
        value: 'testValue2',
      }]
      const units = [{ group_id: 1 }, { group_id: 2 }]
      const expectedResult = [
        { id: 1, groupValues: [{ group_id: 1, value: 'testValue' }], units: [{ group_id: 1 }] },
        { id: 2, groupValues: [{ group_id: 2, value: 'testValue2' }], units: [{ group_id: 2 }] },
      ]

      target.groupService.getGroupsByExperimentId = mockResolve(groups)
      target.groupValueService.batchGetGroupValuesByGroupIdsNoValidate = mockResolve(groupValues)
      target.experimentalUnitService.batchGetExperimentalUnitsByGroupIdsNoValidate = mockResolve(units)

      return target.getGroupAndUnitDetails(1, testTx).then((data) => {
        expect(target.groupService.getGroupsByExperimentId).toHaveBeenCalledWith(1, testTx)
        expect(target.groupValueService.batchGetGroupValuesByGroupIdsNoValidate).toHaveBeenCalledWith([1, 2], testTx)
        expect(target.experimentalUnitService.batchGetExperimentalUnitsByGroupIdsNoValidate).toHaveBeenCalledWith([1, 2], testTx)
        expect(data).toEqual(expectedResult)
      })
    })

    it('rejects when batchGetExperimentalUnitsByGroupIdsNoValidate fails', () => {
      target.groupService.getGroupsByExperimentId = mockResolve([{ id: 1 }])
      target.groupValueService.batchGetGroupValuesByGroupIdsNoValidate = mockResolve()
      target.experimentalUnitService.batchGetExperimentalUnitsByGroupIdsNoValidate = mockReject('error')

      return target.getGroupAndUnitDetails(1, testTx).then(() => {}, (err) => {
        expect(target.groupService.getGroupsByExperimentId).toHaveBeenCalledWith(1, testTx)
        expect(target.groupValueService.batchGetGroupValuesByGroupIdsNoValidate).toHaveBeenCalledWith([1], testTx)
        expect(target.experimentalUnitService.batchGetExperimentalUnitsByGroupIdsNoValidate).toHaveBeenCalledWith([1], testTx)
        expect(err).toEqual('error')
      })
    })

    it('rejects when batchGetGroupValuesByGroupIdsNoValidate fails', () => {
      target.groupService.getGroupsByExperimentId = mockResolve([{ id: 1 }])
      target.groupValueService.batchGetGroupValuesByGroupIdsNoValidate = mockReject('error')
      target.experimentalUnitService.batchGetExperimentalUnitsByGroupIdsNoValidate = mock()

      return target.getGroupAndUnitDetails(1, testTx).then(() => {}, (err) => {
        expect(target.groupService.getGroupsByExperimentId).toHaveBeenCalledWith(1, testTx)
        expect(target.groupValueService.batchGetGroupValuesByGroupIdsNoValidate).toHaveBeenCalledWith([1], testTx)
        expect(target.experimentalUnitService.batchGetExperimentalUnitsByGroupIdsNoValidate).toHaveBeenCalled()
        expect(err).toEqual('error')
      })
    })

    it('rejects when getGroupsByExperimentId fails', () => {
      target.groupService.getGroupsByExperimentId = mockReject('error')

      return target.getGroupAndUnitDetails(1, testTx).then(() => {}, (err) => {
        expect(target.groupService.getGroupsByExperimentId).toHaveBeenCalledWith(1, testTx)
        expect(err).toEqual('error')
      })
    })
  })
})