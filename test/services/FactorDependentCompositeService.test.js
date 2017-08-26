import { mock, mockReject, mockResolve } from '../jestUtil'
import AppUtil from '../../src/services/utility/AppUtil'
import DependentVariableService from '../../src/services/DependentVariableService'
import ExperimentsService from '../../src/services/ExperimentsService'
import FactorDependentCompositeService from '../../src/services/FactorDependentCompositeService'
import FactorService from '../../src/services/FactorService'
import FactorLevelService from '../../src/services/FactorLevelService'

describe('FactorDependentCompositeService', () => {
  let target
  const testContext = {}
  const testTx = { tx: {} }

  let verifyExperimentExistsOriginal
  let getFactorsByExperimentIdNoExistenceCheckOriginal
  let getFactorLevelsByExperimentIdNoExistenceCheckOriginal
  let getFactorsWithLevelsOriginal
  let extractLevelsForFactorOriginal
  let appendLevelIdToLevelOriginal
  let findFactorTypeOriginal
  let assembleFactorLevelDTOsOriginal
  let mapFactorEntitiesToFactorDTOsOriginal
  let mapDependentVariablesEntitiesToDTOsOriginal
  let createVariablesObjectOriginal
  let assembleIndependentAndExogenousOriginal
  let assembleVariablesObjectOriginal
  let getDependentVariablesByExperimentIdNoExistenceCheckOriginal

  beforeEach(() => {
    target = new FactorDependentCompositeService()

    verifyExperimentExistsOriginal = ExperimentsService.verifyExperimentExists
    getFactorsByExperimentIdNoExistenceCheckOriginal = FactorService.getFactorsByExperimentIdNoExistenceCheck
    getFactorLevelsByExperimentIdNoExistenceCheckOriginal = FactorLevelService.getFactorLevelsByExperimentIdNoExistenceCheck
    getFactorsWithLevelsOriginal = FactorDependentCompositeService.getFactorsWithLevels
    extractLevelsForFactorOriginal = FactorDependentCompositeService.extractLevelsForFactor
    appendLevelIdToLevelOriginal = FactorDependentCompositeService.appendLevelIdToLevel
    findFactorTypeOriginal = FactorDependentCompositeService.findFactorType
    assembleFactorLevelDTOsOriginal = FactorDependentCompositeService.assembleFactorLevelDTOs
    mapFactorEntitiesToFactorDTOsOriginal = FactorDependentCompositeService.mapFactorEntitiesToFactorDTOs
    mapDependentVariablesEntitiesToDTOsOriginal = FactorDependentCompositeService.mapDependentVariablesEntitiesToDTOs
    createVariablesObjectOriginal = FactorDependentCompositeService.createVariablesObject
    assembleIndependentAndExogenousOriginal = FactorDependentCompositeService.assembleIndependentAndExogenous
    assembleVariablesObjectOriginal = FactorDependentCompositeService.assembleVariablesObject
    getDependentVariablesByExperimentIdNoExistenceCheckOriginal = DependentVariableService.getDependentVariablesByExperimentIdNoExistenceCheck
  })

  afterEach(() => {
    ExperimentsService.verifyExperimentExists = verifyExperimentExistsOriginal
    FactorService.getFactorsByExperimentIdNoExistenceCheck = getFactorsByExperimentIdNoExistenceCheckOriginal
    FactorLevelService.getFactorLevelsByExperimentIdNoExistenceCheck = getFactorLevelsByExperimentIdNoExistenceCheckOriginal
    FactorDependentCompositeService.getFactorsWithLevels = getFactorsWithLevelsOriginal
    FactorDependentCompositeService.extractLevelsForFactor = extractLevelsForFactorOriginal
    FactorDependentCompositeService.appendLevelIdToLevel = appendLevelIdToLevelOriginal
    FactorDependentCompositeService.findFactorType = findFactorTypeOriginal
    FactorDependentCompositeService.assembleFactorLevelDTOs = assembleFactorLevelDTOsOriginal
    FactorDependentCompositeService.mapFactorEntitiesToFactorDTOs = mapFactorEntitiesToFactorDTOsOriginal
    FactorDependentCompositeService.mapDependentVariablesEntitiesToDTOs = mapDependentVariablesEntitiesToDTOsOriginal
    FactorDependentCompositeService.createVariablesObject = createVariablesObjectOriginal
    FactorDependentCompositeService.assembleIndependentAndExogenous = assembleIndependentAndExogenousOriginal
    FactorDependentCompositeService.assembleVariablesObject = assembleVariablesObjectOriginal
    DependentVariableService.getDependentVariablesByExperimentIdNoExistenceCheck = getDependentVariablesByExperimentIdNoExistenceCheckOriginal
  })

  describe('getFactorsWithLevels', () => {
    it('returns factors and levels object', () => {
      FactorService.getFactorsByExperimentIdNoExistenceCheck = mockResolve([{}])
      FactorLevelService.getFactorLevelsByExperimentIdNoExistenceCheck = mockResolve([{}, {}])

      return FactorDependentCompositeService.getFactorsWithLevels(1, testTx).then((data) => {
        expect(FactorService.getFactorsByExperimentIdNoExistenceCheck).toHaveBeenCalledWith(1, testTx)
        expect(FactorLevelService.getFactorLevelsByExperimentIdNoExistenceCheck).toHaveBeenCalledWith(1, testTx)
        expect(data).toEqual({ factors: [{}], levels: [{}, {}] })
      })
    })

    it('rejects when getFactorLevelsByExperimentIdNoExistenceCheck fails', () => {
      FactorService.getFactorsByExperimentIdNoExistenceCheck = mockResolve([{}])
      FactorLevelService.getFactorLevelsByExperimentIdNoExistenceCheck = mockReject('error')

      return FactorDependentCompositeService.getFactorsWithLevels(1, testTx).then(() => {}, (err) => {
        expect(FactorService.getFactorsByExperimentIdNoExistenceCheck).toHaveBeenCalledWith(1, testTx)
        expect(FactorLevelService.getFactorLevelsByExperimentIdNoExistenceCheck).toHaveBeenCalledWith(1, testTx)
        expect(err).toEqual('error')
      })
    })

    it('rejects when getFactorsByExperimentIdNoExistenceCheck fails', () => {
      FactorService.getFactorsByExperimentIdNoExistenceCheck = mockReject('error')
      FactorLevelService.getFactorLevelsByExperimentIdNoExistenceCheck = mock()

      return FactorDependentCompositeService.getFactorsWithLevels(1, testTx).then(() => {}, (err) => {
        expect(FactorService.getFactorsByExperimentIdNoExistenceCheck).toHaveBeenCalledWith(1, testTx)
        expect(FactorLevelService.getFactorLevelsByExperimentIdNoExistenceCheck).toHaveBeenCalledWith(1, testTx)
        expect(err).toEqual('error')
      })
    })
  })

  describe('extractLevelsForFactor', () => {
    it('returns empty list when no levels match', () => {
      expect(FactorDependentCompositeService.extractLevelsForFactor(
        {id: 42}, [{factor_id: 1}, {factor_id: 2}])).toEqual([])
    })

    it('returns empty list when no levels exist', () => {
      expect(FactorDependentCompositeService.extractLevelsForFactor(
        {id: 42}, [])).toEqual([])
    })

    it('returns levels that match', () => {
      expect(FactorDependentCompositeService.extractLevelsForFactor(
        {id: 42}, [{factor_id: 1}, {factor_id: 42}, {factor_id: 2}, {factor_id: 42}]))
        .toEqual([{factor_id: 42}, {factor_id: 42}])
    })
  })

  describe('appendLevelIdToLevel', () => {
    it('creates new entity with level id and items', () => {
      expect(FactorDependentCompositeService.appendLevelIdToLevel({id: 42, value: {items: [1,2,3]}}))
        .toEqual({id: 42, items: [1,2,3]})
    })
  })

  describe('findFactorType', () => {
    it('returns lower case type name of the factor', () => {
      expect(FactorDependentCompositeService.findFactorType([
        {id: 1, type: 'notIt'},
        {id: 2, type: 'IT'},
        {id: 3, type: 'notIt'},
        ], {ref_factor_type_id: 2})).toEqual('it')
    })
  })

  describe('assembleFactorLevelDTOs', () => {
    it('creates empty array when levels are not found.', () => {
      FactorDependentCompositeService.extractLevelsForFactor = mock([])
      FactorDependentCompositeService.appendLevelIdToLevel = mock()

      expect(FactorDependentCompositeService.assembleFactorLevelDTOs({id: 42}, [7, 8, 9]))
        .toEqual([])

      expect(FactorDependentCompositeService.extractLevelsForFactor).toHaveBeenCalledWith({id: 42}, [7, 8, 9])
      expect(FactorDependentCompositeService.appendLevelIdToLevel).not.toHaveBeenCalled()
    })

    it('creates factor level DTOs', () => {
      FactorDependentCompositeService.extractLevelsForFactor = mock([1, 2])
      FactorDependentCompositeService.appendLevelIdToLevel = mock()
      FactorDependentCompositeService.appendLevelIdToLevel.mockReturnValueOnce({id: 8, items: []})
      FactorDependentCompositeService.appendLevelIdToLevel.mockReturnValueOnce({id: 9, items: []})

      expect(FactorDependentCompositeService.assembleFactorLevelDTOs({id: 42}, [7, 8, 9]))
        .toEqual([{id: 8, items: []}, {id: 9, items: []}])

      expect(FactorDependentCompositeService.extractLevelsForFactor).toHaveBeenCalledWith({id: 42}, [7, 8, 9])
      expect(FactorDependentCompositeService.appendLevelIdToLevel).toHaveBeenCalledTimes(2)
      expect(FactorDependentCompositeService.appendLevelIdToLevel).toHaveBeenCalledWith(1)
      expect(FactorDependentCompositeService.appendLevelIdToLevel).toHaveBeenCalledWith(2)
    })
  })

  describe('mapFactorEntitiesToFactorDTOs', () => {
    it('returns empty list when no factors are present', () => {
      FactorDependentCompositeService.findFactorType = mock()
      FactorDependentCompositeService.assembleFactorLevelDTOs = mock()

      expect(FactorDependentCompositeService.mapFactorEntitiesToFactorDTOs([], [1,2,3], [{}, {}]))
        .toEqual([])

      expect(FactorDependentCompositeService.findFactorType).not.toHaveBeenCalled()
      expect(FactorDependentCompositeService.assembleFactorLevelDTOs).not.toHaveBeenCalled()
    })

    it('returns factor DTOs with data from functions', () => {
      FactorDependentCompositeService.findFactorType = mock('returnedType')
      FactorDependentCompositeService.assembleFactorLevelDTOs = mock([9,8,7])

      expect(FactorDependentCompositeService.mapFactorEntitiesToFactorDTOs(
        [{id: 42, name: 'factorName', tier: 'factorTier'}],
        [1,2,3],
        [{}, {}])).toEqual([
          {
            id: 42,
            name: 'factorName',
            type: 'returnedType',
            levels: [9, 8, 7],
            tier: 'factorTier'
          }
        ])

      expect(FactorDependentCompositeService.findFactorType).toHaveBeenCalledWith(
        [{}, {}],
        {id: 42, name: 'factorName', tier: 'factorTier'})
      expect(FactorDependentCompositeService.assembleFactorLevelDTOs).toHaveBeenCalledWith(
        {id: 42, name: 'factorName', tier: 'factorTier'},
        [1,2,3]
      )
    })
  })

  describe('mapDependentVariablesEntitiesToDTOs', () => {
    it('creates empty array when input is an empty array', () => {
      expect(FactorDependentCompositeService.mapDependentVariablesEntitiesToDTOs([]))
        .toEqual([])
    })

    it('creates dependent variable DTOs', () => {
      expect(FactorDependentCompositeService.mapDependentVariablesEntitiesToDTOs([
        {
          name: 'dvName',
          required: true,
          question_code: 42
        }
      ])).toEqual([
        {
          name: 'dvName',
          required: true,
          questionCode: 42
        }
      ])
    })
  })

  describe('createVariablesObject', () => {
    it('creates default object with empty arrays when empty object passed in', () => {
      expect(FactorDependentCompositeService.createVariablesObject({})).toEqual({
        independent: [],
        exogenous: [],
        dependent: []
      })
    })

    it('builds object with supplied data', () => {
      expect(FactorDependentCompositeService.createVariablesObject({
        independent: [1,2,3],
        exogenous: [4,5,6],
      }, [7,8,9])).toEqual({
        independent: [1,2,3],
        exogenous: [4,5,6],
        dependent: [7,8,9]
      })
    })
  })

  describe('assembleIndependentAndExogenous', () => {
    it('returns empty object when input is empty array', () => {
      expect(FactorDependentCompositeService.assembleIndependentAndExogenous([]))
        .toEqual({})
    })

    it('appends factors to properties named of type and removes type property', () => {
      expect(FactorDependentCompositeService.assembleIndependentAndExogenous(
        [
          {type: 'independent', data: {value: 'A'}},
          {type: 'independent', data: {value: 'B'}},
          {type: 'exogenous', data: {value: 'C'}},
          {type: 'exogenous', data: {value: 'D'}}
        ]
      )).toEqual({
        independent: [
          {data: {value: 'A'}},
          {data: {value: 'B'}},
        ],
        exogenous: [
          {data: {value: 'C'}},
          {data: {value: 'D'}},
        ]
      })
    })
  })

  describe('assembleVariablesObject', () => {
    it('builds variable object from results of functions', () => {
      FactorDependentCompositeService.mapFactorEntitiesToFactorDTOs = mock(
        [{name: 'factor1DTO'}, {name: 'factor2DTO'}])
      FactorDependentCompositeService.assembleIndependentAndExogenous = mock(
        {independent: [], exogenous: []}
      )
      FactorDependentCompositeService.mapDependentVariablesEntitiesToDTOs = mock(
        [{}, {}]
      )
      FactorDependentCompositeService.createVariablesObject = mock({name: 'variablesObject'})

      expect(FactorDependentCompositeService.assembleVariablesObject(
        [{name: 'factor1'}, {name: 'factor2'}],
        [{name: 'f1l1'}, {name: 'f1l2'}, {name: 'f2l1'}, {name: 'f2l2'}],
        [{name: 'type1'}, {name: 'type2'}],
        [{name: 'depVar1'}, {name: 'depVar2'}]
      )).toEqual({
        name: 'variablesObject'
      })

      expect(FactorDependentCompositeService.mapFactorEntitiesToFactorDTOs)
        .toHaveBeenCalledWith(
          [{name: 'factor1'}, {name: 'factor2'}],
          [{name: 'f1l1'}, {name: 'f1l2'}, {name: 'f2l1'}, {name: 'f2l2'}],
          [{name: 'type1'}, {name: 'type2'}]
        )
      expect(FactorDependentCompositeService.assembleIndependentAndExogenous)
        .toHaveBeenCalledWith(
          [{name: 'factor1DTO'}, {name: 'factor2DTO'}]
        )
      expect(FactorDependentCompositeService.mapDependentVariablesEntitiesToDTOs)
        .toHaveBeenCalledWith(
          [{name: 'depVar1'}, {name: 'depVar2'}]
        )
      expect(FactorDependentCompositeService.createVariablesObject)
        .toHaveBeenCalledWith(
          {independent: [], exogenous: []},
          [{}, {}]
        )
    })
  })

  describe('getAllVariablesByExperimentId', () => {
    it('returns all variables with their levels', () => {
      const factorsWithLevels = {
        factors: [{
          id: 42,
          name: 'testFactor',
          tier: undefined,
          ref_data_source_id: 1,
          ref_factor_type_id: 1,
        }],
        levels: [
          {
            id: 1,
            value: {items:[{label: 'testFactor', text: 'testValue1', propertyTypeId: 1}]},
            factor_id: 42
          },
          {
            id: 2,
            value: {items:[{label: 'testFactor', text: 'testValue2', propertyTypeId: 1}]},
            factor_id: 42
          }
        ],
      }
      ExperimentsService.verifyExperimentExists = mockResolve({})
      FactorDependentCompositeService.getFactorsWithLevels = mockResolve(factorsWithLevels)
      const factorTypes = [{ id: 1, type: 'independent' }]
      target.factorTypeService.getAllFactorTypes = mockResolve(factorTypes)
      const dependentVariables = [{
        name: 'testDependent',
        required: true,
        question_code: 'ABC_GDEG',
      }]
      DependentVariableService.getDependentVariablesByExperimentIdNoExistenceCheck = mockResolve(dependentVariables)
      const expectedReturn = {
        independent: [{
          id: 42,
          name: 'testFactor',
          levels: [
            {
              id: 1,
              items: [
                {
                  label: 'testFactor',
                  text: 'testValue1',
                  propertyTypeId: 1
                }
              ]
            },
            {
              id: 2,
              items: [
                {
                  label: 'testFactor',
                  text: 'testValue2',
                  propertyTypeId: 1
                }
              ]
            }
          ],
          tier: undefined,
        }],
        exogenous: [],
        dependent: [{ name: 'testDependent', required: true, questionCode: 'ABC_GDEG' }],
      }

      return target.getAllVariablesByExperimentId(1, false, testTx).then((data) => {
        expect(ExperimentsService.verifyExperimentExists).toHaveBeenCalledWith(1, false, testTx)
        expect(FactorDependentCompositeService.getFactorsWithLevels).toHaveBeenCalledWith(1, testTx)
        expect(target.factorTypeService.getAllFactorTypes).toHaveBeenCalled()
        expect(DependentVariableService.getDependentVariablesByExperimentIdNoExistenceCheck).toHaveBeenCalledWith(1, testTx)

        expect(data).toEqual(expectedReturn)
      })
    })

    it('rejects when a call fails in the Promise all', () => {
      ExperimentsService.verifyExperimentExists = mockResolve()
      FactorDependentCompositeService.getFactorsWithLevels = mockResolve()
      target.factorTypeService.getAllFactorTypes = mockResolve()
      DependentVariableService.getDependentVariablesByExperimentIdNoExistenceCheck = mockReject('error')

      return target.getAllVariablesByExperimentId(1, false, testTx).then(() => {}, (err) => {
        expect(ExperimentsService.verifyExperimentExists).toHaveBeenCalledWith(1, false, testTx)
        expect(FactorDependentCompositeService.getFactorsWithLevels).toHaveBeenCalledWith(1, testTx)
        expect(target.factorTypeService.getAllFactorTypes).toHaveBeenCalled()
        expect(DependentVariableService.getDependentVariablesByExperimentIdNoExistenceCheck).toHaveBeenCalledWith(1, testTx)
        expect(err).toEqual('error')
      })
    })
  })

  describe('get INDEPENDENT_VARIABLE_TYPE_ID', () => {
    it('returns type id for independent variable', () => {
      expect(FactorDependentCompositeService.INDEPENDENT_VARIABLE_TYPE_ID).toEqual(1)
    })
  })

  describe('get EXOGENOUS_VARIABLE_TYPE_ID', () => {
    it('returns type id for exogenous variable', () => {
      expect(FactorDependentCompositeService.EXOGENOUS_VARIABLE_TYPE_ID).toEqual(2)
    })
  })

  describe('mapDependentVariableDTO2DbEntity', () => {
    it('returns empty array when dependentVariables is undefined, null, or empty', () => {
      expect(FactorDependentCompositeService.mapDependentVariableDTO2DbEntity(undefined, 1)).toEqual([])
      expect(FactorDependentCompositeService.mapDependentVariableDTO2DbEntity(null, 1)).toEqual([])
      expect(FactorDependentCompositeService.mapDependentVariableDTO2DbEntity([], 1)).toEqual([])
    })

    it('maps dependent variables to db entities', () => {
      expect(FactorDependentCompositeService.mapDependentVariableDTO2DbEntity([{ name: 'testDependent' }, { name: 'testDependent2' }], 1)).toEqual([{
        name: 'testDependent',
        experimentId: 1,
      }, { name: 'testDependent2', experimentId: 1 }])
    })
  })

  describe('persistVariablesWithoutLevels', () => {
    it('deletes and creates dependent variables', () => {
      target.dependentVariableService.deleteDependentVariablesForExperimentId = mockResolve()
      target.dependentVariableService.batchCreateDependentVariables = mockResolve()

      return target.persistVariablesWithoutLevels(1, [{}], testContext, false, testTx).then(() => {
        expect(target.dependentVariableService.deleteDependentVariablesForExperimentId).toHaveBeenCalledWith(1, false, testTx)
        expect(target.dependentVariableService.batchCreateDependentVariables).toHaveBeenCalledWith([{}], testContext, testTx)
      })
    })

    it('deletes dependent variables, but does not create new ones', () => {
      target.dependentVariableService.deleteDependentVariablesForExperimentId = mockResolve()
      target.dependentVariableService.batchCreateDependentVariables = mock()

      return target.persistVariablesWithoutLevels(1, [], testContext, false, testTx).then(() => {
        expect(target.dependentVariableService.deleteDependentVariablesForExperimentId).toHaveBeenCalledWith(1, false, testTx)
        expect(target.dependentVariableService.batchCreateDependentVariables).not.toHaveBeenCalled()
      })
    })

    it('rejects when batchCreateDependentVariables fails', () => {
      target.dependentVariableService.deleteDependentVariablesForExperimentId = mockResolve()
      target.dependentVariableService.batchCreateDependentVariables = mockReject('error')

      return target.persistVariablesWithoutLevels(1, [{}], testContext, false, testTx).then(() => {}, (err) => {
        expect(target.dependentVariableService.deleteDependentVariablesForExperimentId).toHaveBeenCalledWith(1, false, testTx)
        expect(target.dependentVariableService.batchCreateDependentVariables).toHaveBeenCalledWith([{}], testContext, testTx)
        expect(err).toEqual('error')
      })
    })

    it('rejects when deleteDependentVariablesForExperimentId fails', () => {
      target.dependentVariableService.deleteDependentVariablesForExperimentId = mockReject('error')
      target.dependentVariableService.batchCreateDependentVariables = mock()

      return target.persistVariablesWithoutLevels(1, [{}], testContext, false, testTx).then(() => {}, (err) => {
        expect(target.dependentVariableService.deleteDependentVariablesForExperimentId).toHaveBeenCalledWith(1, false, testTx)
        expect(target.dependentVariableService.batchCreateDependentVariables).not.toHaveBeenCalled()
        expect(err).toEqual('error')
      })
    })
  })

  describe('persistDependentVariables', () => {
    it('maps DTOs to entities and calls persist method', () => {
      FactorDependentCompositeService.mapDependentVariableDTO2DbEntity = mock([{entity: true}])
      target.persistVariablesWithoutLevels = mockResolve()

      return target.persistDependentVariables([{}], 42, testContext, false, testTx)
        .then(() => {
          expect(FactorDependentCompositeService.mapDependentVariableDTO2DbEntity)
            .toHaveBeenCalledWith([{}], 42)
          expect(target.persistVariablesWithoutLevels).toHaveBeenCalledWith(
            42, [{entity: true}], testContext, false, testTx)
        })
    })
  })

  describe('persistAllVariables', () => {
    it('persists variables, and returns response', () => {
      target.securityService.permissionsCheck = mockResolve()
      target.variablesValidator.validate = mockResolve()
      target.persistIndependentVariables = mockResolve()
      target.persistDependentVariables = mockResolve()
      AppUtil.createPostResponse = mock()
      const experimentVariables = {
        independent: [{}],
        exogenous: [],
        dependent: [{}, {}]
      }

      return target.persistAllVariables(experimentVariables, 1, testContext, false, testTx).then(() => {
        expect(target.securityService.permissionsCheck).toHaveBeenCalledWith(1, testContext, false, testTx)
        expect(target.variablesValidator.validate).toHaveBeenCalledWith(experimentVariables, 'POST', testTx)
        expect(target.persistIndependentVariables).toHaveBeenCalledWith([{}], 1, testContext, testTx)
        expect(target.persistDependentVariables).toHaveBeenCalledWith([{}, {}], 1, testContext, false, testTx)
        expect(AppUtil.createPostResponse).toHaveBeenCalledWith([{ id: 1 }])
      })
    })

    it('rejects when persistIndependentVariables fails', () => {
      target.securityService.permissionsCheck = mockResolve()
      target.variablesValidator.validate = mockResolve()
      target.persistIndependentVariables = mockReject('error')
      target.persistDependentVariables = mockResolve()
      AppUtil.createPostResponse = mock()
      const experimentVariables = {
        independent: [{}],
        exogenous: [],
        dependent: [{}, {}]
      }

      return target.persistAllVariables(experimentVariables, 1, testContext, false, testTx).then(() => {}, (err) => {
        expect(target.securityService.permissionsCheck).toHaveBeenCalledWith(1, testContext, false, testTx)
        expect(target.variablesValidator.validate).toHaveBeenCalledWith(experimentVariables, 'POST', testTx)
        expect(target.persistIndependentVariables).toHaveBeenCalledWith([{}], 1, testContext, testTx)
        expect(target.persistDependentVariables).toHaveBeenCalledWith([{}, {}], 1, testContext, false, testTx)
        expect(AppUtil.createPostResponse).not.toHaveBeenCalled()
        expect(err).toEqual('error')
      })
    })
  })

  describe('persistIndependentVariables', () => {
    it('inserts new factor without levels', () => {
      const independentVariables = [
        {
          name: 'Density',
          levels: []
        }
      ]

      FactorService.getFactorsByExperimentIdNoExistenceCheck = mockResolve([])
      FactorLevelService.getFactorLevelsByExperimentIdNoExistenceCheck = mockResolve([])
      target.factorLevelService.batchDeleteFactorLevels = mockResolve()
      target.factorService.batchDeleteFactors = mockResolve()
      target.factorService.batchCreateFactors = mockResolve([99])
      target.factorLevelService.batchCreateFactorLevels = mockResolve()
      target.factorService.batchUpdateFactors = mockResolve()
      target.factorLevelService.batchUpdateFactorLevels = mockResolve()

      return target.persistIndependentVariables(independentVariables, 42, testContext, testTx).then(() => {
        expect(FactorLevelService.getFactorLevelsByExperimentIdNoExistenceCheck).toHaveBeenCalledWith(42, testTx)
        expect(FactorService.getFactorsByExperimentIdNoExistenceCheck).toHaveBeenCalledWith(42, testTx)
        expect(target.factorLevelService.batchDeleteFactorLevels).toHaveBeenCalledWith([], testTx)
        expect(target.factorService.batchDeleteFactors).toHaveBeenCalledWith([], testTx)
        expect(target.factorService.batchCreateFactors).toHaveBeenCalledWith([{
          name: 'Density',
          refFactorTypeId: 1,
          experimentId: 42,
          refDataSourceId: -1
        }], testContext, testTx)
        expect(target.factorLevelService.batchCreateFactorLevels).not.toHaveBeenCalled()
        expect(target.factorService.batchUpdateFactors).not.toHaveBeenCalled()
        expect(target.factorLevelService.batchUpdateFactorLevels).not.toHaveBeenCalled()
      })
    })

    it('updates existing factor without levels', () => {
      const independentVariables = [
        {
          id: 55,
          name: 'DensityUpdated',
          levels: []
        }
      ]

      FactorService.getFactorsByExperimentIdNoExistenceCheck = mockResolve([
        {
          id: 55,
          experimentId: 42,
          name: 'Density',
          refFactorTypeId: 1,
          refDataSourceId: 1
        }
      ])
      FactorLevelService.getFactorLevelsByExperimentIdNoExistenceCheck = mockResolve([])
      target.factorLevelService.batchDeleteFactorLevels = mockResolve()
      target.factorService.batchDeleteFactors = mockResolve()
      target.factorService.batchCreateFactors = mockResolve([99])
      target.factorLevelService.batchCreateFactorLevels = mockResolve()
      target.factorService.batchUpdateFactors = mockResolve()
      target.factorLevelService.batchUpdateFactorLevels = mockResolve()

      return target.persistIndependentVariables(independentVariables, 42, testContext, testTx).then(() => {
        expect(FactorLevelService.getFactorLevelsByExperimentIdNoExistenceCheck).toHaveBeenCalledWith(42, testTx)
        expect(FactorService.getFactorsByExperimentIdNoExistenceCheck).toHaveBeenCalledWith(42, testTx)
        expect(target.factorLevelService.batchDeleteFactorLevels).toHaveBeenCalledWith([], testTx)
        expect(target.factorService.batchDeleteFactors).toHaveBeenCalledWith([], testTx)
        expect(target.factorService.batchCreateFactors).not.toHaveBeenCalled()
        expect(target.factorLevelService.batchCreateFactorLevels).not.toHaveBeenCalled()
        expect(target.factorService.batchUpdateFactors).toHaveBeenCalledWith([{
          id: 55,
          name: 'DensityUpdated',
          refFactorTypeId: 1,
          experimentId: 42,
          refDataSourceId: -1
        }], testContext, testTx)
        expect(target.factorLevelService.batchUpdateFactorLevels).not.toHaveBeenCalled()
      })
    })

    it('inserts new factor with level', () => {
      const independentVariables = [
        {
          name: 'Density',
          levels: [
            {
              items: [
                {
                  label: 'Density',
                  propertyTypeId: 1,
                  text: '1000'
                }
              ]
            }
          ]
        }
      ]

      FactorService.getFactorsByExperimentIdNoExistenceCheck = mockResolve([])
      FactorLevelService.getFactorLevelsByExperimentIdNoExistenceCheck = mockResolve([])
      target.factorLevelService.batchDeleteFactorLevels = mockResolve()
      target.factorService.batchDeleteFactors = mockResolve()
      target.factorService.batchCreateFactors = mockResolve([{id: 99}])
      target.factorLevelService.batchCreateFactorLevels = mockResolve()
      target.factorService.batchUpdateFactors = mockResolve()
      target.factorLevelService.batchUpdateFactorLevels = mockResolve()

      return target.persistIndependentVariables(independentVariables, 42, testContext, testTx).then(() => {
        expect(FactorLevelService.getFactorLevelsByExperimentIdNoExistenceCheck).toHaveBeenCalledWith(42, testTx)
        expect(FactorService.getFactorsByExperimentIdNoExistenceCheck).toHaveBeenCalledWith(42, testTx)
        expect(target.factorLevelService.batchDeleteFactorLevels).toHaveBeenCalledWith([], testTx)
        expect(target.factorService.batchDeleteFactors).toHaveBeenCalledWith([], testTx)
        expect(target.factorService.batchCreateFactors).toHaveBeenCalledWith([{
          name: 'Density',
          refFactorTypeId: 1,
          experimentId: 42,
          refDataSourceId: 1
        }], testContext, testTx)
        expect(target.factorLevelService.batchCreateFactorLevels).toHaveBeenCalledWith([{
          factorId: 99,
          value: {
            items: [
              {
                label: 'Density',
                propertyTypeId: 1,
                text: '1000'
              }
            ]
          }
        }], testContext, testTx)
        expect(target.factorService.batchUpdateFactors).not.toHaveBeenCalled()
        expect(target.factorLevelService.batchUpdateFactorLevels).not.toHaveBeenCalled()
      })
    })

    it('inserts, updates, and deletes factors and levels appropriately', () => {
      const independentVariables = [
        {
          name: 'Density',
          levels: [
            {
              items: [
                {
                  label: 'Density',
                  propertyTypeId: 1,
                  text: '1000'
                }
              ]
            }
          ]
        },
        {
          id: 55,
          name: 'SeedUpdated',
          levels: [
            {
              items: [
                {
                  label: 'SeedUpdated',
                  propertyTypeId: 1,
                  text: 'ABC'
                }
              ]
            },
            {
              id: 66,
              items: [
                {
                  label: 'SeedUpdated',
                  propertyTypeId: 1,
                  text: 'DEFUpdated'
                }
              ]
            }
          ]
        }
      ]

      FactorService.getFactorsByExperimentIdNoExistenceCheck = mockResolve([
        {
          id: 55,
          experimentId: 42,
          name: 'Seed',
          refFactorTypeId: 1,
          refDataSourceId: 1
        },
        {
          id: 56,
          experiment_id: 42,
          name: 'IShouldBeDeleted',
          refFactorTypeId: 1,
          refDataSourceId: 1
        }
      ])
      FactorLevelService.getFactorLevelsByExperimentIdNoExistenceCheck = mockResolve([
        {
          id: 66,
          factorId: 55,
          value: {
            items: [
              {
                label: 'Seed',
                propertyTypeId: 1,
                text: 'DEF'
              }
            ]
          }
        },
        {
          id: 67,
          factorId: 55,
          value: {
            items: [
              {
                label: 'Seed',
                propertyTypeId: 1,
                text: 'GHI'
              }
            ]
          }
        }
      ])
      target.factorLevelService.batchDeleteFactorLevels = mockResolve()
      target.factorService.batchDeleteFactors = mockResolve()
      target.factorService.batchCreateFactors = mockResolve([{id: 99}])
      target.factorLevelService.batchCreateFactorLevels = mockResolve()
      target.factorService.batchUpdateFactors = mockResolve()
      target.factorLevelService.batchUpdateFactorLevels = mockResolve()

      return target.persistIndependentVariables(independentVariables, 42, testContext, testTx).then(() => {
        expect(FactorLevelService.getFactorLevelsByExperimentIdNoExistenceCheck).toHaveBeenCalledWith(42, testTx)
        expect(FactorService.getFactorsByExperimentIdNoExistenceCheck).toHaveBeenCalledWith(42, testTx)
        expect(target.factorLevelService.batchDeleteFactorLevels).toHaveBeenCalledWith([67], testTx)
        expect(target.factorService.batchDeleteFactors).toHaveBeenCalledWith([56], testTx)
        expect(target.factorService.batchCreateFactors).toHaveBeenCalledWith([{
          name: 'Density',
          refFactorTypeId: 1,
          experimentId: 42,
          refDataSourceId: 1
        }], testContext, testTx)
        expect(target.factorLevelService.batchCreateFactorLevels).toHaveBeenCalledWith([{
          factorId: 99,
          value: {
            items: [
              {
                label: 'Density',
                propertyTypeId: 1,
                text: '1000'
              }
            ]
          }
        }], testContext, testTx)
        expect(target.factorService.batchUpdateFactors).toHaveBeenCalledWith([{
          id: 55,
          experimentId: 42,
          name: 'SeedUpdated',
          refFactorTypeId: 1,
          refDataSourceId: 1
        }], testContext, testTx)
        expect(target.factorLevelService.batchUpdateFactorLevels).toHaveBeenCalledWith([{
          id: 66,
          factorId: 55,
          value: {
            items: [
              {
                label: 'SeedUpdated',
                propertyTypeId: 1,
                text: 'DEFUpdated'
              }
            ]
          }
        }], testContext, testTx)
      })
    })
  })
})