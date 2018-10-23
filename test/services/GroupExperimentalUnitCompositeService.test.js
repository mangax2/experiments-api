import {
  kafkaProducerMocker, mock, mockReject, mockResolve,
} from '../jestUtil'
import GroupExperimentalUnitCompositeService from '../../src/services/GroupExperimentalUnitCompositeService'
import AppError from '../../src/services/utility/AppError'
import AppUtil from '../../src/services/utility/AppUtil'
import db from '../../src/db/DbManager'
import AWSUtil from '../../src/services/utility/AWSUtil'
import HttpUtil from '../../src/services/utility/HttpUtil'
import PingUtil from '../../src/services/utility/PingUtil'
import cfServices from '../../src/services/utility/ServiceConfig'

describe('GroupExperimentalUnitCompositeService', () => {
  kafkaProducerMocker()

  let target
  const testContext = {}
  const testTx = { tx: {} }

  beforeEach(() => {
    expect.hasAssertions()
    target = new GroupExperimentalUnitCompositeService()
  })

  describe('saveDesignSpecsAndGroupUnitDetails', () => {
    test('saves design specifications, groups, and units', () => {
      target.designSpecificationDetailService = {
        manageAllDesignSpecificationDetails: mockResolve(),
      }
      target.saveGroupAndUnitDetails = mockResolve()
      AppUtil.createCompositePostResponse = mock()

      const designSpecsAndGroupAndUnitDetails = {
        designSpecifications: [],
        groupAndUnitDetails: [],
      }

      return target.saveDesignSpecsAndGroupUnitDetails(1, designSpecsAndGroupAndUnitDetails, testContext, false, testTx).then(() => {
        expect(target.saveGroupAndUnitDetails).toHaveBeenCalledWith(1, [], testContext, false, testTx)
        expect(target.designSpecificationDetailService.manageAllDesignSpecificationDetails).toHaveBeenCalledWith([], 1, testContext, false, testTx)
        expect(AppUtil.createCompositePostResponse).toHaveBeenCalled()
      })
    })

    test('rejects when group and units call fails', () => {
      const error = { message: 'error' }
      target.designSpecificationDetailService = {
        manageAllDesignSpecificationDetails: mockResolve(),
      }
      target.saveGroupAndUnitDetails = mockReject(error)
      AppUtil.createCompositePostResponse = mock()

      const designSpecsAndGroupAndUnitDetails = {
        designSpecifications: [],
        groupAndUnitDetails: [],
      }

      return target.saveDesignSpecsAndGroupUnitDetails(1, designSpecsAndGroupAndUnitDetails, testContext, false, testTx).then(() => {}, (err) => {
        expect(target.saveGroupAndUnitDetails).toHaveBeenCalledWith(1, [], testContext, false, testTx)
        expect(target.designSpecificationDetailService.manageAllDesignSpecificationDetails).toHaveBeenCalledWith([], 1, testContext, false, testTx)
        expect(AppUtil.createCompositePostResponse).not.toHaveBeenCalled()
        expect(err).toEqual(error)
      })
    })

    test('rejects when design specification call fails', () => {
      const error = { message: 'error' }
      target.designSpecificationDetailService = {
        manageAllDesignSpecificationDetails: mockReject(error),
      }
      target.saveGroupAndUnitDetails = mockResolve()
      AppUtil.createCompositePostResponse = mock()

      const designSpecsAndGroupAndUnitDetails = {
        designSpecifications: [],
        groupAndUnitDetails: [],
      }

      return target.saveDesignSpecsAndGroupUnitDetails(1, designSpecsAndGroupAndUnitDetails, testContext, false, testTx).then(() => {}, (err) => {
        expect(target.saveGroupAndUnitDetails).toHaveBeenCalledWith(1, [], testContext, false, testTx)
        expect(target.designSpecificationDetailService.manageAllDesignSpecificationDetails).toHaveBeenCalledWith([], 1, testContext, false, testTx)
        expect(AppUtil.createCompositePostResponse).not.toHaveBeenCalled()
        expect(err).toEqual(error)
      })
    })

    test('throws a bad request when passed in object is null', () => {
      AppError.badRequest = mock('')

      const designSpecsAndGroupAndUnitDetails = null
      expect(() => target.saveDesignSpecsAndGroupUnitDetails(1, designSpecsAndGroupAndUnitDetails, testContext, testTx)).toThrow()
    })
  })

  describe('saveGroupAndUnitDetails', () => {
    test('saves groups and units', () => {
      target.securityService.permissionsCheck = mockResolve()
      target.validateGroups = mock(undefined)
      target.groupService.deleteGroupsForExperimentId = mockResolve()
      target.recursiveBatchCreate = mockResolve()
      target.getGroupTree = mockResolve([])
      target.compareGroupTrees = mock({
        groups: { adds: [{}], updates: [], deletes: [] },
        units: { adds: [{}], updates: [], deletes: [] },
      })
      target.createGroupValues = mockResolve()
      target.createExperimentalUnits = mockResolve([5])
      target.batchUpdateExperimentalUnits = mockResolve()
      target.batchDeleteExperimentalUnits = mockResolve()
      target.batchDeleteGroups = mockResolve()
      AppUtil.createCompositePostResponse = mock()

      return target.saveGroupAndUnitDetails(1, [{}], testContext, false, testTx).then(() => {
        expect(target.validateGroups).toHaveBeenCalledWith([{}])

        expect(target.securityService.permissionsCheck).toHaveBeenCalledWith(1, testContext, false, testTx)
        expect(target.recursiveBatchCreate).toHaveBeenCalledWith(1, [{}], testContext, testTx)
        expect(target.createGroupValues).toBeCalled()
        expect(target.createExperimentalUnits).toBeCalled()
        expect(target.batchUpdateExperimentalUnits).toBeCalled()
        expect(target.batchDeleteExperimentalUnits).toBeCalled()
        expect(target.batchDeleteGroups).toBeCalled()
        expect(AppUtil.createCompositePostResponse).toHaveBeenCalled()
      })
    })

    test('rejects when recursiveBatchCreate fails', () => {
      const error = { message: 'error' }
      target.securityService.permissionsCheck = mockResolve()
      target.validateGroups = mock(undefined)
      target.groupService.deleteGroupsForExperimentId = mockResolve()
      target.recursiveBatchCreate = mockReject(error)
      target.compareGroupTrees = mock({
        groups: { adds: [{}], updates: [], deletes: [] },
        units: { adds: [], updates: [], deletes: [] },
      })
      target.createGroupValues = mockResolve()
      target.createExperimentalUnits = mockResolve()
      target.batchUpdateExperimentalUnits = mockResolve()
      target.batchDeleteExperimentalUnits = mockResolve()
      target.batchDeleteGroups = mockResolve()
      target.getGroupTree = mockResolve([])

      return target.saveGroupAndUnitDetails(1, [{}], testContext, false, testTx).then(() => {}, (err) => {
        expect(target.securityService.permissionsCheck).toHaveBeenCalledWith(1, testContext, false, testTx)
        expect(target.validateGroups).toHaveBeenCalledWith([{}])
        expect(target.recursiveBatchCreate).toHaveBeenCalledWith(1, [{}], testContext, testTx)
        expect(target.createGroupValues).not.toBeCalled()
        expect(target.createExperimentalUnits).not.toBeCalled()
        expect(target.batchUpdateExperimentalUnits).not.toBeCalled()
        expect(target.batchDeleteExperimentalUnits).not.toBeCalled()
        expect(target.batchDeleteGroups).not.toBeCalled()
        expect(err).toEqual(error)
      })
    })

    test('throws an error when there are group validation errors', () => {
      const error = { message: 'error' }
      target.securityService.permissionsCheck = mockResolve()
      target.validateGroups = mock(error)
      AppError.badRequest = mock(error)
      target.groupService.deleteGroupsForExperimentId = mock()
      target.getGroupTree = mockResolve([])

      return target.saveGroupAndUnitDetails(1, [{}], testContext, false, testTx).then(() => {}, (err) => {
        expect(target.securityService.permissionsCheck).toHaveBeenCalledWith(1, testContext, false, testTx)
        expect(target.validateGroups).toHaveBeenCalledWith([{}])
        expect(target.groupService.deleteGroupsForExperimentId).not.toHaveBeenCalled()
        expect(err).toEqual(error)
      })
    })
  })

  describe('createGroupValues', () => {
    test('does not call groupValueService if no groups passed in', () => {
      target.groupValueService = { batchCreateGroupValues: mockResolve() }

      return target.createGroupValues([], testContext, testTx).then(() => {
        expect(target.groupValueService.batchCreateGroupValues).not.toBeCalled()
      })
    })

    test('does call groupValueService if groups are passed in', () => {
      target.groupValueService = { batchCreateGroupValues: mockResolve() }

      return target.createGroupValues([{ groupValues: [] }], testContext, testTx).then(() => {
        expect(target.groupValueService.batchCreateGroupValues).toBeCalledWith([], testContext, testTx)
      })
    })
  })

  describe('batchUpdateExperimentalUnits', () => {
    test('does not call experimentalUnitService if no units passed in', () => {
      target.experimentalUnitService = { batchUpdateExperimentalUnits: mockResolve() }

      return target.batchUpdateExperimentalUnits([], testContext, testTx).then(() => {
        expect(target.experimentalUnitService.batchUpdateExperimentalUnits).not.toBeCalled()
      })
    })

    test('does call experimentalUnitService if units are passed in', () => {
      target.experimentalUnitService = { batchUpdateExperimentalUnits: mockResolve() }

      return target.batchUpdateExperimentalUnits([{}], testContext, testTx).then(() => {
        expect(target.experimentalUnitService.batchUpdateExperimentalUnits).toBeCalledWith([{}], testContext, testTx)
      })
    })
  })

  describe('batchDeleteExperimentalUnits', () => {
    test('does not call experimentalUnitService if no units passed in', () => {
      db.unit = { batchRemove: mockResolve() }

      return target.batchDeleteExperimentalUnits([], testTx).then(() => {
        expect(db.unit.batchRemove).not.toBeCalled()
      })
    })

    test('does call experimentalUnitService if units are passed in', () => {
      db.unit = { batchRemove: mockResolve() }

      return target.batchDeleteExperimentalUnits([{ id: 5 }], testTx).then(() => {
        expect(db.unit.batchRemove).toBeCalledWith([5], testTx)
      })
    })
  })

  describe('batchDeleteGroups', () => {
    test('does not call groupService if no groups passed in', () => {
      target.groupService = { batchDeleteGroups: mockResolve() }

      return target.batchDeleteGroups([], {}, testTx).then(() => {
        expect(target.groupService.batchDeleteGroups).not.toBeCalled()
      })
    })

    test('does call group Service if groups are passed in', () => {
      target.groupService = { batchDeleteGroups: mockResolve() }

      return target.batchDeleteGroups([{ id: 5 }], {}, testTx).then(() => {
        expect(target.groupService.batchDeleteGroups).toBeCalledWith([5], {}, testTx)
      })
    })
  })

  describe('recursiveBatchCreate', () => {
    test('does not call batchCreateGroups if all groups have ids', () => {
      const groupUnitDetails = [{ id: 1 }, { id: 2 }]
      target.groupService.batchCreateGroups = mockResolve([{}, {}, {}])
      target.createGroupValuesUnitsAndChildGroups = mockResolve()

      return target.recursiveBatchCreate(1, groupUnitDetails, testContext, testTx).then(() => {
        expect(target.groupService.batchCreateGroups).not.toBeCalled()
        expect(target.createGroupValuesUnitsAndChildGroups).toHaveBeenCalledWith(1, groupUnitDetails, [{
          id: 1,
          experimentId: 1,
        }, { id: 2, experimentId: 1 }], testContext, testTx)
      })
    })

    test('calls batchCreateGroups and createGroupValuesUnitsAndChildGroups', () => {
      const groupUnitDetails = [{}, {}]
      target.groupService.batchCreateGroups = mockResolve([{}, {}, {}])
      target.createGroupValuesUnitsAndChildGroups = mockResolve()

      return target.recursiveBatchCreate(1, groupUnitDetails, testContext, testTx).then(() => {
        expect(target.groupService.batchCreateGroups).toHaveBeenCalledWith([{ experimentId: 1 }, { experimentId: 1 }], testContext, testTx)
        expect(target.createGroupValuesUnitsAndChildGroups).toHaveBeenCalledWith(1, groupUnitDetails, [{ experimentId: 1 }, { experimentId: 1 }], testContext, testTx)
      })
    })

    test('rejects when createGroupValuesUnitsAndChildGroups fails', () => {
      const error = { message: 'error' }
      const groupUnitDetails = [{}, {}]
      target.groupService.batchCreateGroups = mockResolve([{}, {}, {}])
      target.createGroupValuesUnitsAndChildGroups = mockReject(error)

      return target.recursiveBatchCreate(1, groupUnitDetails, testContext, testTx).then(() => {}, (err) => {
        expect(target.groupService.batchCreateGroups).toHaveBeenCalledWith([{ experimentId: 1 }, { experimentId: 1 }], testContext, testTx)
        expect(target.createGroupValuesUnitsAndChildGroups).toHaveBeenCalledWith(1, groupUnitDetails, [{ experimentId: 1 }, { experimentId: 1 }], testContext, testTx)
        expect(err).toEqual(error)
      })
    })

    test('rejects when batchCreateGroups fails', () => {
      const error = { message: 'error' }
      const groupUnitDetails = [{}, {}]
      target.groupService.batchCreateGroups = mockReject(error)
      target.createGroupValuesUnitsAndChildGroups = mockReject(error)

      return target.recursiveBatchCreate(1, groupUnitDetails, testContext, testTx).then(() => {}, (err) => {
        expect(target.groupService.batchCreateGroups).toHaveBeenCalledWith([{ experimentId: 1 }, { experimentId: 1 }], testContext, testTx)
        expect(target.createGroupValuesUnitsAndChildGroups).not.toHaveBeenCalled()
        expect(err).toEqual(error)
      })
    })
  })

  describe('createGroupValuesUnitsAndChildGroups', () => {
    test('rejects when recursiveBatchCreate fails', () => {
      target.assignGroupIdToGroupValuesAndUnits = mock([{ groupValues: [{}], units: [{}], childGroups: [{ id: 1 }] }])
      target.recursiveBatchCreate = mockReject('error')

      return target.createGroupValuesUnitsAndChildGroups(1, [{}], [{}], testContext, testTx).then(() => {}, () => {
        expect(target.recursiveBatchCreate).toHaveBeenCalledWith(1, [{ id: 1 }], testContext, testTx)
      })
    })

    test('only calls recursiveBatchCreate', () => {
      target.groupValueService.batchCreateGroupValues = mockResolve()
      target.recursiveBatchCreate = mockResolve()

      return target.createGroupValuesUnitsAndChildGroups(1, [{}], [{ childGroups: [{}] }], testContext, testTx).then(() => {
        expect(target.groupValueService.batchCreateGroupValues).not.toHaveBeenCalled()
        expect(target.recursiveBatchCreate).toHaveBeenCalledWith(1, [{}], testContext, testTx)
      })
    })

    test('does not call recursiveBatchCreate', () => {
      target.assignGroupIdToGroupValuesAndUnits = mock([{ groupValues: [{}], units: [{}], childGroups: [] }])
      target.recursiveBatchCreate = mockReject('error')

      return target.createGroupValuesUnitsAndChildGroups(1, [{}], [{}], testContext, testTx).then(() => {
        expect(target.recursiveBatchCreate).not.toHaveBeenCalled()
      })
    })
  })

  describe('createExperimentalUnits', () => {
    test('does nothing if no units are passed in', () => {
      db.treatment.getDistinctExperimentIds = mockResolve()
      target.experimentalUnitService.batchCreateExperimentalUnits = mockResolve()

      return target.createExperimentalUnits(1, [], testContext, testTx).then((data) => {
        expect(db.treatment.getDistinctExperimentIds).not.toBeCalled()
        expect(target.experimentalUnitService.batchCreateExperimentalUnits).not.toBeCalled()
        expect(data).toEqual(undefined)
      })
    })

    test('batch creates experimental units', () => {
      db.treatment.getDistinctExperimentIds = mockResolve([{ experiment_id: 1 }])
      target.experimentalUnitService.batchCreateExperimentalUnits = mockResolve([1])

      return target.createExperimentalUnits(1, [{ treatmentId: 1 }], testContext, testTx).then((data) => {
        expect(db.treatment.getDistinctExperimentIds).toHaveBeenCalledWith([1], testTx)
        expect(target.experimentalUnitService.batchCreateExperimentalUnits).toHaveBeenCalledWith([{ treatmentId: 1 }], testContext, testTx)
        expect(data).toEqual([1])
      })
    })

    test('rejects when batchCreate fails', () => {
      const error = { message: 'error' }
      db.treatment.getDistinctExperimentIds = mockResolve([{ experiment_id: 1 }])
      target.experimentalUnitService.batchCreateExperimentalUnits = mockReject(error)

      return target.createExperimentalUnits(1, [{ treatmentId: 1 }], testContext, testTx).then(() => {}, (err) => {
        expect(db.treatment.getDistinctExperimentIds).toHaveBeenCalledWith([1], testTx)
        expect(target.experimentalUnitService.batchCreateExperimentalUnits).toHaveBeenCalledWith([{ treatmentId: 1 }], testContext, testTx)
        expect(err).toEqual(error)
      })
    })

    test('rejects when getDistinctExperimentIds fails', () => {
      const error = { message: 'error' }
      db.treatment.getDistinctExperimentIds = mockReject(error)
      target.experimentalUnitService.batchCreateExperimentalUnits = mockResolve([1])

      return target.createExperimentalUnits(1, [{ treatmentId: 1 }], testContext, testTx).then(() => {}, (err) => {
        expect(db.treatment.getDistinctExperimentIds).toHaveBeenCalledWith([1], testTx)
        expect(target.experimentalUnitService.batchCreateExperimentalUnits).not.toHaveBeenCalled()
        expect(err).toEqual(error)
      })
    })

    test('throws an error when there are multiple experiment ids returned', () => {
      db.treatment.getDistinctExperimentIds = mockResolve([{ experiment_id: 1 }, { experiment_id: 2 }])
      target.experimentalUnitService.batchCreateExperimentalUnits = mockResolve([1])
      AppError.badRequest = mock()

      return target.createExperimentalUnits(1, [{ treatmentId: 1 }], testContext, testTx).then(() => {}, () => {
        expect(db.treatment.getDistinctExperimentIds).toHaveBeenCalledWith([1], testTx)
        expect(target.experimentalUnitService.batchCreateExperimentalUnits).not.toHaveBeenCalled()
        expect(AppError.badRequest).toHaveBeenCalledWith('Treatments not associated with same experiment', undefined, '1FA001')
      })
    })

    test('throws an error when there are returned distinct experiment id does not match passed in', () => {
      db.treatment.getDistinctExperimentIds = mockResolve([{ experiment_id: 2 }])
      target.experimentalUnitService.batchCreateExperimentalUnits = mockResolve([1])
      AppError.badRequest = mock()

      return target.createExperimentalUnits(1, [{ treatmentId: 1 }], testContext, testTx).then(() => {}, () => {
        expect(db.treatment.getDistinctExperimentIds).toHaveBeenCalledWith([1], testTx)
        expect(target.experimentalUnitService.batchCreateExperimentalUnits).not.toHaveBeenCalled()
        expect(AppError.badRequest).toHaveBeenCalledWith('Treatments not associated with same experiment', undefined, '1FA001')
      })
    })
  })

  describe('validateGroups', () => {
    test('returns undefined when no groups are passed in', () => {
      expect(target.validateGroups([])).toEqual(undefined)
    })

    test('returns undefined when groups have no issues', () => {
      target.validateGroup = mock()
      expect(target.validateGroups([{}])).toEqual(undefined)
    })

    test('calls validateGroup only once for multiple groups when an earlier one has an error', () => {
      target.validateGroup = mock('error!')
      expect(target.validateGroups([{}, {}])).toEqual('error!')
      expect(target.validateGroup).toHaveBeenCalledTimes(1)
    })
  })

  describe('validateGroup', () => {
    test('returns undefined when no errors are in the group', () => {
      const group = { units: [], childGroups: [{}] }
      target.validateGroups = mock()

      expect(target.validateGroup(group)).toEqual(undefined)
      expect(target.validateGroups).toHaveBeenCalledWith([{}])
    })

    test('returns an error from validateGroups', () => {
      const group = { units: [], childGroups: [{}] }
      target.validateGroups = mock('error!')

      expect(target.validateGroup(group)).toEqual('error!')
      expect(target.validateGroups).toHaveBeenCalledWith([{}])
    })

    test('returns an error due to units and childGroups being empty', () => {
      const group = { units: [], childGroups: [] }
      target.validateGroups = mock()
      AppError.badRequest = mock()

      target.validateGroup(group)

      expect(AppError.badRequest).toHaveBeenCalledWith('Each group should have at least one unit or at least one child group', undefined, '1FC002')
      expect(target.validateGroups).not.toHaveBeenCalled()
    })

    test('returns an error when units and child groups are populated', () => {
      const group = { units: [{}], childGroups: [{}] }
      target.validateGroups = mock()
      AppError.badRequest = mock()

      target.validateGroup(group)

      expect(AppError.badRequest).toHaveBeenCalledWith('Only leaf child groups should have units', undefined, '1FC001')
      expect(target.validateGroups).not.toHaveBeenCalled()
    })

    test('returns no error when there are just units', () => {
      const group = { units: [{}], childGroups: [] }
      target.validateGroups = mock()
      AppError.badRequest = mock()

      expect(target.validateGroup(group)).toEqual(undefined)
      expect(AppError.badRequest).not.toHaveBeenCalled()
      expect(target.validateGroups).not.toHaveBeenCalled()
    })

    test('defaults units and child groups to empty arrays if they are not present', () => {
      const group = {}
      target.validateGroups = mock()
      AppError.badRequest = mock()

      target.validateGroup(group)

      expect(AppError.badRequest).toHaveBeenCalledWith('Each group should have at least one unit or at least one child group', undefined, '1FC002')
      expect(target.validateGroups).not.toHaveBeenCalled()
    })
  })

  describe('assignGroupIdToGroupValuesAndUnits', () => {
    test('returns group and unit details', () => {
      const groupAndUnitDetails = [{ groupValues: [{}], units: [{}], childGroups: [{}] }]
      const expectedResult = [{
        groupValues: [{ groupId: 1 }],
        units: [{ groupId: 1 }],
        childGroups: [{ parentId: 1 }],
      }]

      expect(target.assignGroupIdToGroupValuesAndUnits(groupAndUnitDetails, [1])).toEqual(expectedResult)
    })

    test('returns group and unit details for multiple groups', () => {
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

  describe('getGroupTree', () => {
    test('correctly structures the group response', () => {
      const parentGroup = { id: 2 }
      const firstChildGroup = { id: 1, parent_id: 2 }
      const secondChildGroup = { id: 5, parent_id: 2 }
      target.getGroupsAndUnits = mockResolve([firstChildGroup, parentGroup, secondChildGroup])

      return target.getGroupTree(1, false, testContext, testTx).then((result) => {
        expect(target.getGroupsAndUnits).toBeCalledWith(1, testTx)
        expect(result).toEqual([{ id: 2, childGroups: [firstChildGroup, secondChildGroup] }])
      })
    })
  })

  describe('compareGroupTrees', () => {
    test('properly calls everything', () => {
      const additionalLogicFuncs = []
      const testGroup = { id: 5, units: [{}] }
      target.assignAncestryAndLocation = mock([{ units: [{}] }])
      target.findMatchingEntity = jest.fn((a, b, c, d) => additionalLogicFuncs.push(d))
      target.formatComparisonResults = mock('formatted results')

      const result = target.compareGroupTrees([{}], [{}])

      expect(result).toBe('formatted results')
      expect(target.assignAncestryAndLocation).toHaveBeenCalledTimes(2)
      expect(target.findMatchingEntity).toHaveBeenCalledTimes(2)

      additionalLogicFuncs[0](testGroup, {})

      expect(testGroup.units[0].groupId).toBe(5)

      additionalLogicFuncs[1](testGroup.units[0], { group: { id: 7 }, setEntryId: 3 })

      expect(testGroup.units[0].oldGroupId).toBe(7)
      expect(testGroup.units[0].setEntryId).toBe(3)
    })
  })

  describe('findMatchingEntity', () => {
    test('assigns the id, marks the entity used, and calls the additional logic on match', () => {
      const hashedEntities = { 5: [{ id: 3, used: true }, { id: 7 }] }
      const entity = { value: '5' }
      const mockLogic = mock()

      target.findMatchingEntity(entity, hashedEntities, 'value', mockLogic)

      expect(mockLogic).toBeCalledWith(entity, hashedEntities['5'][1])
      expect(hashedEntities['5'][1].used).toBe(true)
      expect(entity.id).toBe(7)
    })

    test('assigns undefined to the id if no match found', () => {
      const entity = { id: 2, value: '5' }
      const mockLogic = mock()

      target.findMatchingEntity(entity, {}, 'value', mockLogic)

      expect(mockLogic).not.toBeCalled()
      expect(entity.id).toBe(undefined)
    })
  })

  describe('assignAncestryAndLocation', () => {
    test('handles location groups with children', () => {
      const functionToTest = target.assignAncestryAndLocation
      target.assignAncestryAndLocation = mock(g => [g])
      const group = {
        groupValues: [{ name: 'locNumber', value: 1 }],
        childGroups: [{ child: 1 }, { child: 2 }],
      }

      const result = functionToTest(group)

      expect(target.assignAncestryAndLocation).toHaveBeenCalledTimes(2)
      expect(target.assignAncestryAndLocation).toBeCalledWith(group.childGroups[0], group)
      expect(target.assignAncestryAndLocation).toBeCalledWith(group.childGroups[1], group)
      expect(group.locNumber).toBe(1)
      expect(group.ancestors).toBe('\nlocNumber::1')
      expect(result).toEqual([group.childGroups[0], group.childGroups[1], group])
    })

    test('handles regular groups with units', () => {
      const functionToTest = target.assignAncestryAndLocation
      target.assignAncestryAndLocation = mock(g => [g])
      const parent = { ancestors: '\nlocNumber::1', locNumber: 1 }
      const group = {
        groupValues: [{ factorLevelId: 1 }, { factor_level_id: 2 }],
        units: [{ rep: 1, treatmentId: 2 }, { rep: 2, treatment_id: 5 }],
      }

      functionToTest(group, parent)

      expect(target.assignAncestryAndLocation).not.toBeCalled()
      expect(group.locNumber).toBe(1)
      expect(group.ancestors).toBe('\nlocNumber::1\n1\t2')
      expect(group.units[0].group).toBe(group)
      expect(group.units[0].oldGroupId).toBe(undefined)
      expect(group.units[0].hashKey).toBe('1|1|2')
      expect(group.units[1].group).toBe(group)
      expect(group.units[1].oldGroupId).toBe(undefined)
      expect(group.units[1].hashKey).toBe('1|2|5')
    })
  })

  describe('formatComparisonResults', () => {
    test('properly categorizes all results', () => {
      const oldGroups = [{ id: 3, used: true }, { id: 5 }]
      const newGroups = [{
        id: 3,
        refRandomizationStrategyId: 1,
        oldRefRandomizationStrategyId: 3,
      }, {}]
      const oldUnits = [{ id: 1, used: true }, { id: 2 }, { id: 3, used: true }]
      const newUnits = [{ id: 1, groupId: 5, oldGroupId: 3 }, {
        id: 3,
        groupId: 3,
        oldGroupId: 3,
      }, {}]

      const result = target.formatComparisonResults(oldGroups, newGroups, oldUnits, newUnits)

      expect(result).toEqual({
        groups: {
          adds: [newGroups[1]],
          deletes: [oldGroups[1]],
        },
        units: {
          adds: [newUnits[2]],
          updates: [newUnits[0]],
          deletes: [oldUnits[1]],
        },
      })
    })
  })

  describe('resetSet', () => {
    test('calls all the correct services', () => {
      const header = ['header']
      cfServices.experimentsExternalAPIUrls = {
        value: {
          setsAPIUrl: 'testUrl',
        },
      }
      target.verifySetAndGetDetails = mockResolve({
        experimentId: 3,
        location: 2,
        numberOfReps: 5,
      })
      db.treatment.findAllByExperimentId = mockResolve([{ id: 1 }, { id: 2 }])
      db.unit.batchFindAllByExperimentIdAndLocation = mockResolve([{
        location: 2, rep: 1, treatment_id: 1, id: 101,
      },
      {
        location: 2, rep: 1, treatment_id: 2, id: 102,
      },
      {
        location: 2, rep: 2, treatment_id: 1, id: 103,
      },
      {
        location: 2, rep: 2, treatment_id: 2, id: 104,
      },
      {
        location: 2, rep: 3, treatment_id: 1, id: 105,
      },
      {
        location: 2, rep: 3, treatment_id: 2, id: 106,
      },
      {
        location: 2, rep: 4, treatment_id: 1, id: 107,
      },
      {
        location: 2, rep: 4, treatment_id: 2, id: 108,
      },
      {
        location: 2, rep: 5, treatment_id: 1, id: 109,
      },
      {
        location: 2, rep: 5, treatment_id: 2, id: 110,
      }])
      target.saveUnitsBySetId = mockResolve()
      PingUtil.getMonsantoHeader = mockResolve(header)
      HttpUtil.getWithRetry = mockResolve({ body: { entries: [{}, {}, {}, {}] } })
      HttpUtil.delete = mockResolve()
      HttpUtil.patch = mockResolve({ body: { entries: [{ entryId: 1001 }, { entryId: 1002 }, { entryId: 1003 }, { entryId: 1004 }, { entryId: 1005 }, { entryId: 1006 }, { entryId: 1007 }, { entryId: 1008 }, { entryId: 1009 }, { entryId: 1000 }] } })
      target.experimentalUnitService.batchPartialUpdateExperimentalUnits = mockResolve()

      return target.resetSet(5, {}, testTx).then(() => {
        expect(target.verifySetAndGetDetails).toBeCalledWith(5, {}, testTx)
        expect(db.treatment.findAllByExperimentId).toBeCalledWith(3, testTx)
        expect(PingUtil.getMonsantoHeader).toBeCalledWith()
        expect(HttpUtil.getWithRetry).toBeCalledWith('testUrl/sets/5?entries=true', header)
        expect(HttpUtil.patch).toBeCalledWith('testUrl/sets/5', header, { entries: [{}, {}, {}, {}, {}, {}, {}, {}, {}, {}], layout: [] })
        expect(target.experimentalUnitService.batchPartialUpdateExperimentalUnits).toBeCalledWith([{
          id: 101, location: 2, rep: 1, treatmentId: 1, setEntryId: 1001,
        },
        {
          id: 102, location: 2, rep: 1, treatmentId: 2, setEntryId: 1002,
        },
        {
          id: 103, location: 2, rep: 2, treatmentId: 1, setEntryId: 1003,
        },
        {
          id: 104, location: 2, rep: 2, treatmentId: 2, setEntryId: 1004,
        },
        {
          id: 105, location: 2, rep: 3, treatmentId: 1, setEntryId: 1005,
        },
        {
          id: 106, location: 2, rep: 3, treatmentId: 2, setEntryId: 1006,
        },
        {
          id: 107, location: 2, rep: 4, treatmentId: 1, setEntryId: 1007,
        },
        {
          id: 108, location: 2, rep: 4, treatmentId: 2, setEntryId: 1008,
        },
        {
          id: 109, location: 2, rep: 5, treatmentId: 1, setEntryId: 1009,
        },
        {
          id: 110, location: 2, rep: 5, treatmentId: 2, setEntryId: 1000,
        }], {}, testTx)
      })
    })

    test('calls only the sets services it needs to', () => {
      const header = ['header']
      cfServices.experimentsExternalAPIUrls = {
        value: {
          setsAPIUrl: 'testUrl',
        },
      }
      target.verifySetAndGetDetails = mockResolve({
        experimentId: 3,
        location: 1,
        numberOfReps: 5,
      })
      db.treatment.findAllByExperimentId = mockResolve([{ id: 1 }, { id: 2 }])
      db.unit.batchFindAllByExperimentIdAndLocation = mockResolve([{
        location: 1, rep: 1, treatment_id: 1, id: 101,
      },
      {
        location: 1, rep: 1, treatment_id: 2, id: 102,
      },
      {
        location: 1, rep: 2, treatment_id: 1, id: 103,
      },
      {
        location: 1, rep: 2, treatment_id: 2, id: 104,
      },
      {
        location: 1, rep: 3, treatment_id: 1, id: 105,
      },
      {
        location: 1, rep: 3, treatment_id: 2, id: 106,
      },
      {
        location: 1, rep: 4, treatment_id: 1, id: 107,
      },
      {
        location: 1, rep: 4, treatment_id: 2, id: 108,
      },
      {
        location: 1, rep: 5, treatment_id: 1, id: 109,
      },
      {
        location: 1, rep: 5, treatment_id: 2, id: 110,
      }])
      target.saveUnitsBySetId = mockResolve()
      PingUtil.getMonsantoHeader = mockResolve(header)
      HttpUtil.getWithRetry = mockResolve({ body: { entries: [] } })
      HttpUtil.delete = mockResolve()
      HttpUtil.patch = mockResolve({ body: { entries: [{ entryId: 1001 }, { entryId: 1002 }, { entryId: 1003 }, { entryId: 1004 }, { entryId: 1005 }, { entryId: 1006 }, { entryId: 1007 }, { entryId: 1008 }, { entryId: 1009 }, { entryId: 1000 }] } })
      target.experimentalUnitService.batchPartialUpdateExperimentalUnits = mockResolve()

      return target.resetSet(5, {}, testTx).then(() => {
        expect(target.verifySetAndGetDetails).toBeCalledWith(5, {}, testTx)
        expect(db.treatment.findAllByExperimentId).toBeCalledWith(3, testTx)
        expect(PingUtil.getMonsantoHeader).toBeCalledWith()
        expect(HttpUtil.getWithRetry).toBeCalledWith('testUrl/sets/5?entries=true', header)
        expect(HttpUtil.patch).toBeCalledWith('testUrl/sets/5', header, { entries: [{}, {}, {}, {}, {}, {}, {}, {}, {}, {}], layout: [] })
        expect(HttpUtil.patch).toHaveBeenCalledTimes(1)
        expect(target.experimentalUnitService.batchPartialUpdateExperimentalUnits).toBeCalledWith([{
          location: 1, rep: 1, treatmentId: 1, setEntryId: 1001, id: 101,
        },
        {
          location: 1, rep: 1, treatmentId: 2, setEntryId: 1002, id: 102,
        },
        {
          location: 1, rep: 2, treatmentId: 1, setEntryId: 1003, id: 103,
        },
        {
          location: 1, rep: 2, treatmentId: 2, setEntryId: 1004, id: 104,
        },
        {
          location: 1, rep: 3, treatmentId: 1, setEntryId: 1005, id: 105,
        },
        {
          location: 1, rep: 3, treatmentId: 2, setEntryId: 1006, id: 106,
        },
        {
          location: 1, rep: 4, treatmentId: 1, setEntryId: 1007, id: 107,
        },
        {
          location: 1, rep: 4, treatmentId: 2, setEntryId: 1008, id: 108,
        },
        {
          location: 1, rep: 5, treatmentId: 1, setEntryId: 1009, id: 109,
        },
        {
          location: 1, rep: 5, treatmentId: 2, setEntryId: 1000, id: 110,
        }], {}, testTx)
      })
    })

    test('sends the correct error and code back when sets error occurs', (done) => {
      cfServices.experimentsExternalAPIUrls = {
        value: {
          setsAPIUrl: 'testUrl',
        },
      }
      target.verifySetAndGetDetails = mockResolve({
        experimentId: 3,
        location: 1,
        numberOfReps: 5,
      })
      db.treatment.findAllByExperimentId = mockResolve([{ id: 1 }, { id: 2 }])
      target.saveUnitsBySetId = mockResolve()
      PingUtil.getMonsantoHeader = mockReject()
      AppError.internalServerError = mock()

      return target.resetSet(5, {}, testTx).catch(() => {
        expect(AppError.internalServerError).toBeCalledWith('An error occurred while communicating with the sets service.', undefined, '1Fd001')
        done()
      })
    })

    test('does not send sets error when error occurs while saving setEntryIds', (done) => {
      const header = ['header']
      cfServices.experimentsExternalAPIUrls = {
        value: {
          setsAPIUrl: 'testUrl',
        },
      }
      target.verifySetAndGetDetails = mockResolve({
        experimentId: 3,
        location: 1,
        numberOfReps: 5,
      })
      db.treatment.findAllByExperimentId = mockResolve([{ id: 1 }, { id: 2 }])
      db.unit.batchFindAllByExperimentIdAndLocation = mockResolve([{
        location: 1, rep: 1, treatment_id: 1, id: 101, setEntryId: 1001,
      },
      {
        location: 1, rep: 1, treatment_id: 2, id: 102, setEntryId: 1002,
      },
      {
        location: 1, rep: 2, treatment_id: 1, id: 103, setEntryId: 1003,
      },
      {
        location: 1, rep: 2, treatment_id: 2, id: 104, setEntryId: 1004,
      },
      {
        location: 1, rep: 3, treatment_id: 1, id: 105, setEntryId: 1005,
      },
      {
        location: 1, rep: 3, treatment_id: 2, id: 106, setEntryId: 1006,
      },
      {
        location: 1, rep: 4, treatment_id: 1, id: 107, setEntryId: 1007,
      },
      {
        location: 1, rep: 4, treatment_id: 2, id: 108, setEntryId: 1008,
      },
      {
        location: 1, rep: 5, treatment_id: 1, id: 109, setEntryId: 1009,
      },
      {
        location: 1, rep: 5, treatment_id: 2, id: 110, setEntryId: 1000,
      }])
      target.saveUnitsBySetId = mockResolve()
      PingUtil.getMonsantoHeader = mockResolve(header)
      HttpUtil.getWithRetry = mockResolve({ body: { entries: [{ entryId: 1 }, { entryId: 2 }, { entryId: 3 }, { entryId: 4 }] } })
      HttpUtil.delete = mockResolve()
      HttpUtil.patch = mockResolve({ body: { entries: [{ entryId: 1001 }, { entryId: 1002 }, { entryId: 1003 }, { entryId: 1004 }, { entryId: 1005 }, { entryId: 1006 }, { entryId: 1007 }, { entryId: 1008 }, { entryId: 1009 }, { entryId: 1000 }] } })
      target.experimentalUnitService.batchPartialUpdateExperimentalUnits = mockReject()
      AppError.internalServerError = mock()

      return target.resetSet(5, {}, testTx).catch(() => {
        expect(target.verifySetAndGetDetails).toBeCalledWith(5, {}, testTx)
        expect(db.treatment.findAllByExperimentId).toBeCalledWith(3, testTx)
        expect(PingUtil.getMonsantoHeader).toBeCalledWith()
        expect(HttpUtil.getWithRetry).toBeCalledWith('testUrl/sets/5?entries=true', header)
        expect(HttpUtil.patch).toBeCalledWith('testUrl/sets/5', header, { entries: [{}, {}, {}, {}, {}, {}, {}, {}, {}, {}], layout: [] })
        expect(HttpUtil.patch).toBeCalledWith('testUrl/sets/5', header, { entries: [{ entryId: 1, deleted: true }, { entryId: 2, deleted: true }, { entryId: 3, deleted: true }, { entryId: 4, deleted: true }] })
        expect(target.experimentalUnitService.batchPartialUpdateExperimentalUnits).toBeCalledWith([{
          location: 1, rep: 1, treatmentId: 1, setEntryId: 1001, id: 101,
        },
        {
          location: 1, rep: 1, treatmentId: 2, setEntryId: 1002, id: 102,
        },
        {
          location: 1, rep: 2, treatmentId: 1, setEntryId: 1003, id: 103,
        },
        {
          location: 1, rep: 2, treatmentId: 2, setEntryId: 1004, id: 104,
        },
        {
          location: 1, rep: 3, treatmentId: 1, setEntryId: 1005, id: 105,
        },
        {
          location: 1, rep: 3, treatmentId: 2, setEntryId: 1006, id: 106,
        },
        {
          location: 1, rep: 4, treatmentId: 1, setEntryId: 1007, id: 107,
        },
        {
          location: 1, rep: 4, treatmentId: 2, setEntryId: 1008, id: 108,
        },
        {
          location: 1, rep: 5, treatmentId: 1, setEntryId: 1009, id: 109,
        },
        {
          location: 1, rep: 5, treatmentId: 2, setEntryId: 1000, id: 110,
        }], {}, testTx)

        expect(AppError.internalServerError).not.toBeCalled()
        done()
      })
    })
  })

  describe('verifySetAndGetDetails', () => {
    test('returns the expected data', () => {
      db.locationAssociation.findBySetId = mockResolve({ location: 1, experiment_id: 5, set_id: 3 })
      db.designSpecificationDetail.findAllByExperimentId = mockResolve([{ ref_design_spec_id: 12, value: 2 }])
      db.refDesignSpecification.all = mockResolve([{ id: 12, name: 'Reps' }, { id: 11, name: 'Min Rep' }, { id: 13, name: 'Locations' }])

      return target.verifySetAndGetDetails(3, {}, testTx).then((result) => {
        expect(db.locationAssociation.findBySetId).toBeCalledWith(3, testTx)
        expect(db.designSpecificationDetail.findAllByExperimentId).toBeCalledWith(5, testTx)
        expect(db.refDesignSpecification.all).toBeCalledWith()

        expect(result).toEqual({
          experimentId: 5,
          location: 1,
          numberOfReps: 2,
        })
      })
    })

    test('throws correct error when set is not found', (done) => {
      db.locationAssociation.findBySetId = mockResolve()
      db.designSpecificationDetail.findAllByExperimentId = mockResolve([{ ref_design_spec_id: 12, value: 2 }])
      AppError.notFound = mock()

      return target.verifySetAndGetDetails(3, {}, testTx).catch(() => {
        expect(db.locationAssociation.findBySetId).toBeCalledWith(3, testTx)
        expect(db.designSpecificationDetail.findAllByExperimentId).not.toBeCalled()
        expect(AppError.notFound).toBeCalledWith('No set found for id 3', undefined, '1FK001')

        done()
      })
    })

    test('throws correct error when number of reps not found', (done) => {
      db.locationAssociation.findBySetId = mockResolve({ location: 1, experiment_id: 5, set_id: 3 })
      db.designSpecificationDetail = { findAllByExperimentId: mockResolve([{ ref_design_spec_id: 13, value: 2 }]) }
      db.refDesignSpecification = { all: mockResolve([{ id: 12, name: 'Reps' }, { id: 11, name: 'Min Rep' }, { id: 13, name: 'Locations' }]) }
      AppError.badRequest = mock()

      return target.verifySetAndGetDetails(3, {}, testTx).catch(() => {
        expect(db.locationAssociation.findBySetId).toBeCalledWith(3, testTx)
        expect(db.designSpecificationDetail.findAllByExperimentId).toBeCalledWith(5, testTx)
        expect(db.refDesignSpecification.all).toBeCalledWith()
        expect(AppError.badRequest).toBeCalledWith('The specified set (id 3) does not have a minimum number of reps and cannot be reset.', undefined, '1FK002')

        done()
      })
    })
  })

  describe('getGroupsAndUnits', () => {
    test('properly sends and retrieves data to lambda', () => {
      target = new GroupExperimentalUnitCompositeService()
      cfServices.experimentsExternalAPIUrls.value.randomizationAPIUrl = 'randomization'
      PingUtil.getMonsantoHeader = mockResolve()
      HttpUtil.getWithRetry = mockResolve({ body: 'randStrats' })
      db.factor.findByExperimentId = mockResolve([{ id: 1, name: 'var1' }])
      db.factorLevel.findByExperimentId = mockResolve([{ id: 3, factor_id: 1, value: { items: [{}] } }, { id: 5, factor_id: 1, value: { items: [{}, {}] } }])
      db.designSpecificationDetail.findAllByExperimentId = mockResolve('designSpecs')
      db.refDesignSpecification.all = mockResolve('refDesignSpecs')
      db.treatment.findAllByExperimentId = mockResolve([{ id: 7 }])
      db.combinationElement.findAllByExperimentId = mockResolve([{ treatment_id: 7, factor_level_id: 3 }, { treatment_id: 7, factor_level_id: 5 }])
      db.unit.findAllByExperimentId = mockResolve([])
      db.locationAssociation.findByExperimentId = mockResolve('setIds')
      AWSUtil.callLambda = mockResolve({ Payload: '{ "test": "message" }' })
      AppError.internalServerError = mock()
      target.lambdaPerformanceService.savePerformanceStats = mockResolve()

      const expectedLambdaPayload = {
        experimentId: 5,
        variables: [
          {
            id: 1,
            name: 'var1',
            levels: [
              { id: 3, factorId: 1, items: {} },
              { id: 5, factorId: 1, items: [{}, {}] },
            ],
          },
        ],
        designSpecs: 'designSpecs',
        refDesignSpecs: 'refDesignSpecs',
        randomizationStrategies: 'randStrats',
        treatments: [
          {
            id: 7,
            combinationElements: [
              {
                treatmentId: 7,
                factorLevelId: 3,
              },
              {
                treatmentId: 7,
                factorLevelId: 5,
              },
            ],
          },
        ],
        units: [],
        setLocAssociations: 'setIds',
      }

      return target.getGroupsAndUnits(5, testTx).then((data) => {
        expect(PingUtil.getMonsantoHeader).toBeCalled()
        expect(HttpUtil.getWithRetry).toBeCalled()
        expect(db.factor.findByExperimentId).toBeCalled()
        expect(db.factorLevel.findByExperimentId).toBeCalled()
        expect(db.designSpecificationDetail.findAllByExperimentId).toBeCalled()
        expect(db.refDesignSpecification.all).toBeCalled()
        expect(db.treatment.findAllByExperimentId).toBeCalled()
        expect(db.combinationElement.findAllByExperimentId).toBeCalled()
        expect(db.unit.findAllByExperimentId).toBeCalled()
        expect(db.locationAssociation.findByExperimentId).toBeCalled()
        expect(AWSUtil.callLambda).toBeCalledWith('cosmos-group-generation-lambda-dev', JSON.stringify(expectedLambdaPayload))
        expect(AppError.internalServerError).not.toBeCalled()
        expect(data).toEqual({ test: 'message' })
        expect(target.lambdaPerformanceService.savePerformanceStats).toBeCalled()
      })
    })

    test('properly handles lambda errors', () => {
      target = new GroupExperimentalUnitCompositeService()
      cfServices.experimentsExternalAPIUrls.value.randomizationAPIUrl = 'randomization'
      PingUtil.getMonsantoHeader = mockResolve()
      HttpUtil.getWithRetry = mockResolve({ body: 'randStrats' })
      db.factor.findByExperimentId = mockResolve([{ id: 1, name: 'var1' }])
      db.factorLevel.findByExperimentId = mockResolve([{ id: 3, factor_id: 1, value: { } }])
      db.designSpecificationDetail.findAllByExperimentId = mockResolve('designSpecs')
      db.refDesignSpecification.all = mockResolve('refDesignSpecs')
      db.treatment.findAllByExperimentId = mockResolve([{ id: 7 }])
      db.combinationElement.findAllByExperimentId = mockResolve([{ treatment_id: 7, factor_level_id: 3 }, { treatment_id: 7, factor_level_id: 5 }])
      db.unit.findAllByExperimentId = mockResolve('units')
      db.locationAssociation.findByExperimentId = mockResolve('setIds')
      AWSUtil.callLambda = mockReject()
      AppError.internalServerError = mock({ message: 'error result' })
      target.lambdaPerformanceService.savePerformanceStats = mockResolve()

      return target.getGroupsAndUnits(5, testTx).catch(() => {
        expect(PingUtil.getMonsantoHeader).toBeCalled()
        expect(HttpUtil.getWithRetry).toBeCalled()
        expect(db.factor.findByExperimentId).toBeCalled()
        expect(db.factorLevel.findByExperimentId).toBeCalled()
        expect(db.designSpecificationDetail.findAllByExperimentId).toBeCalled()
        expect(db.refDesignSpecification.all).toBeCalled()
        expect(db.treatment.findAllByExperimentId).toBeCalled()
        expect(db.combinationElement.findAllByExperimentId).toBeCalled()
        expect(db.unit.findAllByExperimentId).toBeCalled()
        expect(db.locationAssociation.findByExperimentId).toBeCalled()
        expect(AWSUtil.callLambda).toBeCalled()
        expect(AppError.internalServerError).toBeCalledWith('An error occurred while generating groups.', undefined, '1FO001')
        expect(target.lambdaPerformanceService.savePerformanceStats).not.toBeCalled()
      })
    })
  })

  describe('getGroupsByExperimentId', () => {
    test('units and groupValues are trimmed', () => {
      target = new GroupExperimentalUnitCompositeService()
      target.getGroupsAndUnits = mockResolve([
        {
          id: '1662.1',
          experimentId: '1662',
          parentId: null,
          refRandomizationStrategyId: 3,
          refGroupTypeId: 1,
          setId: 9703,
          units: [],
          groupValues: [],
        },
        {
          id: '1662.2',
          experimentId: '1662',
          parentId: null,
          refRandomizationStrategyId: 3,
          refGroupTypeId: 1,
          setId: 9704,
          units: [],
          groupValues: [],
        },
      ])
      return target.getGroupsByExperimentId(3, testTx)
        .then((data) => {
          expect(data).toEqual([
            {
              id: '1662.1',
              experimentId: '1662',
              parentId: null,
              refRandomizationStrategyId: 3,
              refGroupTypeId: 1,
              setId: 9703,
            },
            {
              id: '1662.2',
              experimentId: '1662',
              parentId: null,
              refRandomizationStrategyId: 3,
              refGroupTypeId: 1,
              setId: 9704,
            },
          ])
        })
    })
  })

  describe('getGroupsAndUnitsByExperimentIds', () => {
    test('multiple experiments, getting groups succeeded', () => {
      target = new GroupExperimentalUnitCompositeService()
      target.getGroupsAndUnits = mockResolve([{ id: 1 }, { id: 2 }])
      return target.getGroupsAndUnitsByExperimentIds([111, 112], testTx).then((data) => {
        expect(target.getGroupsAndUnits).toHaveBeenCalled()
        expect(data.length).toEqual(2)
        expect(data).toEqual([[{ id: 1 }, { id: 2 }], [{ id: 1 }, { id: 2 }]])
      })
    })

    test('multiple experiments, getting groups failed', () => {
      target = new GroupExperimentalUnitCompositeService()
      target.getGroupsAndUnits = mockReject('An error occurred')
      return target.getGroupsAndUnitsByExperimentIds([111, 112], testTx).then((data) => {
        expect(target.getGroupsAndUnits).toHaveBeenCalled()
        expect(data.length).toEqual(2)
        expect(data).toEqual([[], []])
      })
    })
  })

  describe('getGroupAndUnitsBySetId', () => {
    test('getting a group and units with a valid set id', () => {
      target = new GroupExperimentalUnitCompositeService()
      db.locationAssociation.findBySetId = mockResolve({ set_id: 4871, experiment_id: 112, location: 1 })
      target.getGroupAndUnitsBySetIdAndExperimentId = mockResolve({
        id: 1,
        setId: 4781,
        parentId: null,
        setEntries: [
          { id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 5 }, { id: 6 },
        ],
      })
      return target.getGroupAndUnitsBySetId(4871, testTx).then((group) => {
        expect(target.getGroupAndUnitsBySetIdAndExperimentId).toHaveBeenCalled()
        expect(group).toEqual({
          id: 1,
          setId: 4781,
          parentId: null,
          setEntries: [
            { id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 5 }, { id: 6 },
          ],
        })
      })
    })

    test('getting a group and units with an invalid set id', () => {
      target = new GroupExperimentalUnitCompositeService()
      db.locationAssociation.findBySetId = mockResolve({ set_id: 4871, experiment_id: 112, location: 1 })
      target.getGroupAndUnitsBySetIdAndExperimentId = mockResolve({})
      return target.getGroupAndUnitsBySetId(4871, testTx).then((group) => {
        expect(target.getGroupAndUnitsBySetIdAndExperimentId).toHaveBeenCalled()
        expect(group).toEqual({})
      })
    })

    test('getting a group and units with an empty return of the db query', () => {
      target = new GroupExperimentalUnitCompositeService()
      db.locationAssociation.findBySetId = mockResolve(null)
      target.getGroupAndUnitsBySetIdAndExperimentId = mockResolve({
        id: 1,
        setId: 4781,
        parentId: null,
        setEntries: [
          { id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 5 }, { id: 6 },
        ],
      })
      return target.getGroupAndUnitsBySetId(4871, testTx).then((group) => {
        expect(target.getGroupAndUnitsBySetIdAndExperimentId).not.toHaveBeenCalled()
        expect(group).toEqual({})
      })
    })

    test('getting a group and units with a failed db query', () => {
      target = new GroupExperimentalUnitCompositeService()
      db.locationAssociation.findBySetId = mockReject('error')
      target.getGroupAndUnitsBySetIdAndExperimentId = mockResolve({
        id: 1,
        setId: 4781,
        parentId: null,
        setEntries: [
          { id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 5 }, { id: 6 },
        ],
      })
      return target.getGroupAndUnitsBySetId(4871, testTx).then((group) => {
        expect(target.getGroupAndUnitsBySetIdAndExperimentId).not.toHaveBeenCalled()
        expect(group).toEqual({})
      })
    })
  })

  describe('getGroupAndUnitsBySetIdAndExperimentId', () => {
    test('get a group and units from a set id and experiment id', () => {
      target = new GroupExperimentalUnitCompositeService()
      target.getGroupsAndUnits = mockResolve([
        {
          id: 1,
          setId: 4781,
          parentId: null,
        },
        {
          id: 2,
          parentId: 1,
          units: [{ id: 1 }, { id: 2 }],
        },
        {
          id: 3,
          parentId: 1,
        },
        {
          id: 4,
          parentId: 2,
          units: [{ id: 3 }],
        },
        {
          id: 5,
          parentId: 2,
          units: [{ id: 4 }, { id: 5 }],
        },
        {
          id: 6,
          parentId: 5,
          units: [{ id: 6 }],
        },
      ])
      return target.getGroupAndUnitsBySetIdAndExperimentId(4781, 112, testTx).then((group) => {
        expect(group).toEqual({
          id: 1,
          setId: 4781,
          parentId: null,
          setEntries: [
            { id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 5 }, { id: 6 },
          ],
        })
      })
    })

    test('get a group and units from an invalid set id and experiment id', () => {
      target = new GroupExperimentalUnitCompositeService()
      target.getGroupsAndUnits = mockResolve([
        {
          id: 1,
          setId: 4781,
          parentId: null,
        },
        {
          id: 2,
          parentId: 1,
          units: [{ id: 1 }, { id: 2 }],
        },
        {
          id: 3,
          parentId: 1,
        },
        {
          id: 4,
          parentId: 2,
          units: [{ id: 3 }],
        },
        {
          id: 5,
          parentId: 2,
          units: [{ id: 4 }, { id: 5 }],
        },
        {
          id: 6,
          parentId: 5,
          units: [{ id: 6 }],
        },
      ])
      return target.getGroupAndUnitsBySetIdAndExperimentId(4782, 112, testTx).then((group) => {
        expect(group).toEqual({})
      })
    })

    test('get a group and units from a failed AWS lambda called', () => {
      target = new GroupExperimentalUnitCompositeService()
      target.getGroupsAndUnits = mockReject('error')
      return target.getGroupAndUnitsBySetIdAndExperimentId(4782, 112, testTx).then((group) => {
        expect(group).toEqual({})
      })
    })
  })

  describe('getUnitsFromGroupsBySetId', () => {
    test('get units from a set id', () => {
      const groups = [
        {
          id: 1,
          setId: 4781,
          parentId: null,
        },
        {
          id: 2,
          parentId: 1,
          units: [{ id: 1 }, { id: 2 }],
        },
        {
          id: 3,
          parentId: 1,
        },
        {
          id: 4,
          parentId: 2,
          units: [{ id: 3 }],
        },
        {
          id: 5,
          parentId: 2,
          units: [{ id: 4 }, { id: 5 }],
        },
        {
          id: 6,
          parentId: 5,
          units: [{ id: 6 }],
        },
      ]

      target = new GroupExperimentalUnitCompositeService()
      expect(target.getUnitsFromGroupsBySetId(groups, 4781))
        .toEqual([{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 5 }, { id: 6 }])
      expect(target.getUnitsFromGroupsBySetId(groups, 4782)).toEqual([])
    })
  })

  describe('getChildGroupUnits', () => {
    test('get units from child groups', () => {
      const groups = [
        {
          id: 1,
          parentId: null,
        },
        {
          id: 2,
          parentId: 1,
          units: [{ id: 1 }, { id: 2 }],
        },
        {
          id: 3,
          parentId: 1,
        },
        {
          id: 4,
          parentId: 2,
          units: [{ id: 3 }],
        },
        {
          id: 5,
          parentId: 2,
          units: [{ id: 4 }, { id: 5 }],
        },
        {
          id: 6,
          parentId: 5,
          units: [{ id: 6 }],
        },
      ]

      target = new GroupExperimentalUnitCompositeService()
      expect(target.getChildGroupUnits(groups, 1))
        .toEqual([{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 5 }, { id: 6 }])
      expect(target.getChildGroupUnits(groups, 7)).toEqual([])
    })
  })

  describe('getAllChildGroups', () => {
    test('get all child groups', () => {
      const groups = [
        {
          id: 1,
          parentId: null,
        },
        {
          id: 2,
          parentId: 1,
        },
        {
          id: 3,
          parentId: 1,
        },
        {
          id: 4,
          parentId: 2,
        },
        {
          id: 5,
          parentId: 2,
        },
        {
          id: 6,
          parentId: 5,
        },
      ]
      target = new GroupExperimentalUnitCompositeService()
      expect(target.getAllChildGroups(groups, 1)).toEqual([{
        id: 2,
        parentId: 1,
      },
      {
        id: 3,
        parentId: 1,
      },
      {
        id: 4,
        parentId: 2,
      },
      {
        id: 5,
        parentId: 2,
      },
      {
        id: 6,
        parentId: 5,
      },
      ])

      expect(target.getAllChildGroups(groups, 2)).toEqual([
        {
          id: 4,
          parentId: 2,
        },
        {
          id: 5,
          parentId: 2,
        },
        {
          id: 6,
          parentId: 5,
        },
      ])
      expect(target.getAllChildGroups(groups, 7)).toEqual([])
    })
  })

  describe('saveDesignSpecsAndUnits', () => {
    test('saves design specifications and units', () => {
      target.designSpecificationDetailService = {
        manageAllDesignSpecificationDetails: mockResolve(),
      }
      target.saveUnitsByExperimentId = mockResolve()
      AppUtil.createCompositePostResponse = mock()

      const designSpecsAndUnits = {
        designSpecifications: [],
        units: [],
      }
      db.locationAssociation = {
        findNumberOfLocationsAssociatedWithSets: mockResolve({ max: 3 }),
      }

      return target.saveDesignSpecsAndUnits(1, designSpecsAndUnits, testContext, false, testTx).then(() => {
        expect(db.locationAssociation.findNumberOfLocationsAssociatedWithSets).toHaveBeenCalled()
        expect(target.saveUnitsByExperimentId).toHaveBeenCalledWith(1, [], false, testContext, testTx)
        expect(target.designSpecificationDetailService.manageAllDesignSpecificationDetails).toHaveBeenCalledWith([], 1, testContext, false, testTx)
        expect(AppUtil.createCompositePostResponse).toHaveBeenCalled()
      })
    })

    test('throws and error when locations are less than set associated with locations', () => {
      target.designSpecificationDetailService = {
        manageAllDesignSpecificationDetails: mockResolve(),
      }
      target.saveUnitsByExperimentId = mockResolve()
      AppUtil.createCompositePostResponse = mock()

      const designSpecsAndUnits = {
        designSpecifications: [],
        units: [{ location: 1 }, { location: 2 }],
      }
      db.locationAssociation = {
        findNumberOfLocationsAssociatedWithSets: mockResolve({ max: 3 }),
      }
      AppError.badRequest = mock()

      return target.saveDesignSpecsAndUnits(1, designSpecsAndUnits, testContext, false, testTx).catch(() => {
        expect(db.locationAssociation.findNumberOfLocationsAssociatedWithSets).toHaveBeenCalled()
        expect(AppError.badRequest).toHaveBeenCalled()
      })
    })

    test('rejects when design specification call fails', () => {
      const error = { message: 'error' }
      target.designSpecificationDetailService = {
        manageAllDesignSpecificationDetails: mockReject(error),
      }
      target.saveUnitsByExperimentId = mockResolve()
      AppUtil.createCompositePostResponse = mock()

      const designSpecsAndUnits = {
        designSpecifications: [],
        units: [],
      }

      db.locationAssociation = {
        findNumberOfLocationsAssociatedWithSets: mockResolve({ max: 3 }),
      }

      return target.saveDesignSpecsAndUnits(1, designSpecsAndUnits, testContext, false, testTx).then(() => {}, (err) => {
        expect(db.locationAssociation.findNumberOfLocationsAssociatedWithSets).toHaveBeenCalled()
        expect(target.saveUnitsByExperimentId).toHaveBeenCalledWith(1, [], false, testContext, testTx)
        expect(target.designSpecificationDetailService.manageAllDesignSpecificationDetails).toHaveBeenCalledWith([], 1, testContext, false, testTx)
        expect(AppUtil.createCompositePostResponse).not.toHaveBeenCalled()
        expect(err).toEqual(error)
      })
    })

    test('throws a bad request when passed in object is null', () => {
      AppError.badRequest = mock('')

      const designSpecsAndUnits = null
      expect(() => target.saveDesignSpecsAndUnits(1, designSpecsAndUnits, testContext, testTx)).toThrow()
    })
  })

  describe('saveUnitsByExperimentId', () => {
    test('check functions are called and with correct parameters', () => {
      target = new GroupExperimentalUnitCompositeService()
      target.securityService.permissionsCheck = mockResolve()
      target.compareWithExistingUnitsByExperiment = mockResolve({ adds: [], deletes: [] })
      target.saveComparedUnits = mockResolve()
      return target.saveUnitsByExperimentId(5, [], false, {}, testTx)
        .then(() => {
          expect(target.securityService.permissionsCheck).toHaveBeenCalledWith(5, {}, false, testTx)
          expect(target.compareWithExistingUnitsByExperiment).toHaveBeenCalledWith(5, [], testTx)
          expect(target.saveComparedUnits).toHaveBeenCalledWith(5, { adds: [], deletes: [] }, {}, testTx)
        })
    })
  })

  describe('saveUnitsBySetId', () => {
    test('check functions are called and with correct parameters', () => {
      target = new GroupExperimentalUnitCompositeService()
      target.compareWithExistingUnitsBySetId = mockResolve({ adds: [], deletes: [] })
      target.saveComparedUnits = mockResolve()
      return target.saveUnitsBySetId(5, 3, [], {}, testTx)
        .then(() => {
          expect(target.compareWithExistingUnitsBySetId).toHaveBeenCalledWith(5, [], testTx)
          expect(target.saveComparedUnits).toHaveBeenCalledWith(3, { adds: [], deletes: [] }, {}, testTx)
        })
    })
  })

  describe('saveComparedUnits', () => {
    test('check functions are called and with correct parameters', () => {
      target = new GroupExperimentalUnitCompositeService()
      target.createExperimentalUnits = mockResolve()
      target.batchDeleteExperimentalUnits = mockResolve()
      return target.saveComparedUnits(3, { adds: [], deletes: [] }, {}, testTx)
        .then(() => {
          expect(target.createExperimentalUnits).toHaveBeenCalledWith(3, [], {}, testTx)
          expect(target.batchDeleteExperimentalUnits).toHaveBeenCalledWith([], testTx)
        })
    })
  })

  describe('compareWithExistingUnitsByExperiment', () => {
    test('check functions are called and with correct parameters', () => {
      target = new GroupExperimentalUnitCompositeService()
      target.compareWithExistingUnits = mockResolve([{}])
      target.experimentalUnitService.getExperimentalUnitsByExperimentIdNoValidate = mockResolve([{ treatment_id: 2 }])
      return target.compareWithExistingUnitsByExperiment(3, [{ treatmentId: 3 }], testTx).then(() => {
        expect(target.experimentalUnitService.getExperimentalUnitsByExperimentIdNoValidate).toHaveBeenCalledWith(3, testTx)
        expect(target.compareWithExistingUnits).toHaveBeenCalledWith([{ treatment_id: 2 }], [{ treatmentId: 3 }])
      })
    })
  })

  describe('compareWithExistingUnitsBySetId', () => {
    test('check functions are called and with correct parameters', () => {
      target = new GroupExperimentalUnitCompositeService()
      db.unit.batchFindAllBySetId = mockResolve([{ treatment_id: 2 }])
      target.compareWithExistingUnits = mockResolve([{}])
      return target.compareWithExistingUnitsBySetId(3, [{ treatmentId: 3 }], testTx).then(() => {
        expect(db.unit.batchFindAllBySetId).toHaveBeenCalledWith(3, testTx)
        expect(target.compareWithExistingUnits).toHaveBeenCalledWith([{ treatment_id: 2 }], [{ treatmentId: 3 }])
      })
    })
  })

  describe('compareWithExistingUnits', () => {
    test('existing units from DB contains more units', () => {
      target = new GroupExperimentalUnitCompositeService()
      const result = target.compareWithExistingUnits(
        [{ treatment_id: 1, rep: 1, location: 3 },
          { treatment_id: 2, rep: 1, location: 3 },
          { treatment_id: 1, rep: 2, location: 3 },
          { treatment_id: 2, rep: 2, location: 3 },
        ],
        [{ treatmentId: 1, rep: 2, location: 3 }],
      )

      expect(result.deletes).toEqual([{ treatmentId: 1, rep: 1, location: 3 },
        { treatmentId: 2, rep: 1, location: 3 },
        { treatmentId: 2, rep: 2, location: 3 }])
      expect(result.adds).toEqual([])
    })

    test('existing units from DB contains less units', () => {
      target = new GroupExperimentalUnitCompositeService()
      const result = target.compareWithExistingUnits(
        [{ treatment_id: 1, rep: 1, location: 3 }],
        [{ treatmentId: 1, rep: 1, location: 3 },
          { treatmentId: 2, rep: 1, location: 3 },
          { treatmentId: 1, rep: 2, location: 3 },
          { treatmentId: 2, rep: 2, location: 3 }],
      )

      expect(result.adds).toEqual([{ treatmentId: 2, rep: 1, location: 3 },
        { treatmentId: 1, rep: 2, location: 3 },
        { treatmentId: 2, rep: 2, location: 3 }])
      expect(result.deletes).toEqual([])
    })

    test('existing units from DB contains duplicate treatment in rep', () => {
      target = new GroupExperimentalUnitCompositeService()
      const result = target.compareWithExistingUnits(
        [{ treatment_id: 1, rep: 1, location: 3 },
          { treatment_id: 2, rep: 1, location: 3 },
          { treatment_id: 1, rep: 2, location: 3 },
          { treatmentId: 1, rep: 2, location: 3 },
          { treatment_id: 2, rep: 2, location: 3 },
        ],
        [{ treatmentId: 1, rep: 2, location: 3 }],
      )

      expect(result.deletes).toEqual([{ treatmentId: 1, rep: 1, location: 3 },
        { treatmentId: 2, rep: 1, location: 3 },
        { treatmentId: 1, rep: 2, location: 3 },
        { treatmentId: 2, rep: 2, location: 3 }])
      expect(result.adds).toEqual([])
    })
  })
})
