import { mock, mockReject, mockResolve } from '../jestUtil'
import DependentVariableService from '../../src/services/DependentVariableService'
import ExperimentsService from '../../src/services/ExperimentsService'
import FactorDependentCompositeService from '../../src/services/FactorDependentCompositeService'
import FactorService from '../../src/services/FactorService'
import FactorLevelService from '../../src/services/FactorLevelService'
import FactorLevelAssociationService from '../../src/services/FactorLevelAssociationService'

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
  let getFactorLevelAssociationByExperimentIdOriginal
  let mapFactorLevelAssociationEntitiesToDTOsOriginal
  let mapDependentVariableDTO2DbEntityOriginal

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
    getFactorLevelAssociationByExperimentIdOriginal = FactorLevelAssociationService.getFactorLevelAssociationByExperimentId
    mapFactorLevelAssociationEntitiesToDTOsOriginal = FactorDependentCompositeService.mapFactorLevelAssociationEntitiesToDTOs
    mapDependentVariableDTO2DbEntityOriginal = FactorDependentCompositeService.mapDependentVariableDTO2DbEntity
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
    FactorLevelAssociationService.getFactorLevelAssociationByExperimentId = getFactorLevelAssociationByExperimentIdOriginal
    FactorDependentCompositeService.mapFactorLevelAssociationEntitiesToDTOs = mapFactorLevelAssociationEntitiesToDTOsOriginal
    FactorDependentCompositeService.mapDependentVariableDTO2DbEntity = mapDependentVariableDTO2DbEntityOriginal
  })

  describe('getFactorsWithLevels', () => {
    test('returns factors and levels object', () => {
      FactorService.getFactorsByExperimentIdNoExistenceCheck = mockResolve([{}])
      FactorLevelService.getFactorLevelsByExperimentIdNoExistenceCheck = mockResolve([{}, {}])

      return FactorDependentCompositeService.getFactorsWithLevels(1, testTx).then((data) => {
        expect(FactorService.getFactorsByExperimentIdNoExistenceCheck).toHaveBeenCalledWith(1, testTx)
        expect(FactorLevelService.getFactorLevelsByExperimentIdNoExistenceCheck).toHaveBeenCalledWith(1, testTx)
        expect(data).toEqual({ factors: [{}], levels: [{}, {}] })
      })
    })

    test('rejects when getFactorLevelsByExperimentIdNoExistenceCheck fails', () => {
      const error = { message: 'error' }
      FactorService.getFactorsByExperimentIdNoExistenceCheck = mockResolve([{}])
      FactorLevelService.getFactorLevelsByExperimentIdNoExistenceCheck = mockReject(error)

      return FactorDependentCompositeService.getFactorsWithLevels(1, testTx).then(() => {}, (err) => {
        expect(FactorService.getFactorsByExperimentIdNoExistenceCheck).toHaveBeenCalledWith(1, testTx)
        expect(FactorLevelService.getFactorLevelsByExperimentIdNoExistenceCheck).toHaveBeenCalledWith(1, testTx)
        expect(err).toEqual(error)
      })
    })

    test('rejects when getFactorsByExperimentIdNoExistenceCheck fails', () => {
      const error = { message: 'error' }
      FactorService.getFactorsByExperimentIdNoExistenceCheck = mockReject(error)
      FactorLevelService.getFactorLevelsByExperimentIdNoExistenceCheck = mock()

      return FactorDependentCompositeService.getFactorsWithLevels(1, testTx).then(() => {}, (err) => {
        expect(FactorService.getFactorsByExperimentIdNoExistenceCheck).toHaveBeenCalledWith(1, testTx)
        expect(FactorLevelService.getFactorLevelsByExperimentIdNoExistenceCheck).toHaveBeenCalledWith(1, testTx)
        expect(err).toEqual(error)
      })
    })
  })

  describe('extractLevelsForFactor', () => {
    test('returns empty list when no levels match', () => {
      expect(FactorDependentCompositeService.extractLevelsForFactor({ id: 42 }, [{ factor_id: 1 }, { factor_id: 2 }])).toEqual([])
    })

    test('returns empty list when no levels exist', () => {
      expect(FactorDependentCompositeService.extractLevelsForFactor({ id: 42 }, [])).toEqual([])
    })

    test('returns levels that match', () => {
      expect(FactorDependentCompositeService.extractLevelsForFactor({ id: 42 }, [{ factor_id: 1 }, { factor_id: 42 }, { factor_id: 2 }, { factor_id: 42 }]))
        .toEqual([{ factor_id: 42 }, { factor_id: 42 }])
    })
  })

  describe('appendLevelIdToLevel', () => {
    test('creates new entity with level id and items', () => {
      expect(FactorDependentCompositeService.appendLevelIdToLevel({ id: 42, value: { items: [1, 2, 3] } }))
        .toEqual({ id: 42, items: [1, 2, 3] })
    })
  })

  describe('findFactorType', () => {
    test('returns lower case type name of the factor', () => {
      expect(FactorDependentCompositeService.findFactorType([
        { id: 1, type: 'notIt' },
        { id: 2, type: 'IT' },
        { id: 3, type: 'notIt' },
      ], { ref_factor_type_id: 2 })).toEqual('it')
    })
  })

  describe('assembleFactorLevelDTOs', () => {
    test('creates empty array when levels are not found.', () => {
      FactorDependentCompositeService.appendLevelIdToLevel = mock()

      expect(FactorDependentCompositeService.assembleFactorLevelDTOs([]))
        .toEqual([])

      expect(FactorDependentCompositeService.appendLevelIdToLevel).not.toHaveBeenCalled()
    })

    test('creates factor level DTOs', () => {
      FactorDependentCompositeService.appendLevelIdToLevel = mock()
      FactorDependentCompositeService.appendLevelIdToLevel.mockReturnValueOnce({ id: 8, items: [] })
      FactorDependentCompositeService.appendLevelIdToLevel.mockReturnValueOnce({ id: 9, items: [] })

      expect(FactorDependentCompositeService.assembleFactorLevelDTOs([1, 2]))
        .toEqual([{ id: 8, items: [] }, { id: 9, items: [] }])

      expect(FactorDependentCompositeService.appendLevelIdToLevel).toHaveBeenCalledTimes(2)
      expect(FactorDependentCompositeService.appendLevelIdToLevel).toHaveBeenCalledWith(1)
      expect(FactorDependentCompositeService.appendLevelIdToLevel).toHaveBeenCalledWith(2)
    })
  })

  describe('mapFactorEntitiesToFactorDTOs', () => {
    test('returns empty list when no factors are present', () => {
      FactorDependentCompositeService.findFactorType = mock()
      FactorDependentCompositeService.assembleFactorLevelDTOs = mock()

      expect(FactorDependentCompositeService.mapFactorEntitiesToFactorDTOs([], [1, 2, 3], [{}, {}], []))
        .toEqual([])

      expect(FactorDependentCompositeService.findFactorType).not.toHaveBeenCalled()
      expect(FactorDependentCompositeService.assembleFactorLevelDTOs).not.toHaveBeenCalled()
    })
  })

  describe('mapDependentVariablesEntitiesToDTOs', () => {
    test('creates empty array when input is an empty array', () => {
      expect(FactorDependentCompositeService.mapDependentVariablesEntitiesToDTOs([]))
        .toEqual([])
    })

    test('creates dependent variable DTOs', () => {
      expect(FactorDependentCompositeService.mapDependentVariablesEntitiesToDTOs([
        {
          name: 'dvName',
          required: true,
          question_code: 42,
        },
      ])).toEqual([
        {
          name: 'dvName',
          required: true,
          questionCode: 42,
        },
      ])
    })
  })

  describe('createVariablesObject', () => {
    test('creates default object with empty arrays when empty object passed in', () => {
      expect(FactorDependentCompositeService.createVariablesObject({})).toEqual({
        independent: [],
        exogenous: [],
        dependent: [],
        independentAssociations: [],
      })
    })

    test('builds object with supplied data', () => {
      expect(FactorDependentCompositeService.createVariablesObject({
        independent: [1, 2, 3],
        exogenous: [4, 5, 6],
      }, [7, 8, 9], [10, 11, 12])).toEqual({
        independent: [1, 2, 3],
        exogenous: [4, 5, 6],
        dependent: [7, 8, 9],
        independentAssociations: [10, 11, 12],
      })
    })
  })

  describe('assembleIndependentAndExogenous', () => {
    test('returns empty object when input is empty array', () => {
      expect(FactorDependentCompositeService.assembleIndependentAndExogenous([]))
        .toEqual({})
    })

    test('appends factors to properties named of type and removes type property', () => {
      expect(FactorDependentCompositeService.assembleIndependentAndExogenous([
        { type: 'independent', data: { value: 'A' } },
        { type: 'independent', data: { value: 'B' } },
        { type: 'exogenous', data: { value: 'C' } },
        { type: 'exogenous', data: { value: 'D' } },
      ])).toEqual({
        independent: [
          { data: { value: 'A' } },
          { data: { value: 'B' } },
        ],
        exogenous: [
          { data: { value: 'C' } },
          { data: { value: 'D' } },
        ],
      })
    })
  })

  describe('assembleVariablesObject', () => {
    test('builds variable object from results of functions', () => {
      FactorDependentCompositeService.mapFactorEntitiesToFactorDTOs = mock([{ name: 'factor1DTO' }, { name: 'factor2DTO' }])
      FactorDependentCompositeService.assembleIndependentAndExogenous = mock({ independent: [], exogenous: [] })
      FactorDependentCompositeService.mapDependentVariablesEntitiesToDTOs = mock([{}, {}])
      FactorDependentCompositeService.mapFactorLevelAssociationEntitiesToDTOs = mock([{ name: 'associationDTO' }])
      FactorDependentCompositeService.createVariablesObject = mock({ name: 'variablesObject' })

      expect(FactorDependentCompositeService.assembleVariablesObject(
        [{ name: 'factor1' }, { name: 'factor2' }],
        [{ name: 'f1l1' }, { name: 'f1l2' }, { name: 'f2l1' }, { name: 'f2l2' }],
        [{ name: 'type1' }, { name: 'type2' }],
        [{ name: 'depVar1' }, { name: 'depVar2' }],
        [{ name: 'association' }],
      )).toEqual({
        name: 'variablesObject',
      })

      expect(FactorDependentCompositeService.mapFactorEntitiesToFactorDTOs)
        .toHaveBeenCalledWith(
          [{ name: 'factor1' }, { name: 'factor2' }],
          [{ name: 'f1l1' }, { name: 'f1l2' }, { name: 'f2l1' }, { name: 'f2l2' }],
          [{ name: 'type1' }, { name: 'type2' }],
          [{ name: 'association' }],
        )
      expect(FactorDependentCompositeService.assembleIndependentAndExogenous)
        .toHaveBeenCalledWith([{ name: 'factor1DTO' }, { name: 'factor2DTO' }])
      expect(FactorDependentCompositeService.mapDependentVariablesEntitiesToDTOs)
        .toHaveBeenCalledWith([{ name: 'depVar1' }, { name: 'depVar2' }])
      expect(FactorDependentCompositeService.mapFactorLevelAssociationEntitiesToDTOs)
        .toHaveBeenCalledWith([{ name: 'association' }])
      expect(FactorDependentCompositeService.createVariablesObject)
        .toHaveBeenCalledWith(
          { independent: [], exogenous: [] },
          [{}, {}],
          [{ name: 'associationDTO' }],
        )
    })
  })

  describe('getAllVariablesByExperimentId', () => {
    test('returns all variables with their levels', () => {
      const factorsWithLevels = {
        factors: [{
          id: 42,
          name: 'GermPlasm',
          tier: undefined,
          ref_data_source_id: 1,
          ref_factor_type_id: 1,
        },
        {
          id: 43,
          name: 'RM',
          tier: undefined,
          ref_data_source_id: 1,
          ref_factor_type_id: 1,
        },
        ],

        levels: [
          {
            id: 1,
            value: { items: [{ label: 'GermPlasm', text: 'GermPlasm1', propertyTypeId: 1 }] },
            factor_id: 42,
          },
          {
            id: 2,
            value: { items: [{ label: 'GermPlasm', text: 'GermPlasm2', propertyTypeId: 1 }] },
            factor_id: 42,
          },
          {
            id: 3,
            value: { items: [{ label: 'GermPlasm', text: 'GermPlasm3', propertyTypeId: 1 }] },
            factor_id: 42,
          },
          {
            id: 4,
            value: { items: [{ label: 'RM', text: 'RM1', propertyTypeId: 1 }] },
            factor_id: 43,
          },
          {
            id: 5,
            value: { items: [{ label: 'RM', text: 'RM2', propertyTypeId: 1 }] },
            factor_id: 43,
          },
        ],
      }
      const factorLevelAssociations = [
        {
          id: 1,
          associated_level_id: 1,
          nested_level_id: 4,
        },
        {
          id: 2,
          associated_level_id: 2,
          nested_level_id: 4,
        },
        {
          id: 3,
          associated_level_id: 3,
          nested_level_id: 5,
        },
      ]
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
      FactorLevelAssociationService.getFactorLevelAssociationByExperimentId = mockResolve(factorLevelAssociations)
      const expectedReturn = {
        independent: [{
          id: 42,
          name: 'GermPlasm',
          nestedFactors: [
            {
              id: 43,
              name: 'RM',
            },
          ],
          levels: [
            {
              id: 1,
              items: [
                {
                  label: 'GermPlasm',
                  text: 'GermPlasm1',
                  propertyTypeId: 1,
                },
              ],
            },
            {
              id: 2,
              items: [
                {
                  label: 'GermPlasm',
                  text: 'GermPlasm2',
                  propertyTypeId: 1,
                },
              ],
            },
            {
              id: 3,
              items: [
                {
                  label: 'GermPlasm',
                  text: 'GermPlasm3',
                  propertyTypeId: 1,
                },
              ],
            },
          ],
          tier: undefined,
        },
        {
          id: 43,
          name: 'RM',
          associatedFactors: [
            {
              id: 42,
              name: 'GermPlasm',
            },
          ],
          levels: [
            {
              id: 4,
              items: [
                {
                  label: 'RM',
                  text: 'RM1',
                  propertyTypeId: 1,
                },
              ],
            },
            {
              id: 5,
              items: [
                {
                  label: 'RM',
                  text: 'RM2',
                  propertyTypeId: 1,
                },
              ],
            },
          ],
          tier: undefined,
        }],
        independentAssociations: [
          {
            id: 1,
            associatedLevelId: 1,
            nestedLevelId: 4,
          },
          {
            id: 2,
            associatedLevelId: 2,
            nestedLevelId: 4,
          },
          {
            id: 3,
            associatedLevelId: 3,
            nestedLevelId: 5,
          },
        ],
        exogenous: [],
        dependent: [{ name: 'testDependent', required: true, questionCode: 'ABC_GDEG' }],
      }

      return target.getAllVariablesByExperimentId(1, false, testContext, testTx).then((data) => {
        expect(ExperimentsService.verifyExperimentExists).toHaveBeenCalledWith(1, false, testContext, testTx)
        expect(FactorDependentCompositeService.getFactorsWithLevels).toHaveBeenCalledWith(1, testTx)
        expect(target.factorTypeService.getAllFactorTypes).toHaveBeenCalled()
        expect(DependentVariableService.getDependentVariablesByExperimentIdNoExistenceCheck).toHaveBeenCalledWith(1, testTx)
        expect(FactorLevelAssociationService.getFactorLevelAssociationByExperimentId).toHaveBeenCalledWith(1, testTx)
        expect(data).toEqual(expectedReturn)
      })
    })

    test('returns all variables with their levels and multiple nested vars', () => {
      const factorsWithLevels = {
        factors: [
          {
            id: 42,
            name: 'GermPlasm',
            tier: undefined,
            ref_data_source_id: 1,
            ref_factor_type_id: 1,
          },
          {
            id: 43,
            name: 'RM',
            tier: undefined,
            ref_data_source_id: 1,
            ref_factor_type_id: 1,
          },
          {
            id: 44,
            name: 'PlantHeight',
            tier: undefined,
            ref_data_source_id: 1,
            ref_factor_type_id: 1,
          },
        ],

        levels: [
          {
            id: 1,
            value: { items: [{ label: 'GermPlasm', text: 'GermPlasm1', propertyTypeId: 1 }] },
            factor_id: 42,
          },
          {
            id: 2,
            value: { items: [{ label: 'GermPlasm', text: 'GermPlasm2', propertyTypeId: 1 }] },
            factor_id: 42,
          },
          {
            id: 3,
            value: { items: [{ label: 'GermPlasm', text: 'GermPlasm3', propertyTypeId: 1 }] },
            factor_id: 42,
          },
          {
            id: 4,
            value: { items: [{ label: 'RM', text: 'RM1', propertyTypeId: 1 }] },
            factor_id: 43,
          },
          {
            id: 5,
            value: { items: [{ label: 'RM', text: 'RM2', propertyTypeId: 1 }] },
            factor_id: 43,
          },
          {
            id: 6,
            value: { items: [{ label: 'PlantHeight', text: 'Tall', propertyTypeId: 1 }] },
            factor_id: 44,
          },
          {
            id: 7,
            value: { items: [{ label: 'PlantHeight', text: 'Dwarf', propertyTypeId: 1 }] },
            factor_id: 44,
          },
        ],
      }
      const factorLevelAssociations = [
        {
          id: 1,
          associated_level_id: 1,
          nested_level_id: 4,
        },
        {
          id: 2,
          associated_level_id: 2,
          nested_level_id: 4,
        },
        {
          id: 3,
          associated_level_id: 3,
          nested_level_id: 5,
        },
        {
          id: 4,
          associated_level_id: 1,
          nested_level_id: 6,
        },
        {
          id: 5,
          associated_level_id: 2,
          nested_level_id: 7,
        },
        {
          id: 6,
          associated_level_id: 3,
          nested_level_id: 7,
        },
      ]
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
      FactorLevelAssociationService.getFactorLevelAssociationByExperimentId = mockResolve(factorLevelAssociations)
      const expectedReturn = {
        independent: [{
          id: 42,
          name: 'GermPlasm',
          nestedFactors: [
            {
              id: 43,
              name: 'RM',
            },
            {
              id: 44,
              name: 'PlantHeight',
            },
          ],
          levels: [
            {
              id: 1,
              items: [
                {
                  label: 'GermPlasm',
                  text: 'GermPlasm1',
                  propertyTypeId: 1,
                },
              ],
            },
            {
              id: 2,
              items: [
                {
                  label: 'GermPlasm',
                  text: 'GermPlasm2',
                  propertyTypeId: 1,
                },
              ],
            },
            {
              id: 3,
              items: [
                {
                  label: 'GermPlasm',
                  text: 'GermPlasm3',
                  propertyTypeId: 1,
                },
              ],
            },
          ],
          tier: undefined,
        },
        {
          id: 43,
          name: 'RM',
          associatedFactors: [
            {
              id: 42,
              name: 'GermPlasm',
            },
          ],
          levels: [
            {
              id: 4,
              items: [
                {
                  label: 'RM',
                  text: 'RM1',
                  propertyTypeId: 1,
                },
              ],
            },
            {
              id: 5,
              items: [
                {
                  label: 'RM',
                  text: 'RM2',
                  propertyTypeId: 1,
                },
              ],
            },
          ],
          tier: undefined,
        },
        {
          id: 44,
          name: 'PlantHeight',
          associatedFactors: [
            {
              id: 42,
              name: 'GermPlasm',
            },
          ],
          levels: [
            {
              id: 6,
              items: [
                {
                  label: 'PlantHeight',
                  text: 'Tall',
                  propertyTypeId: 1,
                },
              ],
            },
            {
              id: 7,
              items: [
                {
                  label: 'PlantHeight',
                  text: 'Dwarf',
                  propertyTypeId: 1,
                },
              ],
            },
          ],
          tier: undefined,
        }],
        independentAssociations: [
          {
            id: 1,
            associatedLevelId: 1,
            nestedLevelId: 4,
          },
          {
            id: 2,
            associatedLevelId: 2,
            nestedLevelId: 4,
          },
          {
            id: 3,
            associatedLevelId: 3,
            nestedLevelId: 5,
          },
          {
            id: 4,
            associatedLevelId: 1,
            nestedLevelId: 6,
          },
          {
            id: 5,
            associatedLevelId: 2,
            nestedLevelId: 7,
          },
          {
            id: 6,
            associatedLevelId: 3,
            nestedLevelId: 7,
          },
        ],
        exogenous: [],
        dependent: [{ name: 'testDependent', required: true, questionCode: 'ABC_GDEG' }],
      }

      return target.getAllVariablesByExperimentId(1, false, testContext, testTx).then((data) => {
        expect(ExperimentsService.verifyExperimentExists).toHaveBeenCalledWith(1, false, testContext, testTx)
        expect(FactorDependentCompositeService.getFactorsWithLevels).toHaveBeenCalledWith(1, testTx)
        expect(target.factorTypeService.getAllFactorTypes).toHaveBeenCalled()
        expect(DependentVariableService.getDependentVariablesByExperimentIdNoExistenceCheck).toHaveBeenCalledWith(1, testTx)
        expect(FactorLevelAssociationService.getFactorLevelAssociationByExperimentId).toHaveBeenCalledWith(1, testTx)
        expect(data).toEqual(expectedReturn)
      })
    })

    test('rejects when a call fails in the Promise all', () => {
      const error = { message: 'error' }
      ExperimentsService.verifyExperimentExists = mockResolve()
      FactorDependentCompositeService.getFactorsWithLevels = mockResolve()
      target.factorTypeService.getAllFactorTypes = mockResolve()
      DependentVariableService.getDependentVariablesByExperimentIdNoExistenceCheck = mockReject(error)
      FactorLevelAssociationService.getFactorLevelAssociationByExperimentId = mockResolve()

      return target.getAllVariablesByExperimentId(1, false, {}, testTx).then(() => {}, (err) => {
        expect(ExperimentsService.verifyExperimentExists).toHaveBeenCalledWith(1, false, {}, testTx)
        expect(FactorDependentCompositeService.getFactorsWithLevels).toHaveBeenCalledWith(1, testTx)
        expect(target.factorTypeService.getAllFactorTypes).toHaveBeenCalled()
        expect(DependentVariableService.getDependentVariablesByExperimentIdNoExistenceCheck).toHaveBeenCalledWith(1, testTx)
        expect(FactorLevelAssociationService.getFactorLevelAssociationByExperimentId).toHaveBeenCalledWith(1, testTx)
        expect(err).toEqual(error)
      })
    })
  })

  describe('mapDependentVariableDTO2DbEntity', () => {
    test('returns empty array when dependentVariables is undefined, null, or empty', () => {
      expect(FactorDependentCompositeService.mapDependentVariableDTO2DbEntity(undefined, 1)).toEqual([])
      expect(FactorDependentCompositeService.mapDependentVariableDTO2DbEntity(null, 1)).toEqual([])
      expect(FactorDependentCompositeService.mapDependentVariableDTO2DbEntity([], 1)).toEqual([])
    })

    test('maps dependent variables to db entities', () => {
      expect(FactorDependentCompositeService.mapDependentVariableDTO2DbEntity([{ name: 'testDependent' }, { name: 'testDependent2' }], 1)).toEqual([{
        name: 'testDependent',
        experimentId: 1,
      }, { name: 'testDependent2', experimentId: 1 }])
    })
  })

  describe('persistVariablesWithoutLevels', () => {
    test('deletes and creates dependent variables', () => {
      target.dependentVariableService.deleteDependentVariablesForExperimentId = mockResolve()
      target.dependentVariableService.batchCreateDependentVariables = mockResolve()

      return target.persistVariablesWithoutLevels(1, [{}], testContext, false, testTx).then(() => {
        expect(target.dependentVariableService.deleteDependentVariablesForExperimentId).toHaveBeenCalledWith(1, false, {}, testTx)
        expect(target.dependentVariableService.batchCreateDependentVariables).toHaveBeenCalledWith([{}], testContext, testTx)
      })
    })

    test('deletes dependent variables, but does not create new ones', () => {
      target.dependentVariableService.deleteDependentVariablesForExperimentId = mockResolve()
      target.dependentVariableService.batchCreateDependentVariables = mock()

      return target.persistVariablesWithoutLevels(1, [], testContext, false, testTx).then(() => {
        expect(target.dependentVariableService.deleteDependentVariablesForExperimentId).toHaveBeenCalledWith(1, false, {}, testTx)
        expect(target.dependentVariableService.batchCreateDependentVariables).not.toHaveBeenCalled()
      })
    })

    test('rejects when batchCreateDependentVariables fails', () => {
      const error = { message: 'error' }
      target.dependentVariableService.deleteDependentVariablesForExperimentId = mockResolve()
      target.dependentVariableService.batchCreateDependentVariables = mockReject(error)

      return target.persistVariablesWithoutLevels(1, [{}], testContext, false, testTx).then(() => {}, (err) => {
        expect(target.dependentVariableService.deleteDependentVariablesForExperimentId).toHaveBeenCalledWith(1, false, {}, testTx)
        expect(target.dependentVariableService.batchCreateDependentVariables).toHaveBeenCalledWith([{}], testContext, testTx)
        expect(err).toEqual(error)
      })
    })

    test('rejects when deleteDependentVariablesForExperimentId fails', () => {
      const error = { message: 'error' }
      target.dependentVariableService.deleteDependentVariablesForExperimentId = mockReject(error)
      target.dependentVariableService.batchCreateDependentVariables = mock()

      return target.persistVariablesWithoutLevels(1, [{}], testContext, false, testTx).then(() => {}, (err) => {
        expect(target.dependentVariableService.deleteDependentVariablesForExperimentId).toHaveBeenCalledWith(1, false, {}, testTx)
        expect(target.dependentVariableService.batchCreateDependentVariables).not.toHaveBeenCalled()
        expect(err).toEqual(error)
      })
    })
  })

  describe('persistDependentVariables', () => {
    test('maps DTOs to entities and calls persist method', () => {
      FactorDependentCompositeService.mapDependentVariableDTO2DbEntity = mock([{ entity: true }])
      target.persistVariablesWithoutLevels = mockResolve()

      return target.persistDependentVariables([{}], 42, testContext, false, testTx)
        .then(() => {
          expect(FactorDependentCompositeService.mapDependentVariableDTO2DbEntity)
            .toHaveBeenCalledWith([{}], 42)
          expect(target.persistVariablesWithoutLevels).toHaveBeenCalledWith(42, [{ entity: true }], testContext, false, testTx)
        })
    })
  })

  describe('persistAllVariables', () => {
    beforeEach(() => {
      target.factorTypeService.getAllFactorTypes = mockResolve([
        {
          id: 1,
          type: 'Independent',
        },
      ])
      target.refDataSourceService.getRefDataSources = mockResolve([
        { name: 'Other', id: 1 },
        { name: 'Catalog', id: 2 },
        { name: 'Custom', id: 3 },
      ])
      target.securityService.permissionsCheck = mockResolve()
      target.variablesValidator.validate = mockResolve()
    })

    afterEach(() => {
      expect(target.refDataSourceService.getRefDataSources).toHaveBeenCalledTimes(1)
    })

    test('persists new factors and levels without associations', () => {
      FactorService.getFactorsByExperimentIdNoExistenceCheck = mockResolve([])
      FactorLevelService.getFactorLevelsByExperimentIdNoExistenceCheck = mockResolve([])
      FactorLevelAssociationService.getFactorLevelAssociationByExperimentId = mockResolve([])
      target.factorService.batchCreateFactors = mockResolve([{ id: 1 }, { id: 2 }])
      target.factorLevelService.batchCreateFactorLevels = mockResolve([{ id: 11 }, { id: 12 }, { id: 21 }, { id: 22 }])
      target.factorService.batchUpdateFactors = mockResolve()
      target.factorLevelService.batchUpdateFactorLevels = mockResolve()
      target.factorService.batchDeleteFactors = mockResolve()
      target.factorLevelService.batchDeleteFactorLevels = mockResolve()
      target.dependentVariableService.deleteDependentVariablesForExperimentId = mockResolve()
      target.dependentVariableService.batchCreateDependentVariables = mockResolve()
      FactorLevelAssociationService.batchDeleteFactorLevelAssociations = mockResolve()
      target.factorLevelAssociationService.batchCreateFactorLevelAssociations = mockResolve()

      const experimentVariables = {
        independent: [
          {
            name: 'Factor1',
            levels: [
              {
                items: [
                  {
                    label: 'Factor1',
                    text: 'F11',
                    propertyTypeId: 1,
                  },
                ],
              },
              {
                items: [
                  {
                    label: 'Factor1',
                    text: 'F12',
                    propertyTypeId: 1,
                  },
                ],
              },
            ],
            tier: null,
          },
          {
            name: 'Factor2',
            levels: [
              {
                items: [
                  {
                    label: 'Chem',
                    text: 'MON123',
                    propertyTypeId: 2,
                  },
                  {
                    label: 'Rate',
                    text: '1.23',
                    propertyTypeId: 1,
                  },
                ],
              },
              {
                items: [
                  {
                    label: 'Chem',
                    text: 'MON456',
                    propertyTypeId: 2,
                  },
                  {
                    label: 'Rate',
                    text: '4.56',
                    propertyTypeId: 1,
                  },
                ],
              },
            ],
            tier: null,
          },
        ],
        dependent: [],
        independentAssociations: [],
      }

      return target.persistAllVariables(experimentVariables, 42, testContext, false, testTx).then(() => {
        expect(FactorService.getFactorsByExperimentIdNoExistenceCheck).toHaveBeenCalledWith(42, testTx)
        expect(FactorLevelService.getFactorLevelsByExperimentIdNoExistenceCheck).toHaveBeenCalledWith(42, testTx)
        expect(FactorLevelAssociationService.getFactorLevelAssociationByExperimentId).toHaveBeenCalledWith(42, testTx)
        expect(target.securityService.permissionsCheck).toHaveBeenCalledWith(42, testContext, false, testTx)
        expect(target.variablesValidator.validate).toHaveBeenCalledWith(experimentVariables, 'POST', testTx)
        expect(target.factorService.batchCreateFactors).toHaveBeenCalledWith([
          {
            experimentId: 42,
            name: 'Factor1',
            refDataSourceId: 1,
            refFactorTypeId: 1,
            tier: null,
          },
          {
            experimentId: 42,
            name: 'Factor2',
            refDataSourceId: 3,
            refFactorTypeId: 1,
            tier: null,
          },
        ], testContext, testTx)
        expect(target.factorLevelService.batchCreateFactorLevels).toHaveBeenCalledWith([
          {
            factorId: 1,
            value: {
              items: [
                {
                  label: 'Factor1',
                  text: 'F11',
                  propertyTypeId: 1,
                },
              ],
            },
          },
          {
            factorId: 1,
            value: {
              items: [
                {
                  label: 'Factor1',
                  text: 'F12',
                  propertyTypeId: 1,
                },
              ],
            },
          },
          {
            factorId: 2,
            value: {
              items: [
                {
                  label: 'Chem',
                  text: 'MON123',
                  propertyTypeId: 2,
                },
                {
                  label: 'Rate',
                  text: '1.23',
                  propertyTypeId: 1,
                },
              ],
            },
          },
          {
            factorId: 2,
            value: {
              items: [
                {
                  label: 'Chem',
                  text: 'MON456',
                  propertyTypeId: 2,
                },
                {
                  label: 'Rate',
                  text: '4.56',
                  propertyTypeId: 1,
                },
              ],
            },
          },
        ], testContext, testTx)
        expect(target.factorService.batchUpdateFactors).not.toHaveBeenCalled()
        expect(target.factorLevelService.batchUpdateFactorLevels).not.toHaveBeenCalled()
        expect(target.factorService.batchDeleteFactors).not.toHaveBeenCalled()
        expect(target.factorLevelService.batchDeleteFactorLevels).not.toHaveBeenCalled()
        expect(target.dependentVariableService.deleteDependentVariablesForExperimentId).toHaveBeenCalledWith(42, false, {}, testTx)
        expect(target.dependentVariableService.batchCreateDependentVariables).not.toHaveBeenCalled()
        expect(FactorLevelAssociationService.batchDeleteFactorLevelAssociations).not.toHaveBeenCalled()
        expect(target.factorLevelAssociationService.batchCreateFactorLevelAssociations).not.toHaveBeenCalled()
      })
    })

    test('persists new factors and levels with associations', () => {
      FactorService.getFactorsByExperimentIdNoExistenceCheck = mockResolve([])
      FactorLevelService.getFactorLevelsByExperimentIdNoExistenceCheck = mockResolve([])
      FactorLevelAssociationService.getFactorLevelAssociationByExperimentId = mockResolve([])
      target.factorService.batchCreateFactors = mockResolve([{ id: 1 }, { id: 2 }])
      target.factorLevelService.batchCreateFactorLevels = mockResolve([{ id: 11 }, { id: 12 }, { id: 21 }, { id: 22 }])
      target.factorService.batchUpdateFactors = mockResolve()
      target.factorLevelService.batchUpdateFactorLevels = mockResolve()
      target.factorService.batchDeleteFactors = mockResolve()
      target.factorLevelService.batchDeleteFactorLevels = mockResolve()
      target.dependentVariableService.deleteDependentVariablesForExperimentId = mockResolve()
      target.dependentVariableService.batchCreateDependentVariables = mockResolve()
      FactorLevelAssociationService.batchDeleteFactorLevelAssociations = mockResolve()
      target.factorLevelAssociationService.batchCreateFactorLevelAssociations = mockResolve()

      const experimentVariables = {
        independent: [
          {
            name: 'Factor1',
            levels: [
              {
                _refId: 1,
                items: [
                  {
                    label: 'Factor1',
                    text: 'F11',
                    propertyTypeId: 1,
                  },
                ],
              },
              {
                _refId: 2,
                items: [
                  {
                    label: 'Factor1',
                    text: 'F12',
                    propertyTypeId: 1,
                  },
                ],
              },
            ],
            tier: null,
          },
          {
            name: 'Factor2',
            levels: [
              {
                _refId: 3,
                items: [
                  {
                    label: 'Factor2',
                    text: 'F21',
                    propertyTypeId: 1,
                  },
                ],
              },
              {
                _refId: 4,
                items: [
                  {
                    label: 'Factor2',
                    text: 'F22',
                    propertyTypeId: 1,
                  },
                ],
              },
            ],
            tier: null,
          },
        ],
        dependent: [],
        independentAssociations: [
          {
            associatedLevelRefId: 1,
            nestedLevelRefId: 3,
          },
          {
            associatedLevelRefId: 2,
            nestedLevelRefId: 4,
          },
        ],
      }

      return target.persistAllVariables(experimentVariables, 42, testContext, false, testTx).then(() => {
        expect(FactorService.getFactorsByExperimentIdNoExistenceCheck).toHaveBeenCalledWith(42, testTx)
        expect(FactorLevelService.getFactorLevelsByExperimentIdNoExistenceCheck).toHaveBeenCalledWith(42, testTx)
        expect(FactorLevelAssociationService.getFactorLevelAssociationByExperimentId).toHaveBeenCalledWith(42, testTx)
        expect(target.securityService.permissionsCheck).toHaveBeenCalledWith(42, testContext, false, testTx)
        expect(target.variablesValidator.validate).toHaveBeenCalledWith(experimentVariables, 'POST', testTx)
        expect(target.factorService.batchCreateFactors).toHaveBeenCalledWith([
          {
            experimentId: 42,
            name: 'Factor1',
            refDataSourceId: 1,
            refFactorTypeId: 1,
            tier: null,
          },
          {
            experimentId: 42,
            name: 'Factor2',
            refDataSourceId: 1,
            refFactorTypeId: 1,
            tier: null,
          },
        ], testContext, testTx)
        expect(target.factorLevelService.batchCreateFactorLevels).toHaveBeenCalledWith([
          {
            factorId: 1,
            value: {
              items: [
                {
                  label: 'Factor1',
                  text: 'F11',
                  propertyTypeId: 1,
                },
              ],
            },
          },
          {
            factorId: 1,
            value: {
              items: [
                {
                  label: 'Factor1',
                  text: 'F12',
                  propertyTypeId: 1,
                },
              ],
            },
          },
          {
            factorId: 2,
            value: {
              items: [
                {
                  label: 'Factor2',
                  text: 'F21',
                  propertyTypeId: 1,
                },
              ],
            },
          },
          {
            factorId: 2,
            value: {
              items: [
                {
                  label: 'Factor2',
                  text: 'F22',
                  propertyTypeId: 1,
                },
              ],
            },
          },
        ], testContext, testTx)
        expect(target.factorService.batchUpdateFactors).not.toHaveBeenCalled()
        expect(target.factorLevelService.batchUpdateFactorLevels).not.toHaveBeenCalled()
        expect(target.factorService.batchDeleteFactors).not.toHaveBeenCalled()
        expect(target.factorLevelService.batchDeleteFactorLevels).not.toHaveBeenCalled()
        expect(target.dependentVariableService.deleteDependentVariablesForExperimentId).toHaveBeenCalledWith(42, false, {}, testTx)
        expect(target.dependentVariableService.batchCreateDependentVariables).not.toHaveBeenCalled()
        expect(FactorLevelAssociationService.batchDeleteFactorLevelAssociations).not.toHaveBeenCalled()
        expect(target.factorLevelAssociationService.batchCreateFactorLevelAssociations).toHaveBeenCalledWith([
          {
            associatedLevelId: 11,
            nestedLevelId: 21,
          },
          {
            associatedLevelId: 12,
            nestedLevelId: 22,
          },
        ], testContext, testTx)
      })
    })

    test('updates factor and factor levels without associations', () => {
      FactorService.getFactorsByExperimentIdNoExistenceCheck = mockResolve([
        {
          id: 1,
          name: 'Factor1',
          tier: null,
        },
        {
          id: 2,
          name: 'Factor1',
          tier: null,
        },
      ])
      FactorLevelService.getFactorLevelsByExperimentIdNoExistenceCheck = mockResolve([
        {
          id: 11,
        },
        {
          id: 12,
        },
        {
          id: 21,
        },
        {
          id: 22,
        },
      ])
      FactorLevelAssociationService.getFactorLevelAssociationByExperimentId = mockResolve([])
      target.factorService.batchCreateFactors = mockResolve()
      target.factorLevelService.batchCreateFactorLevels = mockResolve()
      target.factorService.batchUpdateFactors = mockResolve()
      target.factorLevelService.batchUpdateFactorLevels = mockResolve()
      target.factorService.batchDeleteFactors = mockResolve()
      target.factorLevelService.batchDeleteFactorLevels = mockResolve()
      target.dependentVariableService.deleteDependentVariablesForExperimentId = mockResolve()
      target.dependentVariableService.batchCreateDependentVariables = mockResolve()
      FactorLevelAssociationService.batchDeleteFactorLevelAssociations = mockResolve()
      target.factorLevelAssociationService.batchCreateFactorLevelAssociations = mockResolve()

      const experimentVariables = {
        independent: [
          {
            id: 1,
            name: 'Factor1',
            levels: [
              {
                id: 11,
                _refId: 1,
                items: [
                  {
                    label: 'Factor1',
                    text: 'F11',
                    propertyTypeId: 1,
                  },
                ],
              },
              {
                id: 12,
                _refId: 2,
                items: [
                  {
                    label: 'Factor1',
                    text: 'F12',
                    propertyTypeId: 1,
                  },
                ],
              },
            ],
            tier: null,
          },
          {
            id: 2,
            name: 'Factor2',
            levels: [
              {
                id: 21,
                items: [
                  {
                    label: 'Chem',
                    text: 'MON123',
                    propertyTypeId: 2,
                  },
                  {
                    label: 'Rate',
                    text: '1.23',
                    propertyTypeId: 1,
                  },
                ],
              },
              {
                id: 22,
                items: [
                  {
                    label: 'Chem',
                    text: 'MON456',
                    propertyTypeId: 2,
                  },
                  {
                    label: 'Rate',
                    text: '4.56',
                    propertyTypeId: 1,
                  },
                ],
              },
            ],
            tier: null,
          },
        ],
        dependent: [],
        independentAssociations: [],
      }

      return target.persistAllVariables(experimentVariables, 42, testContext, false, testTx).then(() => {
        expect(FactorService.getFactorsByExperimentIdNoExistenceCheck).toHaveBeenCalledWith(42, testTx)
        expect(FactorLevelService.getFactorLevelsByExperimentIdNoExistenceCheck).toHaveBeenCalledWith(42, testTx)
        expect(FactorLevelAssociationService.getFactorLevelAssociationByExperimentId).toHaveBeenCalledWith(42, testTx)
        expect(target.securityService.permissionsCheck).toHaveBeenCalledWith(42, testContext, false, testTx)
        expect(target.variablesValidator.validate).toHaveBeenCalledWith(experimentVariables, 'POST', testTx)
        expect(target.factorService.batchCreateFactors).not.toHaveBeenCalled()
        expect(target.factorLevelService.batchCreateFactorLevels).not.toHaveBeenCalled()
        expect(target.factorService.batchUpdateFactors).toHaveBeenCalledWith([
          {
            id: 1,
            experimentId: 42,
            name: 'Factor1',
            refDataSourceId: 1,
            refFactorTypeId: 1,
            tier: null,
          },
          {
            id: 2,
            experimentId: 42,
            name: 'Factor2',
            refDataSourceId: 3,
            refFactorTypeId: 1,
            tier: null,
          },
        ], testContext, testTx)
        expect(target.factorLevelService.batchUpdateFactorLevels).toHaveBeenCalledWith([
          {
            id: 11,
            factorId: 1,
            value: {
              items: [
                {
                  label: 'Factor1',
                  text: 'F11',
                  propertyTypeId: 1,
                },
              ],
            },
          },
          {
            id: 12,
            factorId: 1,
            value: {
              items: [
                {
                  label: 'Factor1',
                  text: 'F12',
                  propertyTypeId: 1,
                },
              ],
            },
          },
          {
            id: 21,
            factorId: 2,
            value: {
              items: [
                {
                  label: 'Chem',
                  text: 'MON123',
                  propertyTypeId: 2,
                },
                {
                  label: 'Rate',
                  text: '1.23',
                  propertyTypeId: 1,
                },
              ],
            },
          },
          {
            id: 22,
            factorId: 2,
            value: {
              items: [
                {
                  label: 'Chem',
                  text: 'MON456',
                  propertyTypeId: 2,
                },
                {
                  label: 'Rate',
                  text: '4.56',
                  propertyTypeId: 1,
                },
              ],
            },
          },
        ], testContext, testTx)
        expect(target.factorService.batchDeleteFactors).not.toHaveBeenCalled()
        expect(target.factorLevelService.batchDeleteFactorLevels).not.toHaveBeenCalled()
        expect(target.dependentVariableService.deleteDependentVariablesForExperimentId).toHaveBeenCalledWith(42, false, {}, testTx)
        expect(target.dependentVariableService.batchCreateDependentVariables).not.toHaveBeenCalled()
        expect(FactorLevelAssociationService.batchDeleteFactorLevelAssociations).not.toHaveBeenCalled()
        expect(target.factorLevelAssociationService.batchCreateFactorLevelAssociations).not.toHaveBeenCalled()
      })
    })

    test('updates factors and levels with associations', () => {
      FactorService.getFactorsByExperimentIdNoExistenceCheck = mockResolve([
        {
          id: 1,
          name: 'Factor1',
          tier: null,
        },
        {
          id: 2,
          name: 'Factor1',
          tier: null,
        },
      ])
      FactorLevelService.getFactorLevelsByExperimentIdNoExistenceCheck = mockResolve([
        {
          id: 11,
        },
        {
          id: 12,
        },
        {
          id: 21,
        },
        {
          id: 22,
        },
      ])
      FactorLevelAssociationService.getFactorLevelAssociationByExperimentId = mockResolve([
        {
          id: 91,
          associated_level_id: 11,
          nested_level_id: 21,
        },
        {
          id: 92,
          associated_level_id: 12,
          nested_level_id: 22,
        },
      ])
      target.factorService.batchCreateFactors = mockResolve()
      target.factorLevelService.batchCreateFactorLevels = mockResolve()
      target.factorService.batchUpdateFactors = mockResolve()
      target.factorLevelService.batchUpdateFactorLevels = mockResolve()
      target.factorService.batchDeleteFactors = mockResolve()
      target.factorLevelService.batchDeleteFactorLevels = mockResolve()
      target.dependentVariableService.deleteDependentVariablesForExperimentId = mockResolve()
      target.dependentVariableService.batchCreateDependentVariables = mockResolve()
      FactorLevelAssociationService.batchDeleteFactorLevelAssociations = mockResolve()
      target.factorLevelAssociationService.batchCreateFactorLevelAssociations = mockResolve()

      const experimentVariables = {
        independent: [
          {
            id: 1,
            name: 'Factor1',
            levels: [
              {
                id: 11,
                _refId: 1,
                items: [
                  {
                    label: 'Factor1',
                    text: 'F11',
                    propertyTypeId: 1,
                  },
                ],
              },
              {
                id: 12,
                _refId: 2,
                items: [
                  {
                    label: 'Factor1',
                    text: 'F12',
                    propertyTypeId: 1,
                  },
                ],
              },
            ],
            tier: null,
          },
          {
            id: 2,
            name: 'Factor2',
            levels: [
              {
                id: 21,
                _refId: 3,
                items: [
                  {
                    label: 'Factor2',
                    text: 'F21',
                    propertyTypeId: 1,
                  },
                ],
              },
              {
                id: 22,
                _refId: 4,
                items: [
                  {
                    label: 'Factor2',
                    text: 'F22',
                    propertyTypeId: 1,
                  },
                ],
              },
            ],
            tier: null,
          },
        ],
        dependent: [],
        independentAssociations: [
          {
            associatedLevelRefId: 1,
            nestedLevelRefId: 3,
          },
          {
            associatedLevelRefId: 2,
            nestedLevelRefId: 4,
          },
        ],
      }

      return target.persistAllVariables(experimentVariables, 42, testContext, false, testTx).then(() => {
        expect(FactorService.getFactorsByExperimentIdNoExistenceCheck).toHaveBeenCalledWith(42, testTx)
        expect(FactorLevelService.getFactorLevelsByExperimentIdNoExistenceCheck).toHaveBeenCalledWith(42, testTx)
        expect(FactorLevelAssociationService.getFactorLevelAssociationByExperimentId).toHaveBeenCalledWith(42, testTx)
        expect(target.securityService.permissionsCheck).toHaveBeenCalledWith(42, testContext, false, testTx)
        expect(target.variablesValidator.validate).toHaveBeenCalledWith(experimentVariables, 'POST', testTx)
        expect(target.factorService.batchCreateFactors).not.toHaveBeenCalled()
        expect(target.factorLevelService.batchCreateFactorLevels).not.toHaveBeenCalled()
        expect(target.factorService.batchUpdateFactors).toHaveBeenCalledWith([
          {
            id: 1,
            experimentId: 42,
            name: 'Factor1',
            refDataSourceId: 1,
            refFactorTypeId: 1,
            tier: null,
          },
          {
            id: 2,
            experimentId: 42,
            name: 'Factor2',
            refDataSourceId: 1,
            refFactorTypeId: 1,
            tier: null,
          },
        ], testContext, testTx)
        expect(target.factorLevelService.batchUpdateFactorLevels).toHaveBeenCalledWith([
          {
            id: 11,
            factorId: 1,
            value: {
              items: [
                {
                  label: 'Factor1',
                  text: 'F11',
                  propertyTypeId: 1,
                },
              ],
            },
          },
          {
            id: 12,
            factorId: 1,
            value: {
              items: [
                {
                  label: 'Factor1',
                  text: 'F12',
                  propertyTypeId: 1,
                },
              ],
            },
          },
          {
            id: 21,
            factorId: 2,
            value: {
              items: [
                {
                  label: 'Factor2',
                  text: 'F21',
                  propertyTypeId: 1,
                },
              ],
            },
          },
          {
            id: 22,
            factorId: 2,
            value: {
              items: [
                {
                  label: 'Factor2',
                  text: 'F22',
                  propertyTypeId: 1,
                },
              ],
            },
          },
        ], testContext, testTx)
        expect(target.factorService.batchDeleteFactors).not.toHaveBeenCalled()
        expect(target.factorLevelService.batchDeleteFactorLevels).not.toHaveBeenCalled()
        expect(target.dependentVariableService.deleteDependentVariablesForExperimentId).toHaveBeenCalledWith(42, false, {}, testTx)
        expect(target.dependentVariableService.batchCreateDependentVariables).not.toHaveBeenCalled()
        expect(FactorLevelAssociationService.batchDeleteFactorLevelAssociations).not.toHaveBeenCalled()
        expect(target.factorLevelAssociationService.batchCreateFactorLevelAssociations).not.toHaveBeenCalled()
      })
    })

    test('deletes factors without associations', () => {
      FactorService.getFactorsByExperimentIdNoExistenceCheck = mockResolve([
        {
          id: 1,
          name: 'Factor1',
          tier: null,
        },
        {
          id: 2,
          name: 'Factor1',
          tier: null,
        },
      ])
      FactorLevelService.getFactorLevelsByExperimentIdNoExistenceCheck = mockResolve([
        {
          id: 11,
        },
        {
          id: 12,
        },
        {
          id: 21,
        },
        {
          id: 22,
        },
      ])
      FactorLevelAssociationService.getFactorLevelAssociationByExperimentId = mockResolve([])
      target.factorService.batchCreateFactors = mockResolve()
      target.factorLevelService.batchCreateFactorLevels = mockResolve()
      target.factorService.batchUpdateFactors = mockResolve()
      target.factorLevelService.batchUpdateFactorLevels = mockResolve()
      target.factorService.batchDeleteFactors = mockResolve()
      target.factorLevelService.batchDeleteFactorLevels = mockResolve()
      target.dependentVariableService.deleteDependentVariablesForExperimentId = mockResolve()
      target.dependentVariableService.batchCreateDependentVariables = mockResolve()
      FactorLevelAssociationService.batchDeleteFactorLevelAssociations = mockResolve()
      target.factorLevelAssociationService.batchCreateFactorLevelAssociations = mockResolve()

      const experimentVariables = {
        independent: [
          {
            id: 1,
            name: 'Factor1',
            levels: [
              {
                id: 11,
                _refId: 1,
                items: [
                  {
                    label: 'Factor1',
                    text: 'F11',
                    propertyTypeId: 1,
                  },
                ],
              },
              {
                id: 12,
                _refId: 2,
                items: [
                  {
                    label: 'Factor1',
                    text: 'F12',
                    propertyTypeId: 1,
                  },
                ],
              },
            ],
            tier: null,
          },
        ],
        dependent: [],
        independentAssociations: [],
      }

      return target.persistAllVariables(experimentVariables, 42, testContext, false, testTx).then(() => {
        expect(FactorService.getFactorsByExperimentIdNoExistenceCheck).toHaveBeenCalledWith(42, testTx)
        expect(FactorLevelService.getFactorLevelsByExperimentIdNoExistenceCheck).toHaveBeenCalledWith(42, testTx)
        expect(FactorLevelAssociationService.getFactorLevelAssociationByExperimentId).toHaveBeenCalledWith(42, testTx)
        expect(target.securityService.permissionsCheck).toHaveBeenCalledWith(42, testContext, false, testTx)
        expect(target.variablesValidator.validate).toHaveBeenCalledWith(experimentVariables, 'POST', testTx)
        expect(target.factorService.batchCreateFactors).not.toHaveBeenCalled()
        expect(target.factorLevelService.batchCreateFactorLevels).not.toHaveBeenCalled()
        expect(target.factorService.batchUpdateFactors).toHaveBeenCalledWith([
          {
            id: 1,
            experimentId: 42,
            name: 'Factor1',
            refDataSourceId: 1,
            refFactorTypeId: 1,
            tier: null,
          },
        ], testContext, testTx)
        expect(target.factorLevelService.batchUpdateFactorLevels).toHaveBeenCalledWith([
          {
            id: 11,
            factorId: 1,
            value: {
              items: [
                {
                  label: 'Factor1',
                  text: 'F11',
                  propertyTypeId: 1,
                },
              ],
            },
          },
          {
            id: 12,
            factorId: 1,
            value: {
              items: [
                {
                  label: 'Factor1',
                  text: 'F12',
                  propertyTypeId: 1,
                },
              ],
            },
          },
        ], testContext, testTx)
        expect(target.factorService.batchDeleteFactors).toHaveBeenCalledWith([2], {}, testTx)
        expect(target.factorLevelService.batchDeleteFactorLevels).toHaveBeenCalledWith([21, 22], {}, testTx)
        expect(target.dependentVariableService.deleteDependentVariablesForExperimentId).toHaveBeenCalledWith(42, false, {}, testTx)
        expect(target.dependentVariableService.batchCreateDependentVariables).not.toHaveBeenCalled()
        expect(FactorLevelAssociationService.batchDeleteFactorLevelAssociations).not.toHaveBeenCalled()
        expect(target.factorLevelAssociationService.batchCreateFactorLevelAssociations).not.toHaveBeenCalled()
      })
    })

    test('deletes factor levels without associations', () => {
      FactorService.getFactorsByExperimentIdNoExistenceCheck = mockResolve([
        {
          id: 1,
          name: 'Factor1',
          tier: null,
        },
      ])
      FactorLevelService.getFactorLevelsByExperimentIdNoExistenceCheck = mockResolve([
        {
          id: 11,
        },
        {
          id: 12,
        },
      ])
      FactorLevelAssociationService.getFactorLevelAssociationByExperimentId = mockResolve([])
      target.factorService.batchCreateFactors = mockResolve()
      target.factorLevelService.batchCreateFactorLevels = mockResolve()
      target.factorService.batchUpdateFactors = mockResolve()
      target.factorLevelService.batchUpdateFactorLevels = mockResolve()
      target.factorService.batchDeleteFactors = mockResolve()
      target.factorLevelService.batchDeleteFactorLevels = mockResolve()
      target.dependentVariableService.deleteDependentVariablesForExperimentId = mockResolve()
      target.dependentVariableService.batchCreateDependentVariables = mockResolve()
      FactorLevelAssociationService.batchDeleteFactorLevelAssociations = mockResolve()
      target.factorLevelAssociationService.batchCreateFactorLevelAssociations = mockResolve()

      const experimentVariables = {
        independent: [
          {
            id: 1,
            name: 'Factor1',
            levels: [
              {
                id: 11,
                _refId: 1,
                items: [
                  {
                    label: 'Factor1',
                    text: 'F11',
                    propertyTypeId: 1,
                  },
                ],
              },
            ],
            tier: null,
          },
        ],
        dependent: [],
        independentAssociations: [],
      }

      return target.persistAllVariables(experimentVariables, 42, testContext, false, testTx).then(() => {
        expect(FactorService.getFactorsByExperimentIdNoExistenceCheck).toHaveBeenCalledWith(42, testTx)
        expect(FactorLevelService.getFactorLevelsByExperimentIdNoExistenceCheck).toHaveBeenCalledWith(42, testTx)
        expect(FactorLevelAssociationService.getFactorLevelAssociationByExperimentId).toHaveBeenCalledWith(42, testTx)
        expect(target.securityService.permissionsCheck).toHaveBeenCalledWith(42, testContext, false, testTx)
        expect(target.variablesValidator.validate).toHaveBeenCalledWith(experimentVariables, 'POST', testTx)
        expect(target.factorService.batchCreateFactors).not.toHaveBeenCalled()
        expect(target.factorLevelService.batchCreateFactorLevels).not.toHaveBeenCalled()
        expect(target.factorService.batchUpdateFactors).toHaveBeenCalledWith([
          {
            id: 1,
            experimentId: 42,
            name: 'Factor1',
            refDataSourceId: 1,
            refFactorTypeId: 1,
            tier: null,
          },
        ], testContext, testTx)
        expect(target.factorLevelService.batchUpdateFactorLevels).toHaveBeenCalledWith([
          {
            id: 11,
            factorId: 1,
            value: {
              items: [
                {
                  label: 'Factor1',
                  text: 'F11',
                  propertyTypeId: 1,
                },
              ],
            },
          },
        ], testContext, testTx)
        expect(target.factorService.batchDeleteFactors).not.toHaveBeenCalled()
        expect(target.factorLevelService.batchDeleteFactorLevels).toHaveBeenCalledWith([12], {}, testTx)
        expect(target.dependentVariableService.deleteDependentVariablesForExperimentId).toHaveBeenCalledWith(42, false, {}, testTx)
        expect(target.dependentVariableService.batchCreateDependentVariables).not.toHaveBeenCalled()
        expect(FactorLevelAssociationService.batchDeleteFactorLevelAssociations).not.toHaveBeenCalled()
        expect(target.factorLevelAssociationService.batchCreateFactorLevelAssociations).not.toHaveBeenCalled()
      })
    })

    test('handles deleting all independent variables and associations', () => {
      FactorService.getFactorsByExperimentIdNoExistenceCheck = mockResolve([
        {
          id: 1,
          name: 'Factor1',
          tier: null,
        },
        {
          id: 2,
          name: 'Factor1',
          tier: null,
        },
      ])
      FactorLevelService.getFactorLevelsByExperimentIdNoExistenceCheck = mockResolve([
        {
          id: 11,
        },
        {
          id: 12,
        },
        {
          id: 21,
        },
        {
          id: 22,
        },
      ])
      FactorLevelAssociationService.getFactorLevelAssociationByExperimentId = mockResolve([
        {
          id: 91,
          associated_level_id: 11,
          nested_level_id: 21,
        },
        {
          id: 92,
          associated_level_id: 12,
          nested_level_id: 22,
        },
      ])
      target.factorService.batchCreateFactors = mockResolve()
      target.factorLevelService.batchCreateFactorLevels = mockResolve()
      target.factorService.batchUpdateFactors = mockResolve()
      target.factorLevelService.batchUpdateFactorLevels = mockResolve()
      target.factorService.batchDeleteFactors = mockResolve()
      target.factorLevelService.batchDeleteFactorLevels = mockResolve()
      target.dependentVariableService.deleteDependentVariablesForExperimentId = mockResolve()
      target.dependentVariableService.batchCreateDependentVariables = mockResolve()
      FactorLevelAssociationService.batchDeleteFactorLevelAssociations = mockResolve()
      target.factorLevelAssociationService.batchCreateFactorLevelAssociations = mockResolve()

      const experimentVariables = {
        independent: [],
        dependent: [],
        independentAssociations: [],
      }

      return target.persistAllVariables(experimentVariables, 42, testContext, false, testTx).then(() => {
        expect(FactorService.getFactorsByExperimentIdNoExistenceCheck).toHaveBeenCalledWith(42, testTx)
        expect(FactorLevelService.getFactorLevelsByExperimentIdNoExistenceCheck).toHaveBeenCalledWith(42, testTx)
        expect(FactorLevelAssociationService.getFactorLevelAssociationByExperimentId).toHaveBeenCalledWith(42, testTx)
        expect(target.securityService.permissionsCheck).toHaveBeenCalledWith(42, testContext, false, testTx)
        expect(target.variablesValidator.validate).toHaveBeenCalledWith(experimentVariables, 'POST', testTx)
        expect(target.factorService.batchCreateFactors).not.toHaveBeenCalled()
        expect(target.factorLevelService.batchCreateFactorLevels).not.toHaveBeenCalled()
        expect(target.factorService.batchUpdateFactors).not.toHaveBeenCalled()
        expect(target.factorLevelService.batchUpdateFactorLevels).not.toHaveBeenCalledWith()
        expect(target.factorService.batchDeleteFactors).toHaveBeenCalledWith([1, 2], {}, testTx)
        expect(target.factorLevelService.batchDeleteFactorLevels).toHaveBeenCalledWith([11, 12, 21, 22], {}, testTx)
        expect(target.dependentVariableService.deleteDependentVariablesForExperimentId).toHaveBeenCalledWith(42, false, {}, testTx)
        expect(target.dependentVariableService.batchCreateDependentVariables).not.toHaveBeenCalled()
        expect(FactorLevelAssociationService.batchDeleteFactorLevelAssociations).toHaveBeenCalledWith([91, 92], testTx)
        expect(target.factorLevelAssociationService.batchCreateFactorLevelAssociations).not.toHaveBeenCalled()
      })
    })

    test('handles adding association to existing set', () => {
      FactorService.getFactorsByExperimentIdNoExistenceCheck = mockResolve([
        {
          id: 1,
          name: 'Factor1',
          tier: null,
        },
        {
          id: 2,
          name: 'Factor1',
          tier: null,
        },
      ])
      FactorLevelService.getFactorLevelsByExperimentIdNoExistenceCheck = mockResolve([
        {
          id: 11,
        },
        {
          id: 12,
        },
        {
          id: 21,
        },
        {
          id: 22,
        },
      ])
      FactorLevelAssociationService.getFactorLevelAssociationByExperimentId = mockResolve([
        {
          id: 91,
          associated_level_id: 11,
          nested_level_id: 21,
        },
      ])
      target.factorService.batchCreateFactors = mockResolve()
      target.factorLevelService.batchCreateFactorLevels = mockResolve()
      target.factorService.batchUpdateFactors = mockResolve()
      target.factorLevelService.batchUpdateFactorLevels = mockResolve()
      target.factorService.batchDeleteFactors = mockResolve()
      target.factorLevelService.batchDeleteFactorLevels = mockResolve()
      target.dependentVariableService.deleteDependentVariablesForExperimentId = mockResolve()
      target.dependentVariableService.batchCreateDependentVariables = mockResolve()
      FactorLevelAssociationService.batchDeleteFactorLevelAssociations = mockResolve()
      target.factorLevelAssociationService.batchCreateFactorLevelAssociations = mockResolve()

      const experimentVariables = {
        independent: [
          {
            id: 1,
            name: 'Factor1',
            levels: [
              {
                id: 11,
                _refId: 1,
                items: [
                  {
                    label: 'Factor1',
                    text: 'F11',
                    propertyTypeId: 1,
                  },
                ],
              },
              {
                id: 12,
                _refId: 2,
                items: [
                  {
                    label: 'Factor1',
                    text: 'F12',
                    propertyTypeId: 1,
                  },
                ],
              },
            ],
            tier: null,
          },
          {
            id: 2,
            name: 'Factor2',
            levels: [
              {
                id: 21,
                _refId: 3,
                items: [
                  {
                    label: 'Factor2',
                    text: 'F21',
                    propertyTypeId: 1,
                  },
                ],
              },
              {
                id: 22,
                _refId: 4,
                items: [
                  {
                    label: 'Factor2',
                    text: 'F22',
                    propertyTypeId: 1,
                  },
                ],
              },
            ],
            tier: null,
          },
        ],
        dependent: [],
        independentAssociations: [
          {
            associatedLevelRefId: 1,
            nestedLevelRefId: 3,
          },
          {
            associatedLevelRefId: 2,
            nestedLevelRefId: 4,
          },
        ],
      }

      return target.persistAllVariables(experimentVariables, 42, testContext, false, testTx).then(() => {
        expect(FactorService.getFactorsByExperimentIdNoExistenceCheck).toHaveBeenCalledWith(42, testTx)
        expect(FactorLevelService.getFactorLevelsByExperimentIdNoExistenceCheck).toHaveBeenCalledWith(42, testTx)
        expect(FactorLevelAssociationService.getFactorLevelAssociationByExperimentId).toHaveBeenCalledWith(42, testTx)
        expect(target.securityService.permissionsCheck).toHaveBeenCalledWith(42, testContext, false, testTx)
        expect(target.variablesValidator.validate).toHaveBeenCalledWith(experimentVariables, 'POST', testTx)
        expect(target.factorService.batchCreateFactors).not.toHaveBeenCalled()
        expect(target.factorLevelService.batchCreateFactorLevels).not.toHaveBeenCalled()
        expect(target.factorService.batchUpdateFactors).toHaveBeenCalledWith([
          {
            id: 1,
            experimentId: 42,
            name: 'Factor1',
            refDataSourceId: 1,
            refFactorTypeId: 1,
            tier: null,
          },
          {
            id: 2,
            experimentId: 42,
            name: 'Factor2',
            refDataSourceId: 1,
            refFactorTypeId: 1,
            tier: null,
          },
        ], testContext, testTx)
        expect(target.factorLevelService.batchUpdateFactorLevels).toHaveBeenCalledWith([
          {
            id: 11,
            factorId: 1,
            value: {
              items: [
                {
                  label: 'Factor1',
                  text: 'F11',
                  propertyTypeId: 1,
                },
              ],
            },
          },
          {
            id: 12,
            factorId: 1,
            value: {
              items: [
                {
                  label: 'Factor1',
                  text: 'F12',
                  propertyTypeId: 1,
                },
              ],
            },
          },
          {
            id: 21,
            factorId: 2,
            value: {
              items: [
                {
                  label: 'Factor2',
                  text: 'F21',
                  propertyTypeId: 1,
                },
              ],
            },
          },
          {
            id: 22,
            factorId: 2,
            value: {
              items: [
                {
                  label: 'Factor2',
                  text: 'F22',
                  propertyTypeId: 1,
                },
              ],
            },
          },
        ], testContext, testTx)
        expect(target.factorService.batchDeleteFactors).not.toHaveBeenCalled()
        expect(target.factorLevelService.batchDeleteFactorLevels).not.toHaveBeenCalled()
        expect(target.dependentVariableService.deleteDependentVariablesForExperimentId).toHaveBeenCalledWith(42, false, {}, testTx)
        expect(target.dependentVariableService.batchCreateDependentVariables).not.toHaveBeenCalled()
        expect(FactorLevelAssociationService.batchDeleteFactorLevelAssociations).not.toHaveBeenCalled()
        expect(target.factorLevelAssociationService.batchCreateFactorLevelAssociations).toHaveBeenCalledWith([
          {
            associatedLevelId: 12,
            nestedLevelId: 22,
          },
        ], testContext, testTx)
      })
    })

    test('handles removing association from existing set', () => {
      FactorService.getFactorsByExperimentIdNoExistenceCheck = mockResolve([
        {
          id: 1,
          name: 'Factor1',
          tier: null,
        },
        {
          id: 2,
          name: 'Factor1',
          tier: null,
        },
      ])
      FactorLevelService.getFactorLevelsByExperimentIdNoExistenceCheck = mockResolve([
        {
          id: 11,
        },
        {
          id: 12,
        },
        {
          id: 21,
        },
        {
          id: 22,
        },
      ])
      FactorLevelAssociationService.getFactorLevelAssociationByExperimentId = mockResolve([
        {
          id: 91,
          associated_level_id: 11,
          nested_level_id: 21,
        },
        {
          id: 92,
          associated_level_id: 12,
          nested_level_id: 22,
        },
      ])
      target.factorService.batchCreateFactors = mockResolve()
      target.factorLevelService.batchCreateFactorLevels = mockResolve()
      target.factorService.batchUpdateFactors = mockResolve()
      target.factorLevelService.batchUpdateFactorLevels = mockResolve()
      target.factorService.batchDeleteFactors = mockResolve()
      target.factorLevelService.batchDeleteFactorLevels = mockResolve()
      target.dependentVariableService.deleteDependentVariablesForExperimentId = mockResolve()
      target.dependentVariableService.batchCreateDependentVariables = mockResolve()
      FactorLevelAssociationService.batchDeleteFactorLevelAssociations = mockResolve()
      target.factorLevelAssociationService.batchCreateFactorLevelAssociations = mockResolve()

      const experimentVariables = {
        independent: [
          {
            id: 1,
            name: 'Factor1',
            levels: [
              {
                id: 11,
                _refId: 1,
                items: [
                  {
                    label: 'Factor1',
                    text: 'F11',
                    propertyTypeId: 1,
                  },
                ],
              },
              {
                id: 12,
                _refId: 2,
                items: [
                  {
                    label: 'Factor1',
                    text: 'F12',
                    propertyTypeId: 1,
                  },
                ],
              },
            ],
            tier: null,
          },
          {
            id: 2,
            name: 'Factor2',
            levels: [
              {
                id: 21,
                _refId: 3,
                items: [
                  {
                    label: 'Factor2',
                    text: 'F21',
                    propertyTypeId: 1,
                  },
                ],
              },
              {
                id: 22,
                _refId: 4,
                items: [
                  {
                    label: 'Factor2',
                    text: 'F22',
                    propertyTypeId: 1,
                  },
                ],
              },
            ],
            tier: null,
          },
        ],
        dependent: [],
        independentAssociations: [
          {
            associatedLevelRefId: 1,
            nestedLevelRefId: 3,
          },
        ],
      }

      return target.persistAllVariables(experimentVariables, 42, testContext, false, testTx).then(() => {
        expect(FactorService.getFactorsByExperimentIdNoExistenceCheck).toHaveBeenCalledWith(42, testTx)
        expect(FactorLevelService.getFactorLevelsByExperimentIdNoExistenceCheck).toHaveBeenCalledWith(42, testTx)
        expect(FactorLevelAssociationService.getFactorLevelAssociationByExperimentId).toHaveBeenCalledWith(42, testTx)
        expect(target.securityService.permissionsCheck).toHaveBeenCalledWith(42, testContext, false, testTx)
        expect(target.variablesValidator.validate).toHaveBeenCalledWith(experimentVariables, 'POST', testTx)
        expect(target.factorService.batchCreateFactors).not.toHaveBeenCalled()
        expect(target.factorLevelService.batchCreateFactorLevels).not.toHaveBeenCalled()
        expect(target.factorService.batchUpdateFactors).toHaveBeenCalledWith([
          {
            id: 1,
            experimentId: 42,
            name: 'Factor1',
            refDataSourceId: 1,
            refFactorTypeId: 1,
            tier: null,
          },
          {
            id: 2,
            experimentId: 42,
            name: 'Factor2',
            refDataSourceId: 1,
            refFactorTypeId: 1,
            tier: null,
          },
        ], testContext, testTx)
        expect(target.factorLevelService.batchUpdateFactorLevels).toHaveBeenCalledWith([
          {
            id: 11,
            factorId: 1,
            value: {
              items: [
                {
                  label: 'Factor1',
                  text: 'F11',
                  propertyTypeId: 1,
                },
              ],
            },
          },
          {
            id: 12,
            factorId: 1,
            value: {
              items: [
                {
                  label: 'Factor1',
                  text: 'F12',
                  propertyTypeId: 1,
                },
              ],
            },
          },
          {
            id: 21,
            factorId: 2,
            value: {
              items: [
                {
                  label: 'Factor2',
                  text: 'F21',
                  propertyTypeId: 1,
                },
              ],
            },
          },
          {
            id: 22,
            factorId: 2,
            value: {
              items: [
                {
                  label: 'Factor2',
                  text: 'F22',
                  propertyTypeId: 1,
                },
              ],
            },
          },
        ], testContext, testTx)
        expect(target.factorService.batchDeleteFactors).not.toHaveBeenCalled()
        expect(target.factorLevelService.batchDeleteFactorLevels).not.toHaveBeenCalled()
        expect(target.dependentVariableService.deleteDependentVariablesForExperimentId).toHaveBeenCalledWith(42, false, {}, testTx)
        expect(target.dependentVariableService.batchCreateDependentVariables).not.toHaveBeenCalled()
        expect(FactorLevelAssociationService.batchDeleteFactorLevelAssociations).toHaveBeenCalledWith([92], testTx)
        expect(target.factorLevelAssociationService.batchCreateFactorLevelAssociations).not.toHaveBeenCalled()
      })
    })

    test('handles adding to and removing from association set', () => {
      FactorService.getFactorsByExperimentIdNoExistenceCheck = mockResolve([
        {
          id: 1,
          name: 'Factor1',
          tier: null,
        },
        {
          id: 2,
          name: 'Factor1',
          tier: null,
        },
      ])
      FactorLevelService.getFactorLevelsByExperimentIdNoExistenceCheck = mockResolve([
        {
          id: 11,
        },
        {
          id: 12,
        },
        {
          id: 21,
        },
        {
          id: 22,
        },
      ])
      FactorLevelAssociationService.getFactorLevelAssociationByExperimentId = mockResolve([
        {
          id: 91,
          associated_level_id: 11,
          nested_level_id: 21,
        },
      ])
      target.factorService.batchCreateFactors = mockResolve()
      target.factorLevelService.batchCreateFactorLevels = mockResolve()
      target.factorService.batchUpdateFactors = mockResolve()
      target.factorLevelService.batchUpdateFactorLevels = mockResolve()
      target.factorService.batchDeleteFactors = mockResolve()
      target.factorLevelService.batchDeleteFactorLevels = mockResolve()
      target.dependentVariableService.deleteDependentVariablesForExperimentId = mockResolve()
      target.dependentVariableService.batchCreateDependentVariables = mockResolve()
      FactorLevelAssociationService.batchDeleteFactorLevelAssociations = mockResolve()
      target.factorLevelAssociationService.batchCreateFactorLevelAssociations = mockResolve()

      const experimentVariables = {
        independent: [
          {
            id: 1,
            name: 'Factor1',
            levels: [
              {
                id: 11,
                _refId: 1,
                items: [
                  {
                    label: 'Factor1',
                    text: 'F11',
                    propertyTypeId: 1,
                  },
                ],
              },
              {
                id: 12,
                _refId: 2,
                items: [
                  {
                    label: 'Factor1',
                    text: 'F12',
                    propertyTypeId: 1,
                  },
                ],
              },
            ],
            tier: null,
          },
          {
            id: 2,
            name: 'Factor2',
            levels: [
              {
                id: 21,
                _refId: 3,
                items: [
                  {
                    label: 'Factor2',
                    text: 'F21',
                    propertyTypeId: 1,
                  },
                ],
              },
              {
                id: 22,
                _refId: 4,
                items: [
                  {
                    label: 'Factor2',
                    text: 'F22',
                    propertyTypeId: 1,
                  },
                ],
              },
            ],
            tier: null,
          },
        ],
        dependent: [],
        independentAssociations: [
          {
            associatedLevelRefId: 2,
            nestedLevelRefId: 4,
          },
        ],
      }

      return target.persistAllVariables(experimentVariables, 42, testContext, false, testTx).then(() => {
        expect(FactorService.getFactorsByExperimentIdNoExistenceCheck).toHaveBeenCalledWith(42, testTx)
        expect(FactorLevelService.getFactorLevelsByExperimentIdNoExistenceCheck).toHaveBeenCalledWith(42, testTx)
        expect(FactorLevelAssociationService.getFactorLevelAssociationByExperimentId).toHaveBeenCalledWith(42, testTx)
        expect(target.securityService.permissionsCheck).toHaveBeenCalledWith(42, testContext, false, testTx)
        expect(target.variablesValidator.validate).toHaveBeenCalledWith(experimentVariables, 'POST', testTx)
        expect(target.factorService.batchCreateFactors).not.toHaveBeenCalled()
        expect(target.factorLevelService.batchCreateFactorLevels).not.toHaveBeenCalled()
        expect(target.factorService.batchUpdateFactors).toHaveBeenCalledWith([
          {
            id: 1,
            experimentId: 42,
            name: 'Factor1',
            refDataSourceId: 1,
            refFactorTypeId: 1,
            tier: null,
          },
          {
            id: 2,
            experimentId: 42,
            name: 'Factor2',
            refDataSourceId: 1,
            refFactorTypeId: 1,
            tier: null,
          },
        ], testContext, testTx)
        expect(target.factorLevelService.batchUpdateFactorLevels).toHaveBeenCalledWith([
          {
            id: 11,
            factorId: 1,
            value: {
              items: [
                {
                  label: 'Factor1',
                  text: 'F11',
                  propertyTypeId: 1,
                },
              ],
            },
          },
          {
            id: 12,
            factorId: 1,
            value: {
              items: [
                {
                  label: 'Factor1',
                  text: 'F12',
                  propertyTypeId: 1,
                },
              ],
            },
          },
          {
            id: 21,
            factorId: 2,
            value: {
              items: [
                {
                  label: 'Factor2',
                  text: 'F21',
                  propertyTypeId: 1,
                },
              ],
            },
          },
          {
            id: 22,
            factorId: 2,
            value: {
              items: [
                {
                  label: 'Factor2',
                  text: 'F22',
                  propertyTypeId: 1,
                },
              ],
            },
          },
        ], testContext, testTx)
        expect(target.factorService.batchDeleteFactors).not.toHaveBeenCalled()
        expect(target.factorLevelService.batchDeleteFactorLevels).not.toHaveBeenCalled()
        expect(target.dependentVariableService.deleteDependentVariablesForExperimentId).toHaveBeenCalledWith(42, false, {}, testTx)
        expect(target.dependentVariableService.batchCreateDependentVariables).not.toHaveBeenCalled()
        expect(FactorLevelAssociationService.batchDeleteFactorLevelAssociations).toHaveBeenCalledWith([91], testTx)
        expect(target.factorLevelAssociationService.batchCreateFactorLevelAssociations).toHaveBeenCalledWith([
          {
            associatedLevelId: 12,
            nestedLevelId: 22,
          },
        ], testContext, testTx)
      })
    })
  })
})
