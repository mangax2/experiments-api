import {
  kafkaProducerMocker, mock, mockReject, mockResolve, resolve,
} from '../jestUtil'
import DependentVariableService from '../../src/services/DependentVariableService'
import ExperimentsService from '../../src/services/ExperimentsService'
import FactorDependentCompositeService, {
  assembleIndependentAndExogenous,
  convertDbLevelToResponseFormat,
  extractLevelsForFactor,
  findFactorType,
  formatVariablesForOutput,
  getFactorsAndLevels,
  mapDbDependentVariablesToResponseFormat,
  mapDependentVariableRequestToDbFormat,
  mapDbFactorLevelsToResponseFormat,
  mapDbFactorsToFactorResponseFormat,
} from '../../src/services/FactorDependentCompositeService'
import FactorService from '../../src/services/FactorService'
import FactorLevelService from '../../src/services/FactorLevelService'
import FactorLevelAssociationService from '../../src/services/FactorLevelAssociationService'
import { dbRead, dbWrite } from '../../src/db/DbManager'

describe('FactorDependentCompositeService', () => {
  let target
  const testContext = {}
  const testTx = { tx: {}, batch: promises => Promise.all(promises) }
  kafkaProducerMocker()

  let verifyExperimentExistsOriginal
  let getDependentVariablesByExperimentIdNoExistenceCheckOriginal
  let getFactorLevelAssociationByExperimentIdOriginal

  beforeEach(() => {
    target = new FactorDependentCompositeService()

    verifyExperimentExistsOriginal = ExperimentsService.verifyExperimentExists
    getDependentVariablesByExperimentIdNoExistenceCheckOriginal = DependentVariableService.getDependentVariablesByExperimentIdNoExistenceCheck
    getFactorLevelAssociationByExperimentIdOriginal = FactorLevelAssociationService.getFactorLevelAssociationByExperimentId
  })

  afterEach(() => {
    ExperimentsService.verifyExperimentExists = verifyExperimentExistsOriginal
    DependentVariableService.getDependentVariablesByExperimentIdNoExistenceCheck = getDependentVariablesByExperimentIdNoExistenceCheckOriginal
    FactorLevelAssociationService.getFactorLevelAssociationByExperimentId = getFactorLevelAssociationByExperimentIdOriginal
  })

  describe('getFactorsAndLevels', () => {
    test('returns factors and levels object', () => {
      FactorService.getFactorsByExperimentIdNoExistenceCheck = mockResolve([{}])
      FactorLevelService.getFactorLevelsByExperimentIdNoExistenceCheck = mockResolve([{}, {}])

      return getFactorsAndLevels(1).then((data) => {
        expect(FactorService.getFactorsByExperimentIdNoExistenceCheck).toHaveBeenCalledWith(1)
        expect(FactorLevelService.getFactorLevelsByExperimentIdNoExistenceCheck).toHaveBeenCalledWith(1)
        expect(data).toEqual({ factors: [{}], levels: [{}, {}] })
      })
    })

    test('rejects when getFactorLevelsByExperimentIdNoExistenceCheck fails', () => {
      const error = { message: 'error' }
      FactorService.getFactorsByExperimentIdNoExistenceCheck = mockResolve([{}])
      FactorLevelService.getFactorLevelsByExperimentIdNoExistenceCheck = mockReject(error)

      return getFactorsAndLevels(1).then(() => {}, (err) => {
        expect(FactorService.getFactorsByExperimentIdNoExistenceCheck).toHaveBeenCalledWith(1)
        expect(FactorLevelService.getFactorLevelsByExperimentIdNoExistenceCheck).toHaveBeenCalledWith(1)
        expect(err).toEqual(error)
      })
    })

    test('rejects when getFactorsByExperimentIdNoExistenceCheck fails', () => {
      const error = { message: 'error' }
      FactorService.getFactorsByExperimentIdNoExistenceCheck = mockReject(error)
      FactorLevelService.getFactorLevelsByExperimentIdNoExistenceCheck = mock()

      return getFactorsAndLevels(1).then(() => {}, (err) => {
        expect(FactorService.getFactorsByExperimentIdNoExistenceCheck).toHaveBeenCalledWith(1)
        expect(FactorLevelService.getFactorLevelsByExperimentIdNoExistenceCheck).toHaveBeenCalledWith(1)
        expect(err).toEqual(error)
      })
    })
  })

  describe('extractLevelsForFactor', () => {
    test('returns empty list when no levels match', () => {
      expect(extractLevelsForFactor({ id: 42 }, [{ factor_id: 1 }, { factor_id: 2 }])).toEqual([])
    })

    test('returns empty list when no levels exist', () => {
      expect(extractLevelsForFactor({ id: 42 }, [])).toEqual([])
    })

    test('returns levels that match', () => {
      expect(extractLevelsForFactor({ id: 42 }, [{ factor_id: 1 }, { factor_id: 42 }, { factor_id: 2 }, { factor_id: 42 }]))
        .toEqual([{ factor_id: 42 }, { factor_id: 42 }])
    })
  })

  describe('convertDbLevelToResponseFormat', () => {
    test('creates new entity with level id and items', () => {
      expect(convertDbLevelToResponseFormat({ id: 42, value: { items: [1, 2, 3] } }))
        .toEqual({ id: 42, items: [1, 2, 3] })
    })
  })

  describe('findFactorType', () => {
    test('returns lower case type name of the factor', () => {
      expect(findFactorType([
        { id: 1, type: 'notIt' },
        { id: 2, type: 'IT' },
        { id: 3, type: 'notIt' },
      ], { ref_factor_type_id: 2 })).toEqual('it')
    })
  })

  describe('mapDbFactorLevelsToResponseFormat', () => {
    test('creates empty array when levels are not found.', () => {
      expect(mapDbFactorLevelsToResponseFormat([]))
        .toEqual([])
    })

    test('creates factor level DTOs', () => {
      expect(mapDbFactorLevelsToResponseFormat([
        { id: 1, value: { items: [] } },
        { id: 2, value: { items: [] } },
      ])).toEqual([{ id: 1, items: [] }, { id: 2, items: [] }])
    })
  })

  describe('mapDbFactorsToFactorResponseFormat', () => {
    test('returns empty list when no factors are present', () => {
      expect(mapDbFactorsToFactorResponseFormat([], [1, 2, 3], [{}, {}], []))
        .toEqual([])
    })
  })

  describe('mapDependentVariablesEntitiesToDTOs', () => {
    test('creates empty array when input is an empty array', () => {
      expect(mapDbDependentVariablesToResponseFormat([]))
        .toEqual([])
    })

    test('creates dependent variable DTOs', () => {
      expect(mapDbDependentVariablesToResponseFormat([
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

  describe('assembleIndependentAndExogenous', () => {
    test('returns empty object when input is empty array', () => {
      expect(assembleIndependentAndExogenous([]))
        .toEqual({})
    })

    test('appends factors to properties named of type and removes type property', () => {
      expect(assembleIndependentAndExogenous([
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

  describe('formatVariablesForOutput', () => {
    test('builds variable object from results of functions', () => {
      const factors = [
        { id: 3, name: 'factor1', ref_factor_type_id: 1 },
        { id: 5, name: 'factor2', ref_factor_type_id: 1 },
      ]
      const factorLevels = [
        { id: 11, factor_id: 3, value: { objectType: 'f1l1' } },
        { id: 13, factor_id: 3, value: { objectType: 'f1l2' } },
        { id: 15, factor_id: 5, value: { objectType: 'f2l1' } },
        { id: 17, factor_id: 5, value: { objectType: 'f2l2' } },
      ]
      const factorLevelAssociations = [
        { associated_level_id: 11, nested_level_id: 15 },
        { associated_level_id: 13, nested_level_id: 17 },
      ]

      expect(formatVariablesForOutput(
        factors,
        factorLevels,
        [{ id: 1, type: 'Independent' }, { id: 2, type: 'Exogenous' }],
        [{ name: 'depVar1' }, { name: 'depVar2' }],
        factorLevelAssociations,
      )).toEqual({
        responseVariables: [{ name: 'depVar1' }, { name: 'depVar2' }],
        treatmentVariableAssociations: [{
          associatedLevelId: 11,
          nestedLevelId: 15,
        }, {
          associatedLevelId: 13,
          nestedLevelId: 17,
        }],
        treatmentVariables: [{
          id: 3,
          name: 'factor1',
          levels: [
            { id: 11, objectType: 'f1l1' },
            { id: 13, objectType: 'f1l2' },
          ],
          nestedTreatmentVariables: [{ id: 5, name: 'factor2' }],
        }, {
          associatedTreatmentVariables: [{ id: 3, name: 'factor1' }],
          id: 5,
          name: 'factor2',
          levels: [
            { id: 15, objectType: 'f2l1' },
            { id: 17, objectType: 'f2l2' },
          ],
        }],
      })
    })
  })

  describe('getAllVariablesByExperimentId', () => {
    test('returns all variables with their levels', () => {
      const factors = [{
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
      }]

      const levels = [
        {
          id: 1,
          value: { items: [{ label: 'GermPlasm', text: 'GermPlasm1' }] },
          factor_id: 42,
        },
        {
          id: 2,
          value: { items: [{ label: 'GermPlasm', text: 'GermPlasm2' }] },
          factor_id: 42,
        },
        {
          id: 3,
          value: { items: [{ label: 'GermPlasm', text: 'GermPlasm3' }] },
          factor_id: 42,
        },
        {
          id: 4,
          value: { items: [{ label: 'RM', text: 'RM1' }] },
          factor_id: 43,
        },
        {
          id: 5,
          value: { items: [{ label: 'RM', text: 'RM2' }] },
          factor_id: 43,
        },
      ]
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
      FactorService.getFactorsByExperimentIdNoExistenceCheck = mockResolve(factors)
      FactorLevelService.getFactorLevelsByExperimentIdNoExistenceCheck = mockResolve(levels)
      const factorTypes = [{ id: 1, type: 'independent' }]
      dbRead.factorType.all = mockResolve(factorTypes)
      const dependentVariables = [{
        name: 'testDependent',
        required: true,
        question_code: 'ABC_GDEG',
      }]
      DependentVariableService.getDependentVariablesByExperimentIdNoExistenceCheck = mockResolve(dependentVariables)
      FactorLevelAssociationService.getFactorLevelAssociationByExperimentId = mockResolve(factorLevelAssociations)
      const expectedReturn = {
        treatmentVariables: [{
          id: 42,
          name: 'GermPlasm',
          nestedTreatmentVariables: [
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
                },
              ],
            },
            {
              id: 2,
              items: [
                {
                  label: 'GermPlasm',
                  text: 'GermPlasm2',
                },
              ],
            },
            {
              id: 3,
              items: [
                {
                  label: 'GermPlasm',
                  text: 'GermPlasm3',
                },
              ],
            },
          ],
          tier: undefined,
        },
        {
          id: 43,
          name: 'RM',
          associatedTreatmentVariables: [
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
                },
              ],
            },
            {
              id: 5,
              items: [
                {
                  label: 'RM',
                  text: 'RM2',
                },
              ],
            },
          ],
          tier: undefined,
        }],
        treatmentVariableAssociations: [
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
        responseVariables: [{ name: 'testDependent', required: true, questionCode: 'ABC_GDEG' }],
      }

      return target.getAllVariablesByExperimentId(1, false, testContext).then((data) => {
        expect(ExperimentsService.verifyExperimentExists).toHaveBeenCalledWith(1, false, testContext)
        expect(dbRead.factorType.all).toHaveBeenCalled()
        expect(DependentVariableService.getDependentVariablesByExperimentIdNoExistenceCheck).toHaveBeenCalledWith(1)
        expect(FactorLevelAssociationService.getFactorLevelAssociationByExperimentId).toHaveBeenCalledWith(1)
        expect(data).toEqual(expectedReturn)
      })
    })

    test('returns all variables with their levels and multiple nested vars', () => {
      const factors = [
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
      ]

      const levels = [
        {
          id: 1,
          value: { items: [{ label: 'GermPlasm', text: 'GermPlasm1' }] },
          factor_id: 42,
        },
        {
          id: 2,
          value: { items: [{ label: 'GermPlasm', text: 'GermPlasm2' }] },
          factor_id: 42,
        },
        {
          id: 3,
          value: { items: [{ label: 'GermPlasm', text: 'GermPlasm3' }] },
          factor_id: 42,
        },
        {
          id: 4,
          value: { items: [{ label: 'RM', text: 'RM1' }] },
          factor_id: 43,
        },
        {
          id: 5,
          value: { items: [{ label: 'RM', text: 'RM2' }] },
          factor_id: 43,
        },
        {
          id: 6,
          value: { items: [{ label: 'PlantHeight', text: 'Tall' }] },
          factor_id: 44,
        },
        {
          id: 7,
          value: { items: [{ label: 'PlantHeight', text: 'Dwarf' }] },
          factor_id: 44,
        },
      ]
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
      FactorService.getFactorsByExperimentIdNoExistenceCheck = mockResolve(factors)
      FactorLevelService.getFactorLevelsByExperimentIdNoExistenceCheck = mockResolve(levels)
      const factorTypes = [{ id: 1, type: 'independent' }]
      dbRead.factorType.all = mockResolve(factorTypes)
      const dependentVariables = [{
        name: 'testDependent',
        required: true,
        question_code: 'ABC_GDEG',
      }]
      DependentVariableService.getDependentVariablesByExperimentIdNoExistenceCheck = mockResolve(dependentVariables)
      FactorLevelAssociationService.getFactorLevelAssociationByExperimentId = mockResolve(factorLevelAssociations)
      const expectedReturn = {
        treatmentVariables: [
          {
            id: 42,
            name: 'GermPlasm',
            nestedTreatmentVariables: [
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
                  },
                ],
              },
              {
                id: 2,
                items: [
                  {
                    label: 'GermPlasm',
                    text: 'GermPlasm2',
                  },
                ],
              },
              {
                id: 3,
                items: [
                  {
                    label: 'GermPlasm',
                    text: 'GermPlasm3',
                  },
                ],
              },
            ],
            tier: undefined,
          },
          {
            id: 43,
            name: 'RM',
            associatedTreatmentVariables: [
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
                  },
                ],
              },
              {
                id: 5,
                items: [
                  {
                    label: 'RM',
                    text: 'RM2',
                  },
                ],
              },
            ],
            tier: undefined,
          },
          {
            id: 44,
            name: 'PlantHeight',
            associatedTreatmentVariables: [
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
                  },
                ],
              },
              {
                id: 7,
                items: [
                  {
                    label: 'PlantHeight',
                    text: 'Dwarf',
                  },
                ],
              },
            ],
            tier: undefined,
          }],
        treatmentVariableAssociations: [
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
        responseVariables: [{ name: 'testDependent', required: true, questionCode: 'ABC_GDEG' }],
      }

      return target.getAllVariablesByExperimentId(1, false, testContext).then((data) => {
        expect(ExperimentsService.verifyExperimentExists).toHaveBeenCalledWith(1, false, testContext)
        expect(dbRead.factorType.all).toHaveBeenCalled()
        expect(DependentVariableService.getDependentVariablesByExperimentIdNoExistenceCheck).toHaveBeenCalledWith(1)
        expect(FactorLevelAssociationService.getFactorLevelAssociationByExperimentId).toHaveBeenCalledWith(1)
        expect(data).toEqual(expectedReturn)
      })
    })

    test('rejects when a call fails in the Promise all', () => {
      const error = { message: 'error' }
      ExperimentsService.verifyExperimentExists = mockResolve()
      dbRead.factorType.all = mockResolve()
      DependentVariableService.getDependentVariablesByExperimentIdNoExistenceCheck = mockReject(error)
      FactorLevelAssociationService.getFactorLevelAssociationByExperimentId = mockResolve()

      return target.getAllVariablesByExperimentId(1, false, {}).then(() => {}, (err) => {
        expect(ExperimentsService.verifyExperimentExists).toHaveBeenCalledWith(1, false, {})
        expect(dbRead.factorType.all).toHaveBeenCalled()
        expect(DependentVariableService.getDependentVariablesByExperimentIdNoExistenceCheck).toHaveBeenCalledWith(1)
        expect(FactorLevelAssociationService.getFactorLevelAssociationByExperimentId).toHaveBeenCalledWith(1)
        expect(err).toEqual(error)
      })
    })
  })

  describe('mapDependentVariableRequestToDbFormat', () => {
    test('returns empty array when dependentVariables is undefined, null, or empty', () => {
      expect(mapDependentVariableRequestToDbFormat(undefined, 1)).toEqual([])
      expect(mapDependentVariableRequestToDbFormat(null, 1)).toEqual([])
      expect(mapDependentVariableRequestToDbFormat([], 1)).toEqual([])
    })

    test('maps dependent variables to db entities', () => {
      expect(mapDependentVariableRequestToDbFormat([{ name: 'testDependent' }, { name: 'testDependent2' }], 1)).toEqual([{
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
    test('adds experimentId to dependent variables and calls persist method', () => {
      target.persistVariablesWithoutLevels = mockResolve()

      return target.persistDependentVariables([{}], 42, testContext, false, testTx)
        .then(() => {
          expect(target.persistVariablesWithoutLevels).toHaveBeenCalledWith(42, [{ experimentId: 42 }], testContext, false, testTx)
        })
    })
  })

  describe('persistAllVariables', () => {
    beforeEach(() => {
      dbRead.factorType.all = mockResolve([
        {
          id: 1,
          type: 'Independent',
        },
      ])
      target.securityService.permissionsCheck = mockResolve()
      target.variablesValidator.validate = mockResolve()
      dbWrite.factorPropertiesForLevel.batchRemoveByExperimentId = mockResolve()
      dbWrite.factorPropertiesForLevel.batchCreate = mock(
        propertiesForFactorLevels => resolve(propertiesForFactorLevels.map((x, i) => i)),
      )
      dbWrite.factorLevel.batchFind = mock(
        factorLevel => resolve(factorLevel.map((x, i) => ({ ...x, factor_id: i }))),
      )
      dbWrite.factorLevelDetails.batchCreate = mockResolve()
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
        treatmentVariables: [
          {
            name: 'Factor1',
            levels: [
              {
                items: [
                  {
                    label: 'Factor1',
                    text: 'F11',
                    isPlaceholder: true,
                  },
                ],
              },
              {
                items: [
                  {
                    label: 'Factor1',
                    text: 'F12',
                    isPlaceholder: true,
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
                    isPlaceholder: true,
                  },
                  {
                    label: 'Rate',
                    text: '1.23',
                    isPlaceholder: true,
                  },
                ],
              },
              {
                items: [
                  {
                    label: 'Chem',
                    text: 'MON456',
                    isPlaceholder: true,
                  },
                  {
                    label: 'Rate',
                    text: '4.56',
                    isPlaceholder: true,
                  },
                ],
              },
            ],
            tier: null,
          },
        ],
        responseVariables: [],
        treatmentVariableAssociations: [],
      }

      return target.persistAllVariables(experimentVariables, 42, testContext, false, testTx).then(() => {
        expect(FactorService.getFactorsByExperimentIdNoExistenceCheck).toHaveBeenCalledWith(42)
        expect(FactorLevelService.getFactorLevelsByExperimentIdNoExistenceCheck).toHaveBeenCalledWith(42)
        expect(FactorLevelAssociationService.getFactorLevelAssociationByExperimentId).toHaveBeenCalledWith(42)
        expect(target.securityService.permissionsCheck).toHaveBeenCalledWith(42, testContext, false)
        expect(target.variablesValidator.validate).toHaveBeenCalledWith(experimentVariables, 'POST')
        expect(target.factorService.batchCreateFactors).toHaveBeenCalledWith([
          {
            experimentId: 42,
            name: 'Factor1',
            refFactorTypeId: 1,
            tier: null,
          },
          {
            experimentId: 42,
            name: 'Factor2',
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
                  isPlaceholder: true,
                  valueType: 'placeholder',
                },
              ],
            },
            associatedFactorLevelRefIds: [],
          },
          {
            factorId: 1,
            value: {
              items: [
                {
                  label: 'Factor1',
                  text: 'F12',
                  isPlaceholder: true,
                  valueType: 'placeholder',
                },
              ],
            },
            associatedFactorLevelRefIds: [],
          },
          {
            factorId: 2,
            value: {
              items: [
                {
                  label: 'Chem',
                  text: 'MON123',
                  isPlaceholder: true,
                  valueType: 'placeholder',
                },
                {
                  label: 'Rate',
                  text: '1.23',
                  isPlaceholder: true,
                  valueType: 'placeholder',
                },
              ],
            },
            associatedFactorLevelRefIds: [],
          },
          {
            factorId: 2,
            value: {
              items: [
                {
                  label: 'Chem',
                  text: 'MON456',
                  isPlaceholder: true,
                  valueType: 'placeholder',
                },
                {
                  label: 'Rate',
                  text: '4.56',
                  isPlaceholder: true,
                  valueType: 'placeholder',
                },
              ],
            },
            associatedFactorLevelRefIds: [],
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
        treatmentVariables: [
          {
            name: 'Factor1',
            levels: [
              {
                _refId: 1,
                items: [
                  {
                    label: 'Factor1',
                    text: 'F11',
                    isPlaceholder: true,
                  },
                ],
              },
              {
                _refId: 2,
                items: [
                  {
                    label: 'Factor1',
                    text: 'F12',
                    isPlaceholder: true,
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
                    isPlaceholder: true,
                  },
                ],
              },
              {
                _refId: 4,
                items: [
                  {
                    label: 'Factor2',
                    text: 'F22',
                    isPlaceholder: true,
                  },
                ],
              },
            ],
            tier: null,
          },
        ],
        responseVariables: [],
        treatmentVariableAssociations: [
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
        expect(FactorService.getFactorsByExperimentIdNoExistenceCheck).toHaveBeenCalledWith(42)
        expect(FactorLevelService.getFactorLevelsByExperimentIdNoExistenceCheck).toHaveBeenCalledWith(42)
        expect(FactorLevelAssociationService.getFactorLevelAssociationByExperimentId).toHaveBeenCalledWith(42)
        expect(target.securityService.permissionsCheck).toHaveBeenCalledWith(42, testContext, false)
        expect(target.variablesValidator.validate).toHaveBeenCalledWith(experimentVariables, 'POST')
        expect(target.factorService.batchCreateFactors).toHaveBeenCalledWith([
          {
            experimentId: 42,
            name: 'Factor1',
            refFactorTypeId: 1,
            tier: null,
          },
          {
            experimentId: 42,
            name: 'Factor2',
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
                  isPlaceholder: true,
                  valueType: 'placeholder',
                },
              ],
            },
            associatedFactorLevelRefIds: [],
          },
          {
            factorId: 1,
            value: {
              items: [
                {
                  label: 'Factor1',
                  text: 'F12',
                  isPlaceholder: true,
                  valueType: 'placeholder',
                },
              ],
            },
            associatedFactorLevelRefIds: [],
          },
          {
            factorId: 2,
            value: {
              items: [
                {
                  label: 'Factor2',
                  text: 'F21',
                  isPlaceholder: true,
                  valueType: 'placeholder',
                },
              ],
            },
            associatedFactorLevelRefIds: [1],
          },
          {
            factorId: 2,
            value: {
              items: [
                {
                  label: 'Factor2',
                  text: 'F22',
                  isPlaceholder: true,
                  valueType: 'placeholder',
                },
              ],
            },
            associatedFactorLevelRefIds: [2],
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
          value: {
            items: [
              {
                label: 'Factor1',
                text: 'F1.1',
                isPlaceholder: true,
                valueType: 'placeholder',
              },
            ],
            objectType: 'Cluster',
          },
        },
        {
          id: 12,
          value: {
            items: [
              {
                label: 'Factor1',
                text: 'F1.2',
                isPlaceholder: true,
                valueType: 'placeholder',
              },
            ],
            objectType: 'Cluster',
          },
        },
        {
          id: 21,
          value: {
            items: [
              {
                label: 'Chem',
                text: 'MON123',
                isPlaceholder: true,
                valueType: 'placeholder',
              },
              {
                label: 'Rate',
                text: '1.23',
                isPlaceholder: true,
                valueType: 'placeholder',
              },
            ],
            objectType: 'Cluster',
          },
        },
        {
          id: 22,
          value: {
            items: [
              {
                label: 'Chem',
                text: 'MON456',
                isPlaceholder: false,
                valueType: 'placeholder',
              },
              {
                label: 'Rate',
                text: '4.56',
                isPlaceholder: true,
                valueType: 'placeholder',
              },
            ],
            objectType: 'Cluster',
          },
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
        treatmentVariables: [
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
                    isPlaceholder: true,
                  },
                ],
                objectType: 'Cluster',
              },
              {
                id: 12,
                _refId: 2,
                items: [
                  {
                    label: 'Factor1',
                    text: 'F12',
                    isPlaceholder: true,
                  },
                ],
                objectType: 'Cluster',
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
                    isPlaceholder: true,
                  },
                  {
                    label: 'Rate',
                    text: '1.23',
                    isPlaceholder: true,
                  },
                ],
                objectType: 'Cluster',
              },
              {
                id: 22,
                items: [
                  {
                    label: 'Chem',
                    text: 'MON456',
                    isPlaceholder: true,
                  },
                  {
                    label: 'Rate',
                    text: '4.56',
                    isPlaceholder: true,
                  },
                ],
                objectType: 'Cluster',
              },
            ],
            tier: null,
          },
        ],
        responseVariables: [],
        treatmentVariableAssociations: [],
      }

      return target.persistAllVariables(experimentVariables, 42, testContext, false, testTx).then(() => {
        expect(FactorService.getFactorsByExperimentIdNoExistenceCheck).toHaveBeenCalledWith(42)
        expect(FactorLevelService.getFactorLevelsByExperimentIdNoExistenceCheck).toHaveBeenCalledWith(42)
        expect(FactorLevelAssociationService.getFactorLevelAssociationByExperimentId).toHaveBeenCalledWith(42)
        expect(target.securityService.permissionsCheck).toHaveBeenCalledWith(42, testContext, false)
        expect(target.variablesValidator.validate).toHaveBeenCalledWith(experimentVariables, 'POST')
        expect(target.factorService.batchCreateFactors).not.toHaveBeenCalled()
        expect(target.factorLevelService.batchCreateFactorLevels).not.toHaveBeenCalled()
        expect(target.factorService.batchUpdateFactors).toHaveBeenCalledWith([
          {
            id: 1,
            experimentId: 42,
            name: 'Factor1',
            refFactorTypeId: 1,
            tier: null,
          },
          {
            id: 2,
            experimentId: 42,
            name: 'Factor2',
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
                  isPlaceholder: true,
                  valueType: 'placeholder',
                },
              ],
              objectType: 'Cluster',
            },
            associatedFactorLevelRefIds: [],
          },
          {
            id: 12,
            factorId: 1,
            value: {
              items: [
                {
                  label: 'Factor1',
                  text: 'F12',
                  isPlaceholder: true,
                  valueType: 'placeholder',
                },
              ],
              objectType: 'Cluster',
            },
            associatedFactorLevelRefIds: [],
          },
          {
            id: 22,
            factorId: 2,
            value: {
              items: [
                {
                  label: 'Chem',
                  text: 'MON456',
                  isPlaceholder: true,
                  valueType: 'placeholder',
                },
                {
                  label: 'Rate',
                  text: '4.56',
                  isPlaceholder: true,
                  valueType: 'placeholder',
                },
              ],
              objectType: 'Cluster',
            },
            associatedFactorLevelRefIds: [],
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
        treatmentVariables: [
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
                    isPlaceholder: true,
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
                    isPlaceholder: true,
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
                    isPlaceholder: true,
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
                    isPlaceholder: true,
                  },
                ],
              },
            ],
            tier: null,
          },
        ],
        responseVariables: [],
        treatmentVariableAssociations: [
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
        expect(FactorService.getFactorsByExperimentIdNoExistenceCheck).toHaveBeenCalledWith(42)
        expect(FactorLevelService.getFactorLevelsByExperimentIdNoExistenceCheck).toHaveBeenCalledWith(42)
        expect(FactorLevelAssociationService.getFactorLevelAssociationByExperimentId).toHaveBeenCalledWith(42)
        expect(target.securityService.permissionsCheck).toHaveBeenCalledWith(42, testContext, false)
        expect(target.variablesValidator.validate).toHaveBeenCalledWith(experimentVariables, 'POST')
        expect(target.factorService.batchCreateFactors).not.toHaveBeenCalled()
        expect(target.factorLevelService.batchCreateFactorLevels).not.toHaveBeenCalled()
        expect(target.factorService.batchUpdateFactors).toHaveBeenCalledWith([
          {
            id: 1,
            experimentId: 42,
            name: 'Factor1',
            refFactorTypeId: 1,
            tier: null,
          },
          {
            id: 2,
            experimentId: 42,
            name: 'Factor2',
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
                  isPlaceholder: true,
                  valueType: 'placeholder',
                },
              ],
            },
            associatedFactorLevelRefIds: [],
          },
          {
            id: 12,
            factorId: 1,
            value: {
              items: [
                {
                  label: 'Factor1',
                  text: 'F12',
                  isPlaceholder: true,
                  valueType: 'placeholder',
                },
              ],
            },
            associatedFactorLevelRefIds: [],
          },
          {
            id: 21,
            factorId: 2,
            value: {
              items: [
                {
                  label: 'Factor2',
                  text: 'F21',
                  isPlaceholder: true,
                  valueType: 'placeholder',
                },
              ],
            },
            associatedFactorLevelRefIds: [1],
          },
          {
            id: 22,
            factorId: 2,
            value: {
              items: [
                {
                  label: 'Factor2',
                  text: 'F22',
                  isPlaceholder: true,
                  valueType: 'placeholder',
                },
              ],
            },
            associatedFactorLevelRefIds: [2],
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
        treatmentVariables: [
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
                    isPlaceholder: true,
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
                    isPlaceholder: true,
                  },
                ],
              },
            ],
            tier: null,
          },
        ],
        responseVariables: [],
        treatmentVariableAssociations: [],
      }

      return target.persistAllVariables(experimentVariables, 42, testContext, false, testTx).then(() => {
        expect(FactorService.getFactorsByExperimentIdNoExistenceCheck).toHaveBeenCalledWith(42)
        expect(FactorLevelService.getFactorLevelsByExperimentIdNoExistenceCheck).toHaveBeenCalledWith(42)
        expect(FactorLevelAssociationService.getFactorLevelAssociationByExperimentId).toHaveBeenCalledWith(42)
        expect(target.securityService.permissionsCheck).toHaveBeenCalledWith(42, testContext, false)
        expect(target.variablesValidator.validate).toHaveBeenCalledWith(experimentVariables, 'POST')
        expect(target.factorService.batchCreateFactors).not.toHaveBeenCalled()
        expect(target.factorLevelService.batchCreateFactorLevels).not.toHaveBeenCalled()
        expect(target.factorService.batchUpdateFactors).toHaveBeenCalledWith([
          {
            id: 1,
            experimentId: 42,
            name: 'Factor1',
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
                  isPlaceholder: true,
                  valueType: 'placeholder',
                },
              ],
            },
            associatedFactorLevelRefIds: [],
          },
          {
            id: 12,
            factorId: 1,
            value: {
              items: [
                {
                  label: 'Factor1',
                  text: 'F12',
                  isPlaceholder: true,
                  valueType: 'placeholder',
                },
              ],
            },
            associatedFactorLevelRefIds: [],
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
        treatmentVariables: [
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
                    isPlaceholder: true,
                  },
                ],
              },
            ],
            tier: null,
          },
        ],
        responseVariables: [],
        treatmentVariableAssociations: [],
      }

      return target.persistAllVariables(experimentVariables, 42, testContext, false, testTx).then(() => {
        expect(FactorService.getFactorsByExperimentIdNoExistenceCheck).toHaveBeenCalledWith(42)
        expect(FactorLevelService.getFactorLevelsByExperimentIdNoExistenceCheck).toHaveBeenCalledWith(42)
        expect(FactorLevelAssociationService.getFactorLevelAssociationByExperimentId).toHaveBeenCalledWith(42)
        expect(target.securityService.permissionsCheck).toHaveBeenCalledWith(42, testContext, false)
        expect(target.variablesValidator.validate).toHaveBeenCalledWith(experimentVariables, 'POST')
        expect(target.factorService.batchCreateFactors).not.toHaveBeenCalled()
        expect(target.factorLevelService.batchCreateFactorLevels).not.toHaveBeenCalled()
        expect(target.factorService.batchUpdateFactors).toHaveBeenCalledWith([
          {
            id: 1,
            experimentId: 42,
            name: 'Factor1',
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
                  isPlaceholder: true,
                  valueType: 'placeholder',
                },
              ],
            },
            associatedFactorLevelRefIds: [],
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
        expect(FactorService.getFactorsByExperimentIdNoExistenceCheck).toHaveBeenCalledWith(42)
        expect(FactorLevelService.getFactorLevelsByExperimentIdNoExistenceCheck).toHaveBeenCalledWith(42)
        expect(FactorLevelAssociationService.getFactorLevelAssociationByExperimentId).toHaveBeenCalledWith(42)
        expect(target.securityService.permissionsCheck).toHaveBeenCalledWith(42, testContext, false)
        expect(target.variablesValidator.validate).toHaveBeenCalledWith(experimentVariables, 'POST')
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
        treatmentVariables: [
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
                    isPlaceholder: true,
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
                    isPlaceholder: true,
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
                    isPlaceholder: true,
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
                    isPlaceholder: true,
                  },
                ],
              },
            ],
            tier: null,
          },
        ],
        responseVariables: [],
        treatmentVariableAssociations: [
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
        expect(FactorService.getFactorsByExperimentIdNoExistenceCheck).toHaveBeenCalledWith(42)
        expect(FactorLevelService.getFactorLevelsByExperimentIdNoExistenceCheck).toHaveBeenCalledWith(42)
        expect(FactorLevelAssociationService.getFactorLevelAssociationByExperimentId).toHaveBeenCalledWith(42)
        expect(target.securityService.permissionsCheck).toHaveBeenCalledWith(42, testContext, false)
        expect(target.variablesValidator.validate).toHaveBeenCalledWith(experimentVariables, 'POST')
        expect(target.factorService.batchCreateFactors).not.toHaveBeenCalled()
        expect(target.factorLevelService.batchCreateFactorLevels).not.toHaveBeenCalled()
        expect(target.factorService.batchUpdateFactors).toHaveBeenCalledWith([
          {
            id: 1,
            experimentId: 42,
            name: 'Factor1',
            refFactorTypeId: 1,
            tier: null,
          },
          {
            id: 2,
            experimentId: 42,
            name: 'Factor2',
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
                  isPlaceholder: true,
                  valueType: 'placeholder',
                },
              ],
            },
            associatedFactorLevelRefIds: [],
          },
          {
            id: 12,
            factorId: 1,
            value: {
              items: [
                {
                  label: 'Factor1',
                  text: 'F12',
                  isPlaceholder: true,
                  valueType: 'placeholder',
                },
              ],
            },
            associatedFactorLevelRefIds: [],
          },
          {
            id: 21,
            factorId: 2,
            value: {
              items: [
                {
                  label: 'Factor2',
                  text: 'F21',
                  isPlaceholder: true,
                  valueType: 'placeholder',
                },
              ],
            },
            associatedFactorLevelRefIds: [1],
          },
          {
            id: 22,
            factorId: 2,
            value: {
              items: [
                {
                  label: 'Factor2',
                  text: 'F22',
                  isPlaceholder: true,
                  valueType: 'placeholder',
                },
              ],
            },
            associatedFactorLevelRefIds: [2],
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
        treatmentVariables: [
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
                    isPlaceholder: true,
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
                    isPlaceholder: true,
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
                    isPlaceholder: true,
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
                    isPlaceholder: true,
                  },
                ],
              },
            ],
            tier: null,
          },
        ],
        responseVariables: [],
        treatmentVariableAssociations: [
          {
            associatedLevelRefId: 1,
            nestedLevelRefId: 3,
          },
        ],
      }

      return target.persistAllVariables(experimentVariables, 42, testContext, false, testTx).then(() => {
        expect(FactorService.getFactorsByExperimentIdNoExistenceCheck).toHaveBeenCalledWith(42)
        expect(FactorLevelService.getFactorLevelsByExperimentIdNoExistenceCheck).toHaveBeenCalledWith(42)
        expect(FactorLevelAssociationService.getFactorLevelAssociationByExperimentId).toHaveBeenCalledWith(42)
        expect(target.securityService.permissionsCheck).toHaveBeenCalledWith(42, testContext, false)
        expect(target.variablesValidator.validate).toHaveBeenCalledWith(experimentVariables, 'POST')
        expect(target.factorService.batchCreateFactors).not.toHaveBeenCalled()
        expect(target.factorLevelService.batchCreateFactorLevels).not.toHaveBeenCalled()
        expect(target.factorService.batchUpdateFactors).toHaveBeenCalledWith([
          {
            id: 1,
            experimentId: 42,
            name: 'Factor1',
            refFactorTypeId: 1,
            tier: null,
          },
          {
            id: 2,
            experimentId: 42,
            name: 'Factor2',
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
                  isPlaceholder: true,
                  valueType: 'placeholder',
                },
              ],
            },
            associatedFactorLevelRefIds: [],
          },
          {
            id: 12,
            factorId: 1,
            value: {
              items: [
                {
                  label: 'Factor1',
                  text: 'F12',
                  isPlaceholder: true,
                  valueType: 'placeholder',
                },
              ],
            },
            associatedFactorLevelRefIds: [],
          },
          {
            id: 21,
            factorId: 2,
            value: {
              items: [
                {
                  label: 'Factor2',
                  text: 'F21',
                  isPlaceholder: true,
                  valueType: 'placeholder',
                },
              ],
            },
            associatedFactorLevelRefIds: [1],
          },
          {
            id: 22,
            factorId: 2,
            value: {
              items: [
                {
                  label: 'Factor2',
                  text: 'F22',
                  isPlaceholder: true,
                  valueType: 'placeholder',
                },
              ],
            },
            associatedFactorLevelRefIds: [],
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
        treatmentVariables: [
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
                    isPlaceholder: true,
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
                    isPlaceholder: true,
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
                    isPlaceholder: true,
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
                    isPlaceholder: true,
                  },
                ],
              },
            ],
            tier: null,
          },
        ],
        responseVariables: [],
        treatmentVariableAssociations: [
          {
            associatedLevelRefId: 2,
            nestedLevelRefId: 4,
          },
        ],
      }

      return target.persistAllVariables(experimentVariables, 42, testContext, false, testTx).then(() => {
        expect(FactorService.getFactorsByExperimentIdNoExistenceCheck).toHaveBeenCalledWith(42)
        expect(FactorLevelService.getFactorLevelsByExperimentIdNoExistenceCheck).toHaveBeenCalledWith(42)
        expect(FactorLevelAssociationService.getFactorLevelAssociationByExperimentId).toHaveBeenCalledWith(42)
        expect(target.securityService.permissionsCheck).toHaveBeenCalledWith(42, testContext, false)
        expect(target.variablesValidator.validate).toHaveBeenCalledWith(experimentVariables, 'POST')
        expect(target.factorService.batchCreateFactors).not.toHaveBeenCalled()
        expect(target.factorLevelService.batchCreateFactorLevels).not.toHaveBeenCalled()
        expect(target.factorService.batchUpdateFactors).toHaveBeenCalledWith([
          {
            id: 1,
            experimentId: 42,
            name: 'Factor1',
            refFactorTypeId: 1,
            tier: null,
          },
          {
            id: 2,
            experimentId: 42,
            name: 'Factor2',
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
                  isPlaceholder: true,
                  valueType: 'placeholder',
                },
              ],
            },
            associatedFactorLevelRefIds: [],
          },
          {
            id: 12,
            factorId: 1,
            value: {
              items: [
                {
                  label: 'Factor1',
                  text: 'F12',
                  isPlaceholder: true,
                  valueType: 'placeholder',
                },
              ],
            },
            associatedFactorLevelRefIds: [],
          },
          {
            id: 21,
            factorId: 2,
            value: {
              items: [
                {
                  label: 'Factor2',
                  text: 'F21',
                  isPlaceholder: true,
                  valueType: 'placeholder',
                },
              ],
            },
            associatedFactorLevelRefIds: [],
          },
          {
            id: 22,
            factorId: 2,
            value: {
              items: [
                {
                  label: 'Factor2',
                  text: 'F22',
                  isPlaceholder: true,
                  valueType: 'placeholder',
                },
              ],
            },
            associatedFactorLevelRefIds: [2],
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

  describe('persistIndependentAndAssociations', () => {
    test('calls processFactorLevelValues on the factorLevelService before getting db entities', () => {
      const localTarget = new FactorDependentCompositeService()
      localTarget.factorLevelService = { processFactorLevelValues: mock() }
      localTarget.getCurrentDbEntities = () => Promise.reject()
      const independentDtos = [{ name: 'test variable' }]
      dbWrite.factorPropertiesForLevel.batchRemoveByExperimentId = mockResolve()

      return localTarget.persistIndependentAndAssociations(5, independentDtos).catch(() => {
        expect(localTarget.factorLevelService.processFactorLevelValues).toHaveBeenCalledWith(independentDtos)
      })
    })
  })

  describe('buildFLGMatrix', () => {
    test('test when all items are new', () => {
      const requestLevels = [
        {
          isValidLevelNumber: true,
          isActive: false,
          items: [
            {
              label: 'Seed',
              objectType: 'Catalog',
              valueType: 'placeholder',
              catalogType: 'INTERNAL_SEED',
              text: 'Seed 1',
              isPlaceholder: true,
            },
            {
              label: 'Chemical',
              objectType: 'Catalog',
              valueType: 'placeholder',
              catalogType: 'CHEMICAL',
              text: 'Chemical 1',
              isPlaceholder: true,
            },
            {
              label: 'Insects',
              objectType: 'Catalog',
              valueType: 'placeholder',
              catalogType: 'INSECTS',
              text: 'Insects 1',
              isPlaceholder: true,
            },
          ],
          objectType: 'Cluster',
          _refId: 53,
        },
        {
          isValidLevelNumber: true,
          isActive: false,
          items: [
            {
              items: [
                {
                  label: 'Seed',
                  objectType: 'Catalog',
                  valueType: 'placeholder',
                  catalogType: 'INTERNAL_SEED',
                  text: 'Seed 2',
                  isPlaceholder: true,
                },
                {
                  label: 'Chemical',
                  objectType: 'Catalog',
                  valueType: 'placeholder',
                  catalogType: 'CHEMICAL',
                  text: 'Chemical 2',
                  isPlaceholder: true,
                },
                {
                  label: 'Insects',
                  objectType: 'Catalog',
                  valueType: 'placeholder',
                  catalogType: 'INSECTS',
                  text: 'Insects 2',
                  isPlaceholder: true,
                },
              ],
              objectType: 'Composite',
            },
            {
              items: [
                {
                  label: 'Seed',
                  objectType: 'Catalog',
                  valueType: 'placeholder',
                  catalogType: 'INTERNAL_SEED',
                  text: 'Seed 3',
                  isPlaceholder: true,
                },
                {
                  label: 'Chemical',
                  objectType: 'Catalog',
                  valueType: 'placeholder',
                  catalogType: 'CHEMICAL',
                  text: 'Chemical 3',
                  isPlaceholder: true,
                },
                {
                  label: 'Insects',
                  objectType: 'Catalog',
                  valueType: 'placeholder',
                  catalogType: 'INSECTS',
                  text: 'Insects 3',
                  isPlaceholder: true,
                },
              ],
              objectType: 'Composite',
            },
          ],
          objectType: 'Cluster',
          _refId: 57,
        },
        {
          isValidLevelNumber: true,
          isActive: false,
          items: [
            {
              label: 'Seed',
              objectType: 'Catalog',
              valueType: 'placeholder',
              catalogType: 'INTERNAL_SEED',
              text: 'Seed 3',
              isPlaceholder: true,
            },
            {
              label: 'Chemical',
              objectType: 'Catalog',
              valueType: 'placeholder',
              catalogType: 'CHEMICAL',
              text: 'Chemical 3',
              isPlaceholder: true,
            },
            {
              label: 'Insects',
              objectType: 'Catalog',
              valueType: 'placeholder',
              catalogType: 'INSECTS',
              text: 'Insects 3',
              isPlaceholder: true,
            },
          ],
          objectType: 'Cluster',
          _refId: 65,
        },
        {
          isValidLevelNumber: true,
          isActive: false,
          items: [
            {
              label: 'Chemical',
              objectType: 'Catalog',
              valueType: 'placeholder',
              catalogType: 'CHEMICAL',
              text: 'Chemical 1',
              isPlaceholder: true,
            },
            {
              label: 'Application Rate',
              objectType: 'QandAV3',
              valueType: 'placeholder',
              questionCode: 'APP_RATE_MA',
              multiQuestionTag: 'APP_RATE',
              uomCode: 'LB_PER_AC',
              text: 'App Rate 1',
              isPlaceholder: true,
            },
            {
              label: 'Application Timing',
              objectType: 'QandAV3',
              valueType: 'placeholder',
              questionCode: 'APP_TIM',
              uomCode: 'STRING',
              text: 'Application Timing 1',
              isPlaceholder: true,
            },
            {
              label: 'Application Method',
              objectType: 'QandAV3',
              valueType: 'placeholder',
              questionCode: 'APP_MET',
              uomCode: 'METHOD',
              text: 'Application Method 1',
              isPlaceholder: true,
            },
          ],
          objectType: 'Cluster',
          _refId: 80,
        },
        {
          isValidLevelNumber: true,
          isActive: false,
          items: [
            {
              label: 'Chemical',
              objectType: 'Catalog',
              valueType: 'placeholder',
              catalogType: 'CHEMICAL',
              text: 'Chemical 2',
              isPlaceholder: true,
            },
            {
              label: 'Application Rate',
              objectType: 'QandAV3',
              valueType: 'placeholder',
              questionCode: 'APP_RATE_MA',
              multiQuestionTag: 'APP_RATE',
              uomCode: 'KG_PER_HA',
              text: 'App Rate 2',
              isPlaceholder: true,
            },
            {
              label: 'Application Timing',
              objectType: 'QandAV3',
              valueType: 'placeholder',
              questionCode: 'APP_TIM',
              uomCode: 'STRING',
              text: 'Application Timing 2',
              isPlaceholder: true,
            },
            {
              label: 'Application Method',
              objectType: 'QandAV3',
              valueType: 'placeholder',
              questionCode: 'APP_MET',
              uomCode: 'METHOD',
              text: 'Application Method 2',
              isPlaceholder: true,
            },
          ],
          objectType: 'Cluster',
          _refId: 85,
        },
      ]

      const factorLevels = [
        {
          id: 2493975,
          value: {
            items: [
              {
                text: 'Seed 1',
                label: 'Seed',
                valueType: 'placeholder',
                objectType: 'Catalog',
                catalogType: 'INTERNAL_SEED',
                isPlaceholder: true,
              },
              {
                text: 'Chemical 1',
                label: 'Chemical',
                valueType: 'placeholder',
                objectType: 'Catalog',
                catalogType: 'CHEMICAL',
                isPlaceholder: true,
              },
              {
                text: 'Insects 1',
                label: 'Insects',
                valueType: 'placeholder',
                objectType: 'Catalog',
                catalogType: 'INSECTS',
                isPlaceholder: true,
              },
            ],
            objectType: 'Cluster',
          },
          factor_id: 5510,
          created_user_id: 'EHZBZ',
          created_date: '2021-11-30T18:51:33.255Z',
          modified_user_id: 'EHZBZ',
          modified_date: '2021-11-30T18:51:33.255Z',
        },
        {
          id: 2493976,
          value: {
            items: [
              {
                items: [
                  {
                    text: 'Seed 2',
                    label: 'Seed',
                    valueType: 'placeholder',
                    objectType: 'Catalog',
                    catalogType: 'INTERNAL_SEED',
                    isPlaceholder: true,
                  },
                  {
                    text: 'Chemical 2',
                    label: 'Chemical',
                    valueType: 'placeholder',
                    objectType: 'Catalog',
                    catalogType: 'CHEMICAL',
                    isPlaceholder: true,
                  },
                  {
                    text: 'Insects 2',
                    label: 'Insects',
                    valueType: 'placeholder',
                    objectType: 'Catalog',
                    catalogType: 'INSECTS',
                    isPlaceholder: true,
                  },
                ],
                objectType: 'Composite',
              },
              {
                items: [
                  {
                    text: 'Seed 3',
                    label: 'Seed',
                    valueType: 'placeholder',
                    objectType: 'Catalog',
                    catalogType: 'INTERNAL_SEED',
                    isPlaceholder: true,
                  },
                  {
                    text: 'Chemical 3',
                    label: 'Chemical',
                    valueType: 'placeholder',
                    objectType: 'Catalog',
                    catalogType: 'CHEMICAL',
                    isPlaceholder: true,
                  },
                  {
                    text: 'Insects 3',
                    label: 'Insects',
                    valueType: 'placeholder',
                    objectType: 'Catalog',
                    catalogType: 'INSECTS',
                    isPlaceholder: true,
                  },
                ],
                objectType: 'Composite',
              },
            ],
            objectType: 'Cluster',
          },
          factor_id: 5510,
          created_user_id: 'EHZBZ',
          created_date: '2021-11-30T18:51:33.255Z',
          modified_user_id: 'EHZBZ',
          modified_date: '2021-11-30T18:51:33.255Z',
        },
        {
          id: 2493977,
          value: {
            items: [
              {
                text: 'Seed 3',
                label: 'Seed',
                valueType: 'placeholder',
                objectType: 'Catalog',
                catalogType: 'INTERNAL_SEED',
                isPlaceholder: true,
              },
              {
                text: 'Chemical 3',
                label: 'Chemical',
                valueType: 'placeholder',
                objectType: 'Catalog',
                catalogType: 'CHEMICAL',
                isPlaceholder: true,
              },
              {
                text: 'Insects 3',
                label: 'Insects',
                valueType: 'placeholder',
                objectType: 'Catalog',
                catalogType: 'INSECTS',
                isPlaceholder: true,
              },
            ],
            objectType: 'Cluster',
          },
          factor_id: 5510,
          created_user_id: 'EHZBZ',
          created_date: '2021-11-30T18:51:33.255Z',
          modified_user_id: 'EHZBZ',
          modified_date: '2021-11-30T18:51:33.255Z',
        },
        {
          id: 2493978,
          value: {
            items: [
              {
                text: 'Chemical 1',
                label: 'Chemical',
                valueType: 'placeholder',
                objectType: 'Catalog',
                catalogType: 'CHEMICAL',
                isPlaceholder: true,
              },
              {
                text: 'App Rate 1',
                label: 'Application Rate',
                uomCode: 'LB_PER_AC',
                valueType: 'placeholder',
                objectType: 'QandAV3',
                questionCode: 'APP_RATE_MA',
                isPlaceholder: true,
                multiQuestionTag: 'APP_RATE',
              },
              {
                text: 'Application Timing 1',
                label: 'Application Timing',
                uomCode: 'STRING',
                valueType: 'placeholder',
                objectType: 'QandAV3',
                questionCode: 'APP_TIM',
                isPlaceholder: true,
              },
              {
                text: 'Application Method 1',
                label: 'Application Method',
                uomCode: 'METHOD',
                valueType: 'placeholder',
                objectType: 'QandAV3',
                questionCode: 'APP_MET',
                isPlaceholder: true,
              },
            ],
            objectType: 'Cluster',
          },
          factor_id: 5511,
          created_user_id: 'EHZBZ',
          created_date: '2021-11-30T18:51:33.255Z',
          modified_user_id: 'EHZBZ',
          modified_date: '2021-11-30T18:51:33.255Z',
        },
        {
          id: 2493979,
          value: {
            items: [
              {
                text: 'Chemical 2',
                label: 'Chemical',
                valueType: 'placeholder',
                objectType: 'Catalog',
                catalogType: 'CHEMICAL',
                isPlaceholder: true,
              },
              {
                text: 'App Rate 2',
                label: 'Application Rate',
                uomCode: 'KG_PER_HA',
                valueType: 'placeholder',
                objectType: 'QandAV3',
                questionCode: 'APP_RATE_MA',
                isPlaceholder: true,
                multiQuestionTag: 'APP_RATE',
              },
              {
                text: 'Application Timing 2',
                label: 'Application Timing',
                uomCode: 'STRING',
                valueType: 'placeholder',
                objectType: 'QandAV3',
                questionCode: 'APP_TIM',
                isPlaceholder: true,
              },
              {
                text: 'Application Method 2',
                label: 'Application Method',
                uomCode: 'METHOD',
                valueType: 'placeholder',
                objectType: 'QandAV3',
                questionCode: 'APP_MET',
                isPlaceholder: true,
              },
            ],
            objectType: 'Cluster',
          },
          factor_id: 5511,
          created_user_id: 'EHZBZ',
          created_date: '2021-11-30T18:51:33.255Z',
          modified_user_id: 'EHZBZ',
          modified_date: '2021-11-30T18:51:33.255Z',
        },
      ]

      const fLGMatrixExpected = [
        [
          {
            factorId: 5510,
            isValidLevelNumber: true,
            isActive: false,
            items: [
              {
                label: 'Seed',
                objectType: 'Catalog',
                valueType: 'placeholder',
                catalogType: 'INTERNAL_SEED',
                text: 'Seed 1',
                isPlaceholder: true,
              },
              {
                label: 'Chemical',
                objectType: 'Catalog',
                valueType: 'placeholder',
                catalogType: 'CHEMICAL',
                text: 'Chemical 1',
                isPlaceholder: true,
              },
              {
                label: 'Insects',
                objectType: 'Catalog',
                valueType: 'placeholder',
                catalogType: 'INSECTS',
                text: 'Insects 1',
                isPlaceholder: true,
              },
            ],
            objectType: 'Cluster',
            _refId: 53,
            id: 2493975,
          },
          {
            factorId: 5510,
            isValidLevelNumber: true,
            isActive: false,
            items: [
              {
                items: [
                  {
                    label: 'Seed',
                    objectType: 'Catalog',
                    valueType: 'placeholder',
                    catalogType: 'INTERNAL_SEED',
                    text: 'Seed 2',
                    isPlaceholder: true,
                  },
                  {
                    label: 'Chemical',
                    objectType: 'Catalog',
                    valueType: 'placeholder',
                    catalogType: 'CHEMICAL',
                    text: 'Chemical 2',
                    isPlaceholder: true,
                  },
                  {
                    label: 'Insects',
                    objectType: 'Catalog',
                    valueType: 'placeholder',
                    catalogType: 'INSECTS',
                    text: 'Insects 2',
                    isPlaceholder: true,
                  },
                ],
                objectType: 'Composite',
              },
              {
                items: [
                  {
                    label: 'Seed',
                    objectType: 'Catalog',
                    valueType: 'placeholder',
                    catalogType: 'INTERNAL_SEED',
                    text: 'Seed 3',
                    isPlaceholder: true,
                  },
                  {
                    label: 'Chemical',
                    objectType: 'Catalog',
                    valueType: 'placeholder',
                    catalogType: 'CHEMICAL',
                    text: 'Chemical 3',
                    isPlaceholder: true,
                  },
                  {
                    label: 'Insects',
                    objectType: 'Catalog',
                    valueType: 'placeholder',
                    catalogType: 'INSECTS',
                    text: 'Insects 3',
                    isPlaceholder: true,
                  },
                ],
                objectType: 'Composite',
              },
            ],
            objectType: 'Cluster',
            _refId: 57,
            id: 2493976,
          },
          {
            factorId: 5510,
            isValidLevelNumber: true,
            isActive: false,
            items: [
              {
                label: 'Seed',
                objectType: 'Catalog',
                valueType: 'placeholder',
                catalogType: 'INTERNAL_SEED',
                text: 'Seed 3',
                isPlaceholder: true,
              },
              {
                label: 'Chemical',
                objectType: 'Catalog',
                valueType: 'placeholder',
                catalogType: 'CHEMICAL',
                text: 'Chemical 3',
                isPlaceholder: true,
              },
              {
                label: 'Insects',
                objectType: 'Catalog',
                valueType: 'placeholder',
                catalogType: 'INSECTS',
                text: 'Insects 3',
                isPlaceholder: true,
              },
            ],
            objectType: 'Cluster',
            _refId: 65,
            id: 2493977,
          },
        ],
        [
          {
            factorId: 5511,
            isValidLevelNumber: true,
            isActive: false,
            items: [
              {
                label: 'Chemical',
                objectType: 'Catalog',
                valueType: 'placeholder',
                catalogType: 'CHEMICAL',
                text: 'Chemical 1',
                isPlaceholder: true,
              },
              {
                label: 'Application Rate',
                objectType: 'QandAV3',
                valueType: 'placeholder',
                questionCode: 'APP_RATE_MA',
                multiQuestionTag: 'APP_RATE',
                uomCode: 'LB_PER_AC',
                text: 'App Rate 1',
                isPlaceholder: true,
              },
              {
                label: 'Application Timing',
                objectType: 'QandAV3',
                valueType: 'placeholder',
                questionCode: 'APP_TIM',
                uomCode: 'STRING',
                text: 'Application Timing 1',
                isPlaceholder: true,
              },
              {
                label: 'Application Method',
                objectType: 'QandAV3',
                valueType: 'placeholder',
                questionCode: 'APP_MET',
                uomCode: 'METHOD',
                text: 'Application Method 1',
                isPlaceholder: true,
              },
            ],
            objectType: 'Cluster',
            _refId: 80,
            id: 2493978,
          },
          {
            factorId: 5511,
            isValidLevelNumber: true,
            isActive: false,
            items: [
              {
                label: 'Chemical',
                objectType: 'Catalog',
                valueType: 'placeholder',
                catalogType: 'CHEMICAL',
                text: 'Chemical 2',
                isPlaceholder: true,
              },
              {
                label: 'Application Rate',
                objectType: 'QandAV3',
                valueType: 'placeholder',
                questionCode: 'APP_RATE_MA',
                multiQuestionTag: 'APP_RATE',
                uomCode: 'KG_PER_HA',
                text: 'App Rate 2',
                isPlaceholder: true,
              },
              {
                label: 'Application Timing',
                objectType: 'QandAV3',
                valueType: 'placeholder',
                questionCode: 'APP_TIM',
                uomCode: 'STRING',
                text: 'Application Timing 2',
                isPlaceholder: true,
              },
              {
                label: 'Application Method',
                objectType: 'QandAV3',
                valueType: 'placeholder',
                questionCode: 'APP_MET',
                uomCode: 'METHOD',
                text: 'Application Method 2',
                isPlaceholder: true,
              },
            ],
            objectType: 'Cluster',
            _refId: 85,
            id: 2493979,
          },
        ],
      ]

      const fLGMatrix = target.buildFLGMatrix(requestLevels, factorLevels)
      expect(fLGMatrix).toEqual(fLGMatrixExpected)
    })

    test('test when all items already exist', () => {
      const requestLevels = [
        {
          factorId: 5511,
          isValidLevelNumber: true,
          isActive: false,
          id: 2493978,
          items: [
            {
              label: 'Chemical',
              objectType: 'Catalog',
              valueType: 'placeholder',
              catalogType: 'CHEMICAL',
              text: 'Chemical 1',
              isPlaceholder: true,
            },
            {
              label: 'Application Rate',
              objectType: 'QandAV3',
              valueType: 'placeholder',
              questionCode: 'APP_RATE_MA',
              multiQuestionTag: 'APP_RATE',
              uomCode: 'LB_PER_AC',
              text: 'App Rate 11',
              isPlaceholder: true,
            },
            {
              label: 'Application Timing',
              objectType: 'QandAV3',
              valueType: 'placeholder',
              questionCode: 'APP_TIM',
              uomCode: 'STRING',
              text: 'Application Timing 1',
              isPlaceholder: true,
            },
            {
              label: 'Application Method',
              objectType: 'QandAV3',
              valueType: 'placeholder',
              questionCode: 'APP_MET',
              uomCode: 'METHOD',
              text: 'Application Method 1',
              isPlaceholder: true,
            },
          ],
          objectType: 'Cluster',
          _refId: 161,
        },
        {
          factorId: 5511,
          isValidLevelNumber: true,
          isActive: false,
          id: 2493979,
          items: [
            {
              label: 'Chemical',
              objectType: 'Catalog',
              valueType: 'placeholder',
              catalogType: 'CHEMICAL',
              text: 'Chemical 2',
              isPlaceholder: true,
            },
            {
              label: 'Application Rate',
              objectType: 'QandAV3',
              valueType: 'placeholder',
              questionCode: 'APP_RATE_MA',
              multiQuestionTag: 'APP_RATE',
              uomCode: 'KG_PER_HA',
              text: 'App Rate 2',
              isPlaceholder: true,
            },
            {
              label: 'Application Timing',
              objectType: 'QandAV3',
              valueType: 'placeholder',
              questionCode: 'APP_TIM',
              uomCode: 'STRING',
              text: 'Application Timing 2',
              isPlaceholder: true,
            },
            {
              label: 'Application Method',
              objectType: 'QandAV3',
              valueType: 'placeholder',
              questionCode: 'APP_MET',
              uomCode: 'METHOD',
              text: 'Application Method 2',
              isPlaceholder: true,
            },
          ],
          objectType: 'Cluster',
          _refId: 166,
        },
        {
          factorId: 5510,
          isValidLevelNumber: true,
          isActive: false,
          id: 2493975,
          items: [
            {
              label: 'Seed',
              objectType: 'Catalog',
              valueType: 'placeholder',
              catalogType: 'INTERNAL_SEED',
              text: 'Seed 1',
              isPlaceholder: true,
            },
            {
              label: 'Chemical',
              objectType: 'Catalog',
              valueType: 'placeholder',
              catalogType: 'CHEMICAL',
              text: 'Chemical 1',
              isPlaceholder: true,
            },
            {
              label: 'Insects',
              objectType: 'Catalog',
              valueType: 'placeholder',
              catalogType: 'INSECTS',
              text: 'Insects 1',
              isPlaceholder: true,
            },
          ],
          objectType: 'Cluster',
          _refId: 174,
        },
        {
          factorId: 5510,
          isValidLevelNumber: true,
          isActive: false,
          id: 2493976,
          items: [
            {
              items: [
                {
                  label: 'Seed',
                  objectType: 'Catalog',
                  valueType: 'placeholder',
                  catalogType: 'INTERNAL_SEED',
                  text: 'Seed 2',
                  isPlaceholder: true,
                },
                {
                  label: 'Chemical',
                  objectType: 'Catalog',
                  valueType: 'placeholder',
                  catalogType: 'CHEMICAL',
                  text: 'Chemical 2',
                  isPlaceholder: true,
                },
                {
                  label: 'Insects',
                  objectType: 'Catalog',
                  valueType: 'placeholder',
                  catalogType: 'INSECTS',
                  text: 'Insects 2',
                  isPlaceholder: true,
                },
              ],
              objectType: 'Composite',
            },
            {
              items: [
                {
                  label: 'Seed',
                  objectType: 'Catalog',
                  valueType: 'placeholder',
                  catalogType: 'INTERNAL_SEED',
                  text: 'Seed 3',
                  isPlaceholder: true,
                },
                {
                  label: 'Chemical',
                  objectType: 'Catalog',
                  valueType: 'placeholder',
                  catalogType: 'CHEMICAL',
                  text: 'Chemical 3',
                  isPlaceholder: true,
                },
                {
                  label: 'Insects',
                  objectType: 'Catalog',
                  valueType: 'placeholder',
                  catalogType: 'INSECTS',
                  text: 'Insects 3',
                  isPlaceholder: true,
                },
              ],
              objectType: 'Composite',
            },
          ],
          objectType: 'Cluster',
          _refId: 178,
        },
        {
          factorId: 5510,
          isValidLevelNumber: true,
          isActive: false,
          id: 2493977,
          items: [
            {
              label: 'Seed',
              objectType: 'Catalog',
              valueType: 'placeholder',
              catalogType: 'INTERNAL_SEED',
              text: 'Seed 3',
              isPlaceholder: true,
            },
            {
              label: 'Chemical',
              objectType: 'Catalog',
              valueType: 'placeholder',
              catalogType: 'CHEMICAL',
              text: 'Chemical 3',
              isPlaceholder: true,
            },
            {
              label: 'Insects',
              objectType: 'Catalog',
              valueType: 'placeholder',
              catalogType: 'INSECTS',
              text: 'Insects 3',
              isPlaceholder: true,
            },
          ],
          objectType: 'Cluster',
          _refId: 186,
        },
      ]

      const fLGMatrixExpected = [
        [
          {
            factorId: 5510,
            isValidLevelNumber: true,
            isActive: false,
            id: 2493975,
            items: [
              {
                label: 'Seed',
                objectType: 'Catalog',
                valueType: 'placeholder',
                catalogType: 'INTERNAL_SEED',
                text: 'Seed 1',
                isPlaceholder: true,
              },
              {
                label: 'Chemical',
                objectType: 'Catalog',
                valueType: 'placeholder',
                catalogType: 'CHEMICAL',
                text: 'Chemical 1',
                isPlaceholder: true,
              },
              {
                label: 'Insects',
                objectType: 'Catalog',
                valueType: 'placeholder',
                catalogType: 'INSECTS',
                text: 'Insects 1',
                isPlaceholder: true,
              },
            ],
            objectType: 'Cluster',
            _refId: 174,
          },
          {
            factorId: 5510,
            isValidLevelNumber: true,
            isActive: false,
            id: 2493976,
            items: [
              {
                items: [
                  {
                    label: 'Seed',
                    objectType: 'Catalog',
                    valueType: 'placeholder',
                    catalogType: 'INTERNAL_SEED',
                    text: 'Seed 2',
                    isPlaceholder: true,
                  },
                  {
                    label: 'Chemical',
                    objectType: 'Catalog',
                    valueType: 'placeholder',
                    catalogType: 'CHEMICAL',
                    text: 'Chemical 2',
                    isPlaceholder: true,
                  },
                  {
                    label: 'Insects',
                    objectType: 'Catalog',
                    valueType: 'placeholder',
                    catalogType: 'INSECTS',
                    text: 'Insects 2',
                    isPlaceholder: true,
                  },
                ],
                objectType: 'Composite',
              },
              {
                items: [
                  {
                    label: 'Seed',
                    objectType: 'Catalog',
                    valueType: 'placeholder',
                    catalogType: 'INTERNAL_SEED',
                    text: 'Seed 3',
                    isPlaceholder: true,
                  },
                  {
                    label: 'Chemical',
                    objectType: 'Catalog',
                    valueType: 'placeholder',
                    catalogType: 'CHEMICAL',
                    text: 'Chemical 3',
                    isPlaceholder: true,
                  },
                  {
                    label: 'Insects',
                    objectType: 'Catalog',
                    valueType: 'placeholder',
                    catalogType: 'INSECTS',
                    text: 'Insects 3',
                    isPlaceholder: true,
                  },
                ],
                objectType: 'Composite',
              },
            ],
            objectType: 'Cluster',
            _refId: 178,
          },
          {
            factorId: 5510,
            isValidLevelNumber: true,
            isActive: false,
            id: 2493977,
            items: [
              {
                label: 'Seed',
                objectType: 'Catalog',
                valueType: 'placeholder',
                catalogType: 'INTERNAL_SEED',
                text: 'Seed 3',
                isPlaceholder: true,
              },
              {
                label: 'Chemical',
                objectType: 'Catalog',
                valueType: 'placeholder',
                catalogType: 'CHEMICAL',
                text: 'Chemical 3',
                isPlaceholder: true,
              },
              {
                label: 'Insects',
                objectType: 'Catalog',
                valueType: 'placeholder',
                catalogType: 'INSECTS',
                text: 'Insects 3',
                isPlaceholder: true,
              },
            ],
            objectType: 'Cluster',
            _refId: 186,
          },
        ],
        [
          {
            factorId: 5511,
            isValidLevelNumber: true,
            isActive: false,
            id: 2493978,
            items: [
              {
                label: 'Chemical',
                objectType: 'Catalog',
                valueType: 'placeholder',
                catalogType: 'CHEMICAL',
                text: 'Chemical 1',
                isPlaceholder: true,
              },
              {
                label: 'Application Rate',
                objectType: 'QandAV3',
                valueType: 'placeholder',
                questionCode: 'APP_RATE_MA',
                multiQuestionTag: 'APP_RATE',
                uomCode: 'LB_PER_AC',
                text: 'App Rate 11',
                isPlaceholder: true,
              },
              {
                label: 'Application Timing',
                objectType: 'QandAV3',
                valueType: 'placeholder',
                questionCode: 'APP_TIM',
                uomCode: 'STRING',
                text: 'Application Timing 1',
                isPlaceholder: true,
              },
              {
                label: 'Application Method',
                objectType: 'QandAV3',
                valueType: 'placeholder',
                questionCode: 'APP_MET',
                uomCode: 'METHOD',
                text: 'Application Method 1',
                isPlaceholder: true,
              },
            ],
            objectType: 'Cluster',
            _refId: 161,
          },
          {
            factorId: 5511,
            isValidLevelNumber: true,
            isActive: false,
            id: 2493979,
            items: [
              {
                label: 'Chemical',
                objectType: 'Catalog',
                valueType: 'placeholder',
                catalogType: 'CHEMICAL',
                text: 'Chemical 2',
                isPlaceholder: true,
              },
              {
                label: 'Application Rate',
                objectType: 'QandAV3',
                valueType: 'placeholder',
                questionCode: 'APP_RATE_MA',
                multiQuestionTag: 'APP_RATE',
                uomCode: 'KG_PER_HA',
                text: 'App Rate 2',
                isPlaceholder: true,
              },
              {
                label: 'Application Timing',
                objectType: 'QandAV3',
                valueType: 'placeholder',
                questionCode: 'APP_TIM',
                uomCode: 'STRING',
                text: 'Application Timing 2',
                isPlaceholder: true,
              },
              {
                label: 'Application Method',
                objectType: 'QandAV3',
                valueType: 'placeholder',
                questionCode: 'APP_MET',
                uomCode: 'METHOD',
                text: 'Application Method 2',
                isPlaceholder: true,
              },
            ],
            objectType: 'Cluster',
            _refId: 166,
          },
        ],
      ]

      const fLGMatrix = target.buildFLGMatrix(requestLevels, [])
      expect(fLGMatrix).toEqual(fLGMatrixExpected)
    })

    test('test a mix of new and existing items', () => {
      const requestLevels = [
        {
          factorId: 5511,
          isValidLevelNumber: true,
          isActive: false,
          id: 2493978,
          items: [
            {
              label: 'Chemical',
              objectType: 'Catalog',
              valueType: 'placeholder',
              catalogType: 'CHEMICAL',
              text: 'Chemical 1',
              isPlaceholder: true,
            },
            {
              label: 'Application Rate',
              objectType: 'QandAV3',
              valueType: 'placeholder',
              questionCode: 'APP_RATE_MA',
              multiQuestionTag: 'APP_RATE',
              uomCode: 'LB_PER_AC',
              text: 'App Rate 11',
              isPlaceholder: true,
            },
            {
              label: 'Application Timing',
              objectType: 'QandAV3',
              valueType: 'placeholder',
              questionCode: 'APP_TIM',
              uomCode: 'STRING',
              text: 'Application Timing 1',
              isPlaceholder: true,
            },
            {
              label: 'Application Method',
              objectType: 'QandAV3',
              valueType: 'placeholder',
              questionCode: 'APP_MET',
              uomCode: 'METHOD',
              text: 'Application Method 1',
              isPlaceholder: true,
            },
          ],
          objectType: 'Cluster',
          _refId: 161,
        },
        {
          factorId: 5511,
          isValidLevelNumber: true,
          isActive: false,
          id: 2493979,
          items: [
            {
              label: 'Chemical',
              objectType: 'Catalog',
              valueType: 'placeholder',
              catalogType: 'CHEMICAL',
              text: 'Chemical 2',
              isPlaceholder: true,
            },
            {
              label: 'Application Rate',
              objectType: 'QandAV3',
              valueType: 'placeholder',
              questionCode: 'APP_RATE_MA',
              multiQuestionTag: 'APP_RATE',
              uomCode: 'KG_PER_HA',
              text: 'App Rate 2',
              isPlaceholder: true,
            },
            {
              label: 'Application Timing',
              objectType: 'QandAV3',
              valueType: 'placeholder',
              questionCode: 'APP_TIM',
              uomCode: 'STRING',
              text: 'Application Timing 2',
              isPlaceholder: true,
            },
            {
              label: 'Application Method',
              objectType: 'QandAV3',
              valueType: 'placeholder',
              questionCode: 'APP_MET',
              uomCode: 'METHOD',
              text: 'Application Method 2',
              isPlaceholder: true,
            },
          ],
          objectType: 'Cluster',
          _refId: 166,
        },
        {
          factorId: 5510,
          isValidLevelNumber: true,
          isActive: false,
          id: 2493975,
          items: [
            {
              label: 'Seed',
              objectType: 'Catalog',
              valueType: 'placeholder',
              catalogType: 'INTERNAL_SEED',
              text: 'Seed 1',
              isPlaceholder: true,
            },
            {
              label: 'Chemical',
              objectType: 'Catalog',
              valueType: 'placeholder',
              catalogType: 'CHEMICAL',
              text: 'Chemical 1',
              isPlaceholder: true,
            },
            {
              label: 'Insects',
              objectType: 'Catalog',
              valueType: 'placeholder',
              catalogType: 'INSECTS',
              text: 'Insects 1',
              isPlaceholder: true,
            },
          ],
          objectType: 'Cluster',
          _refId: 174,
        },
        {
          factorId: 5510,
          isValidLevelNumber: true,
          isActive: false,
          id: 2493976,
          items: [
            {
              items: [
                {
                  label: 'Seed',
                  objectType: 'Catalog',
                  valueType: 'placeholder',
                  catalogType: 'INTERNAL_SEED',
                  text: 'Seed 2',
                  isPlaceholder: true,
                },
                {
                  label: 'Chemical',
                  objectType: 'Catalog',
                  valueType: 'placeholder',
                  catalogType: 'CHEMICAL',
                  text: 'Chemical 2',
                  isPlaceholder: true,
                },
                {
                  label: 'Insects',
                  objectType: 'Catalog',
                  valueType: 'placeholder',
                  catalogType: 'INSECTS',
                  text: 'Insects 2',
                  isPlaceholder: true,
                },
              ],
              objectType: 'Composite',
            },
            {
              items: [
                {
                  label: 'Seed',
                  objectType: 'Catalog',
                  valueType: 'placeholder',
                  catalogType: 'INTERNAL_SEED',
                  text: 'Seed 3',
                  isPlaceholder: true,
                },
                {
                  label: 'Chemical',
                  objectType: 'Catalog',
                  valueType: 'placeholder',
                  catalogType: 'CHEMICAL',
                  text: 'Chemical 3',
                  isPlaceholder: true,
                },
                {
                  label: 'Insects',
                  objectType: 'Catalog',
                  valueType: 'placeholder',
                  catalogType: 'INSECTS',
                  text: 'Insects 3',
                  isPlaceholder: true,
                },
              ],
              objectType: 'Composite',
            },
          ],
          objectType: 'Cluster',
          _refId: 178,
        },
        {
          factorId: 5510,
          isValidLevelNumber: true,
          isActive: false,
          id: 2493977,
          items: [
            {
              label: 'Seed',
              objectType: 'Catalog',
              valueType: 'placeholder',
              catalogType: 'INTERNAL_SEED',
              text: 'Seed 3',
              isPlaceholder: true,
            },
            {
              label: 'Chemical',
              objectType: 'Catalog',
              valueType: 'placeholder',
              catalogType: 'CHEMICAL',
              text: 'Chemical 3',
              isPlaceholder: true,
            },
            {
              label: 'Insects',
              objectType: 'Catalog',
              valueType: 'placeholder',
              catalogType: 'INSECTS',
              text: 'Insects 3',
              isPlaceholder: true,
            },
          ],
          objectType: 'Cluster',
          _refId: 186,
        },
        {
          factorId: 5510,
          isValidLevelNumber: true,
          isActive: false,
          items: [
            {
              label: 'Seed',
              objectType: 'Catalog',
              valueType: 'placeholder',
              catalogType: 'INTERNAL_SEED',
              text: 'Seed 4',
              isPlaceholder: true,
            },
            {
              label: 'Chemical',
              objectType: 'Catalog',
              valueType: 'placeholder',
              catalogType: 'CHEMICAL',
              text: 'Chemical 4',
              isPlaceholder: true,
            },
            {
              label: 'Insects',
              objectType: 'Catalog',
              valueType: 'placeholder',
              catalogType: 'INSECTS',
              text: 'Insects 4',
              isPlaceholder: true,
            },
          ],
          objectType: 'Cluster',
          _refId: 192,
        },
        {
          isValidLevelNumber: true,
          isActive: false,
          items: [
            {
              label: 'Seed Density per Area',
              objectType: 'QandA',
              valueType: 'placeholder',
              questionCode: 'SDPA',
              uomCode: 'SEEDS_PER_HA',
              text: 'Hello World',
              isPlaceholder: true,
            },
          ],
          objectType: 'Cluster',
          _refId: 198,
        },
        {
          isValidLevelNumber: true,
          isActive: false,
          items: [
            {
              label: 'Seed Density per Area',
              objectType: 'QandA',
              valueType: 'placeholder',
              questionCode: 'SDPA',
              uomCode: 'PLNTS_PER_PLT',
              text: 'Seed Density per Area 2',
              isPlaceholder: true,
            },
          ],
          objectType: 'Cluster',
          _refId: 200,
        },
      ]

      const factorLevels = [
        {
          id: 2494445,
          value: {
            items: [
              {
                text: 'Hello World',
                label: 'Seed Density per Area',
                uomCode: 'SEEDS_PER_HA',
                valueType: 'placeholder',
                objectType: 'QandA',
                questionCode: 'SDPA',
                isPlaceholder: true,
              },
            ],
            objectType: 'Cluster',
          },
          factor_id: 5667,
          created_user_id: 'EHZBZ',
          created_date: '2021-12-01T16:28:50.696Z',
          modified_user_id: 'EHZBZ',
          modified_date: '2021-12-01T16:28:50.696Z',
        },
        {
          id: 2494446,
          value: {
            items: [
              {
                text: 'Seed Density per Area 2',
                label: 'Seed Density per Area',
                uomCode: 'PLNTS_PER_PLT',
                valueType: 'placeholder',
                objectType: 'QandA',
                questionCode: 'SDPA',
                isPlaceholder: true,
              },
            ],
            objectType: 'Cluster',
          },
          factor_id: 5667,
          created_user_id: 'EHZBZ',
          created_date: '2021-12-01T16:28:50.696Z',
          modified_user_id: 'EHZBZ',
          modified_date: '2021-12-01T16:28:50.696Z',
        },
      ]

      const fLGMatrixExpected = [
        [
          {
            factorId: 5510,
            isValidLevelNumber: true,
            isActive: false,
            id: 2493975,
            items: [
              {
                label: 'Seed',
                objectType: 'Catalog',
                valueType: 'placeholder',
                catalogType: 'INTERNAL_SEED',
                text: 'Seed 1',
                isPlaceholder: true,
              },
              {
                label: 'Chemical',
                objectType: 'Catalog',
                valueType: 'placeholder',
                catalogType: 'CHEMICAL',
                text: 'Chemical 1',
                isPlaceholder: true,
              },
              {
                label: 'Insects',
                objectType: 'Catalog',
                valueType: 'placeholder',
                catalogType: 'INSECTS',
                text: 'Insects 1',
                isPlaceholder: true,
              },
            ],
            objectType: 'Cluster',
            _refId: 174,
          },
          {
            factorId: 5510,
            isValidLevelNumber: true,
            isActive: false,
            id: 2493976,
            items: [
              {
                items: [
                  {
                    label: 'Seed',
                    objectType: 'Catalog',
                    valueType: 'placeholder',
                    catalogType: 'INTERNAL_SEED',
                    text: 'Seed 2',
                    isPlaceholder: true,
                  },
                  {
                    label: 'Chemical',
                    objectType: 'Catalog',
                    valueType: 'placeholder',
                    catalogType: 'CHEMICAL',
                    text: 'Chemical 2',
                    isPlaceholder: true,
                  },
                  {
                    label: 'Insects',
                    objectType: 'Catalog',
                    valueType: 'placeholder',
                    catalogType: 'INSECTS',
                    text: 'Insects 2',
                    isPlaceholder: true,
                  },
                ],
                objectType: 'Composite',
              },
              {
                items: [
                  {
                    label: 'Seed',
                    objectType: 'Catalog',
                    valueType: 'placeholder',
                    catalogType: 'INTERNAL_SEED',
                    text: 'Seed 3',
                    isPlaceholder: true,
                  },
                  {
                    label: 'Chemical',
                    objectType: 'Catalog',
                    valueType: 'placeholder',
                    catalogType: 'CHEMICAL',
                    text: 'Chemical 3',
                    isPlaceholder: true,
                  },
                  {
                    label: 'Insects',
                    objectType: 'Catalog',
                    valueType: 'placeholder',
                    catalogType: 'INSECTS',
                    text: 'Insects 3',
                    isPlaceholder: true,
                  },
                ],
                objectType: 'Composite',
              },
            ],
            objectType: 'Cluster',
            _refId: 178,
          },
          {
            factorId: 5510,
            isValidLevelNumber: true,
            isActive: false,
            id: 2493977,
            items: [
              {
                label: 'Seed',
                objectType: 'Catalog',
                valueType: 'placeholder',
                catalogType: 'INTERNAL_SEED',
                text: 'Seed 3',
                isPlaceholder: true,
              },
              {
                label: 'Chemical',
                objectType: 'Catalog',
                valueType: 'placeholder',
                catalogType: 'CHEMICAL',
                text: 'Chemical 3',
                isPlaceholder: true,
              },
              {
                label: 'Insects',
                objectType: 'Catalog',
                valueType: 'placeholder',
                catalogType: 'INSECTS',
                text: 'Insects 3',
                isPlaceholder: true,
              },
            ],
            objectType: 'Cluster',
            _refId: 186,
          },
          {
            factorId: 5510,
            isValidLevelNumber: true,
            isActive: false,
            items: [
              {
                label: 'Seed',
                objectType: 'Catalog',
                valueType: 'placeholder',
                catalogType: 'INTERNAL_SEED',
                text: 'Seed 4',
                isPlaceholder: true,
              },
              {
                label: 'Chemical',
                objectType: 'Catalog',
                valueType: 'placeholder',
                catalogType: 'CHEMICAL',
                text: 'Chemical 4',
                isPlaceholder: true,
              },
              {
                label: 'Insects',
                objectType: 'Catalog',
                valueType: 'placeholder',
                catalogType: 'INSECTS',
                text: 'Insects 4',
                isPlaceholder: true,
              },
            ],
            objectType: 'Cluster',
            _refId: 192,
          },
        ],
        [
          {
            factorId: 5511,
            isValidLevelNumber: true,
            isActive: false,
            id: 2493978,
            items: [
              {
                label: 'Chemical',
                objectType: 'Catalog',
                valueType: 'placeholder',
                catalogType: 'CHEMICAL',
                text: 'Chemical 1',
                isPlaceholder: true,
              },
              {
                label: 'Application Rate',
                objectType: 'QandAV3',
                valueType: 'placeholder',
                questionCode: 'APP_RATE_MA',
                multiQuestionTag: 'APP_RATE',
                uomCode: 'LB_PER_AC',
                text: 'App Rate 11',
                isPlaceholder: true,
              },
              {
                label: 'Application Timing',
                objectType: 'QandAV3',
                valueType: 'placeholder',
                questionCode: 'APP_TIM',
                uomCode: 'STRING',
                text: 'Application Timing 1',
                isPlaceholder: true,
              },
              {
                label: 'Application Method',
                objectType: 'QandAV3',
                valueType: 'placeholder',
                questionCode: 'APP_MET',
                uomCode: 'METHOD',
                text: 'Application Method 1',
                isPlaceholder: true,
              },
            ],
            objectType: 'Cluster',
            _refId: 161,
          },
          {
            factorId: 5511,
            isValidLevelNumber: true,
            isActive: false,
            id: 2493979,
            items: [
              {
                label: 'Chemical',
                objectType: 'Catalog',
                valueType: 'placeholder',
                catalogType: 'CHEMICAL',
                text: 'Chemical 2',
                isPlaceholder: true,
              },
              {
                label: 'Application Rate',
                objectType: 'QandAV3',
                valueType: 'placeholder',
                questionCode: 'APP_RATE_MA',
                multiQuestionTag: 'APP_RATE',
                uomCode: 'KG_PER_HA',
                text: 'App Rate 2',
                isPlaceholder: true,
              },
              {
                label: 'Application Timing',
                objectType: 'QandAV3',
                valueType: 'placeholder',
                questionCode: 'APP_TIM',
                uomCode: 'STRING',
                text: 'Application Timing 2',
                isPlaceholder: true,
              },
              {
                label: 'Application Method',
                objectType: 'QandAV3',
                valueType: 'placeholder',
                questionCode: 'APP_MET',
                uomCode: 'METHOD',
                text: 'Application Method 2',
                isPlaceholder: true,
              },
            ],
            objectType: 'Cluster',
            _refId: 166,
          },
        ],
        [
          {
            factorId: 5667,
            isValidLevelNumber: true,
            isActive: false,
            items: [
              {
                label: 'Seed Density per Area',
                objectType: 'QandA',
                valueType: 'placeholder',
                questionCode: 'SDPA',
                uomCode: 'SEEDS_PER_HA',
                text: 'Hello World',
                isPlaceholder: true,
              },
            ],
            objectType: 'Cluster',
            _refId: 198,
            id: 2494445,
          },
          {
            factorId: 5667,
            isValidLevelNumber: true,
            isActive: false,
            items: [
              {
                label: 'Seed Density per Area',
                objectType: 'QandA',
                valueType: 'placeholder',
                questionCode: 'SDPA',
                uomCode: 'PLNTS_PER_PLT',
                text: 'Seed Density per Area 2',
                isPlaceholder: true,
              },
            ],
            objectType: 'Cluster',
            _refId: 200,
            id: 2494446,
          },
        ],
      ]

      const fLGMatrix = target.buildFLGMatrix(requestLevels, factorLevels)
      expect(fLGMatrix).toEqual(fLGMatrixExpected)
    })
  })

  describe('buildPropsForFactorLevels', () => {
    test('test without multi-question tag', () => {
      const fLGMatrix = [
        [
          {
            factorId: 5510,
            isValidLevelNumber: true,
            isActive: false,
            items: [
              {
                label: 'Seed',
                objectType: 'Catalog',
                valueType: 'placeholder',
                catalogType: 'INTERNAL_SEED',
                text: 'Seed 1',
                isPlaceholder: true,
              },
              {
                label: 'Chemical',
                objectType: 'Catalog',
                valueType: 'placeholder',
                catalogType: 'CHEMICAL',
                text: 'Chemical 1',
                isPlaceholder: true,
              },
              {
                label: 'Insects',
                objectType: 'Catalog',
                valueType: 'placeholder',
                catalogType: 'INSECTS',
                text: 'Insects 1',
                isPlaceholder: true,
              },
            ],
            objectType: 'Cluster',
            _refId: 53,
            id: 2493975,
          },
          {
            factorId: 5510,
            isValidLevelNumber: true,
            isActive: false,
            items: [
              {
                items: [
                  {
                    label: 'Seed',
                    objectType: 'Catalog',
                    valueType: 'placeholder',
                    catalogType: 'INTERNAL_SEED',
                    text: 'Seed 2',
                    isPlaceholder: true,
                  },
                  {
                    label: 'Chemical',
                    objectType: 'Catalog',
                    valueType: 'placeholder',
                    catalogType: 'CHEMICAL',
                    text: 'Chemical 2',
                    isPlaceholder: true,
                  },
                  {
                    label: 'Insects',
                    objectType: 'Catalog',
                    valueType: 'placeholder',
                    catalogType: 'INSECTS',
                    text: 'Insects 2',
                    isPlaceholder: true,
                  },
                ],
                objectType: 'Composite',
              },
              {
                items: [
                  {
                    label: 'Seed',
                    objectType: 'Catalog',
                    valueType: 'placeholder',
                    catalogType: 'INTERNAL_SEED',
                    text: 'Seed 3',
                    isPlaceholder: true,
                  },
                  {
                    label: 'Chemical',
                    objectType: 'Catalog',
                    valueType: 'placeholder',
                    catalogType: 'CHEMICAL',
                    text: 'Chemical 3',
                    isPlaceholder: true,
                  },
                  {
                    label: 'Insects',
                    objectType: 'Catalog',
                    valueType: 'placeholder',
                    catalogType: 'INSECTS',
                    text: 'Insects 3',
                    isPlaceholder: true,
                  },
                ],
                objectType: 'Composite',
              },
            ],
            objectType: 'Cluster',
            _refId: 57,
            id: 2493976,
          },
          {
            factorId: 5510,
            isValidLevelNumber: true,
            isActive: false,
            items: [
              {
                label: 'Seed',
                objectType: 'Catalog',
                valueType: 'placeholder',
                catalogType: 'INTERNAL_SEED',
                text: 'Seed 3',
                isPlaceholder: true,
              },
              {
                label: 'Chemical',
                objectType: 'Catalog',
                valueType: 'placeholder',
                catalogType: 'CHEMICAL',
                text: 'Chemical 3',
                isPlaceholder: true,
              },
              {
                label: 'Insects',
                objectType: 'Catalog',
                valueType: 'placeholder',
                catalogType: 'INSECTS',
                text: 'Insects 3',
                isPlaceholder: true,
              },
            ],
            objectType: 'Cluster',
            _refId: 65,
            id: 2493977,
          },
        ],
        [
          {
            factorId: 5511,
            isValidLevelNumber: true,
            isActive: false,
            items: [
              {
                label: 'Chemical',
                objectType: 'Catalog',
                valueType: 'placeholder',
                catalogType: 'CHEMICAL',
                text: 'Chemical 1',
                isPlaceholder: true,
              },
              {
                label: 'Application Rate',
                objectType: 'QandAV3',
                valueType: 'placeholder',
                questionCode: 'APP_RATE_MA',
                multiQuestionTag: 'APP_RATE',
                uomCode: 'LB_PER_AC',
                text: 'App Rate 1',
                isPlaceholder: true,
              },
              {
                label: 'Application Timing',
                objectType: 'QandAV3',
                valueType: 'placeholder',
                questionCode: 'APP_TIM',
                uomCode: 'STRING',
                text: 'Application Timing 1',
                isPlaceholder: true,
              },
              {
                label: 'Application Method',
                objectType: 'QandAV3',
                valueType: 'placeholder',
                questionCode: 'APP_MET',
                uomCode: 'METHOD',
                text: 'Application Method 1',
                isPlaceholder: true,
              },
            ],
            objectType: 'Cluster',
            _refId: 80,
            id: 2493978,
          },
          {
            factorId: 5511,
            isValidLevelNumber: true,
            isActive: false,
            items: [
              {
                label: 'Chemical',
                objectType: 'Catalog',
                valueType: 'placeholder',
                catalogType: 'CHEMICAL',
                text: 'Chemical 2',
                isPlaceholder: true,
              },
              {
                label: 'Application Rate',
                objectType: 'QandAV3',
                valueType: 'placeholder',
                questionCode: 'APP_RATE_MA',
                multiQuestionTag: 'APP_RATE',
                uomCode: 'KG_PER_HA',
                text: 'App Rate 2',
                isPlaceholder: true,
              },
              {
                label: 'Application Timing',
                objectType: 'QandAV3',
                valueType: 'placeholder',
                questionCode: 'APP_TIM',
                uomCode: 'STRING',
                text: 'Application Timing 2',
                isPlaceholder: true,
              },
              {
                label: 'Application Method',
                objectType: 'QandAV3',
                valueType: 'placeholder',
                questionCode: 'APP_MET',
                uomCode: 'METHOD',
                text: 'Application Method 2',
                isPlaceholder: true,
              },
            ],
            objectType: 'Cluster',
            _refId: 85,
            id: 2493979,
          },
        ],
      ]

      const propsForFactorLevelsExpected = [
        {
          label: 'Seed',
          objectType: 'Catalog',
          valueType: 'placeholder',
          catalogType: 'INTERNAL_SEED',
          text: 'Seed 1',
          isPlaceholder: true,
          factorId: 5510,
          order: 0,
        },
        {
          label: 'Chemical',
          objectType: 'Catalog',
          valueType: 'placeholder',
          catalogType: 'CHEMICAL',
          text: 'Chemical 1',
          isPlaceholder: true,
          factorId: 5510,
          order: 1,
        },
        {
          label: 'Insects',
          objectType: 'Catalog',
          valueType: 'placeholder',
          catalogType: 'INSECTS',
          text: 'Insects 1',
          isPlaceholder: true,
          factorId: 5510,
          order: 2,
        },
        {
          label: 'Chemical',
          objectType: 'Catalog',
          valueType: 'placeholder',
          catalogType: 'CHEMICAL',
          text: 'Chemical 1',
          isPlaceholder: true,
          factorId: 5511,
          order: 0,
        },
        {
          label: 'Application Rate',
          objectType: 'QandAV3',
          valueType: 'placeholder',
          questionCode: null,
          multiQuestionTag: 'APP_RATE',
          uomCode: 'LB_PER_AC',
          text: 'App Rate 1',
          isPlaceholder: true,
          factorId: 5511,
          order: 1,
        },
        {
          label: 'Application Timing',
          objectType: 'QandAV3',
          valueType: 'placeholder',
          questionCode: 'APP_TIM',
          uomCode: 'STRING',
          text: 'Application Timing 1',
          isPlaceholder: true,
          factorId: 5511,
          order: 2,
        },
        {
          label: 'Application Method',
          objectType: 'QandAV3',
          valueType: 'placeholder',
          questionCode: 'APP_MET',
          uomCode: 'METHOD',
          text: 'Application Method 1',
          isPlaceholder: true,
          factorId: 5511,
          order: 3,
        },
      ]

      const propsForFactorLevels = target.buildPropsForFactorLevels(fLGMatrix)
      expect(propsForFactorLevels).toEqual(propsForFactorLevelsExpected)
    })

    test('test with multi-question tag', () => {
      const fLGMatrix = [
        [
          {
            factorId: 5668,
            isValidLevelNumber: true,
            isActive: false,
            items: [
              {
                label: 'Seed Density per Area',
                objectType: 'QandAV3',
                valueType: 'placeholder',
                questionCode: 'APP_RATE_MA',
                multiQuestionTag: 'APP_RATE',
                uomCode: 'TON_PER_AC',
                text: 'Seed Density per Area A',
                isPlaceholder: true,
              },
            ],
            objectType: 'Cluster',
            _refId: 40,
            id: 2494448,
          },
          {
            factorId: 5668,
            isValidLevelNumber: true,
            isActive: false,
            items: [
              {
                label: 'Seed Density per Area',
                objectType: 'QandAV3',
                valueType: 'placeholder',
                questionCode: 'APP_RATE_MA',
                multiQuestionTag: 'APP_RATE',
                uomCode: 'LB_PER_AC',
                text: 'Seed Density per Area 2',
                isPlaceholder: true,
              },
            ],
            objectType: 'Cluster',
            _refId: 42,
            id: 2494449,
          },
        ],
      ]

      const propsForFactorLevelsExpected = [
        {
          label: 'Seed Density per Area',
          objectType: 'QandAV3',
          valueType: 'placeholder',
          questionCode: null,
          multiQuestionTag: 'APP_RATE',
          uomCode: 'TON_PER_AC',
          text: 'Seed Density per Area A',
          isPlaceholder: true,
          factorId: 5668,
          order: 0,
        },
      ]

      const propsForFactorLevels = target.buildPropsForFactorLevels(fLGMatrix)
      expect(propsForFactorLevels).toEqual(propsForFactorLevelsExpected)
    })
  })

  describe('buildFactorLevelDetails', () => {
    test('test without multi-question tag', () => {
      const fLGMatrix = [
        [
          {
            factorId: 5510,
            isValidLevelNumber: true,
            isActive: false,
            items: [
              {
                label: 'Seed',
                objectType: 'Catalog',
                valueType: 'placeholder',
                catalogType: 'INTERNAL_SEED',
                text: 'Seed 1',
                isPlaceholder: true,
              },
              {
                label: 'Chemical',
                objectType: 'Catalog',
                valueType: 'placeholder',
                catalogType: 'CHEMICAL',
                text: 'Chemical 1',
                isPlaceholder: true,
              },
              {
                label: 'Insects',
                objectType: 'Catalog',
                valueType: 'placeholder',
                catalogType: 'INSECTS',
                text: 'Insects 1',
                isPlaceholder: true,
              },
            ],
            objectType: 'Cluster',
            _refId: 53,
            id: 2493975,
          },
          {
            factorId: 5510,
            isValidLevelNumber: true,
            isActive: false,
            items: [
              {
                items: [
                  {
                    label: 'Seed',
                    objectType: 'Catalog',
                    valueType: 'placeholder',
                    catalogType: 'INTERNAL_SEED',
                    text: 'Seed 2',
                    isPlaceholder: true,
                  },
                  {
                    label: 'Chemical',
                    objectType: 'Catalog',
                    valueType: 'placeholder',
                    catalogType: 'CHEMICAL',
                    text: 'Chemical 2',
                    isPlaceholder: true,
                  },
                  {
                    label: 'Insects',
                    objectType: 'Catalog',
                    valueType: 'placeholder',
                    catalogType: 'INSECTS',
                    text: 'Insects 2',
                    isPlaceholder: true,
                  },
                ],
                objectType: 'Composite',
              },
              {
                items: [
                  {
                    label: 'Seed',
                    objectType: 'Catalog',
                    valueType: 'placeholder',
                    catalogType: 'INTERNAL_SEED',
                    text: 'Seed 3',
                    isPlaceholder: true,
                  },
                  {
                    label: 'Chemical',
                    objectType: 'Catalog',
                    valueType: 'placeholder',
                    catalogType: 'CHEMICAL',
                    text: 'Chemical 3',
                    isPlaceholder: true,
                  },
                  {
                    label: 'Insects',
                    objectType: 'Catalog',
                    valueType: 'placeholder',
                    catalogType: 'INSECTS',
                    text: 'Insects 3',
                    isPlaceholder: true,
                  },
                ],
                objectType: 'Composite',
              },
            ],
            objectType: 'Cluster',
            _refId: 57,
            id: 2493976,
          },
          {
            factorId: 5510,
            isValidLevelNumber: true,
            isActive: false,
            items: [
              {
                label: 'Seed',
                objectType: 'Catalog',
                valueType: 'placeholder',
                catalogType: 'INTERNAL_SEED',
                text: 'Seed 3',
                isPlaceholder: true,
              },
              {
                label: 'Chemical',
                objectType: 'Catalog',
                valueType: 'placeholder',
                catalogType: 'CHEMICAL',
                text: 'Chemical 3',
                isPlaceholder: true,
              },
              {
                label: 'Insects',
                objectType: 'Catalog',
                valueType: 'placeholder',
                catalogType: 'INSECTS',
                text: 'Insects 3',
                isPlaceholder: true,
              },
            ],
            objectType: 'Cluster',
            _refId: 65,
            id: 2493977,
          },
        ],
        [
          {
            factorId: 5511,
            isValidLevelNumber: true,
            isActive: false,
            items: [
              {
                label: 'Chemical',
                objectType: 'Catalog',
                valueType: 'placeholder',
                catalogType: 'CHEMICAL',
                text: 'Chemical 1',
                isPlaceholder: true,
              },
              {
                label: 'Application Rate',
                objectType: 'QandAV3',
                valueType: 'placeholder',
                questionCode: 'APP_RATE_MA',
                multiQuestionTag: 'APP_RATE',
                uomCode: 'LB_PER_AC',
                text: 'App Rate 1',
                isPlaceholder: true,
              },
              {
                label: 'Application Timing',
                objectType: 'QandAV3',
                valueType: 'placeholder',
                questionCode: 'APP_TIM',
                uomCode: 'STRING',
                text: 'Application Timing 1',
                isPlaceholder: true,
              },
              {
                label: 'Application Method',
                objectType: 'QandAV3',
                valueType: 'placeholder',
                questionCode: 'APP_MET',
                uomCode: 'METHOD',
                text: 'Application Method 1',
                isPlaceholder: true,
              },
            ],
            objectType: 'Cluster',
            _refId: 80,
            id: 2493978,
          },
          {
            factorId: 5511,
            isValidLevelNumber: true,
            isActive: false,
            items: [
              {
                label: 'Chemical',
                objectType: 'Catalog',
                valueType: 'placeholder',
                catalogType: 'CHEMICAL',
                text: 'Chemical 2',
                isPlaceholder: true,
              },
              {
                label: 'Application Rate',
                objectType: 'QandAV3',
                valueType: 'placeholder',
                questionCode: 'APP_RATE_MA',
                multiQuestionTag: 'APP_RATE',
                uomCode: 'KG_PER_HA',
                text: 'App Rate 2',
                isPlaceholder: true,
              },
              {
                label: 'Application Timing',
                objectType: 'QandAV3',
                valueType: 'placeholder',
                questionCode: 'APP_TIM',
                uomCode: 'STRING',
                text: 'Application Timing 2',
                isPlaceholder: true,
              },
              {
                label: 'Application Method',
                objectType: 'QandAV3',
                valueType: 'placeholder',
                questionCode: 'APP_MET',
                uomCode: 'METHOD',
                text: 'Application Method 2',
                isPlaceholder: true,
              },
            ],
            objectType: 'Cluster',
            _refId: 85,
            id: 2493979,
          },
        ],
      ]

      const propsForFactorLevels = [
        {
          label: 'Seed',
          objectType: 'Catalog',
          valueType: 'placeholder',
          catalogType: 'INTERNAL_SEED',
          text: 'Seed 1',
          isPlaceholder: true,
          factorId: 5510,
          order: 0,
        },
        {
          label: 'Chemical',
          objectType: 'Catalog',
          valueType: 'placeholder',
          catalogType: 'CHEMICAL',
          text: 'Chemical 1',
          isPlaceholder: true,
          factorId: 5510,
          order: 1,
        },
        {
          label: 'Insects',
          objectType: 'Catalog',
          valueType: 'placeholder',
          catalogType: 'INSECTS',
          text: 'Insects 1',
          isPlaceholder: true,
          factorId: 5510,
          order: 2,
        },
        {
          label: 'Chemical',
          objectType: 'Catalog',
          valueType: 'placeholder',
          catalogType: 'CHEMICAL',
          text: 'Chemical 1',
          isPlaceholder: true,
          factorId: 5511,
          order: 0,
        },
        {
          label: 'Application Rate',
          objectType: 'QandAV3',
          valueType: 'placeholder',
          questionCode: null,
          multiQuestionTag: 'APP_RATE',
          uomCode: 'LB_PER_AC',
          text: 'App Rate 1',
          isPlaceholder: true,
          factorId: 5511,
          order: 1,
        },
        {
          label: 'Application Timing',
          objectType: 'QandAV3',
          valueType: 'placeholder',
          questionCode: 'APP_TIM',
          uomCode: 'STRING',
          text: 'Application Timing 1',
          isPlaceholder: true,
          factorId: 5511,
          order: 2,
        },
        {
          label: 'Application Method',
          objectType: 'QandAV3',
          valueType: 'placeholder',
          questionCode: 'APP_MET',
          uomCode: 'METHOD',
          text: 'Application Method 1',
          isPlaceholder: true,
          factorId: 5511,
          order: 3,
        },
      ]

      const propertyIds = [
        {
          id: 90,
        },
        {
          id: 91,
        },
        {
          id: 92,
        },
        {
          id: 93,
        },
        {
          id: 94,
        },
        {
          id: 95,
        },
        {
          id: 96,
        },
      ]

      const factorLevelDetailsExpected = [
        {
          label: 'Seed',
          objectType: 'Catalog',
          valueType: 'placeholder',
          catalogType: 'INTERNAL_SEED',
          text: 'Seed 1',
          isPlaceholder: true,
          factorLevelId: 2493975,
          factorPropertiesForLevelId: 90,
          order: 0,
          questionCode: null,
        },
        {
          label: 'Chemical',
          objectType: 'Catalog',
          valueType: 'placeholder',
          catalogType: 'CHEMICAL',
          text: 'Chemical 1',
          isPlaceholder: true,
          factorLevelId: 2493975,
          factorPropertiesForLevelId: 91,
          order: 0,
          questionCode: null,
        },
        {
          label: 'Insects',
          objectType: 'Catalog',
          valueType: 'placeholder',
          catalogType: 'INSECTS',
          text: 'Insects 1',
          isPlaceholder: true,
          factorLevelId: 2493975,
          factorPropertiesForLevelId: 92,
          order: 0,
          questionCode: null,
        },
        {
          label: 'Seed',
          objectType: 'Catalog',
          valueType: 'placeholder',
          catalogType: 'INTERNAL_SEED',
          text: 'Seed 2',
          isPlaceholder: true,
          factorPropertiesForLevelId: 90,
          order: 0,
          factorLevelId: 2493976,
          questionCode: null,
        },
        {
          label: 'Chemical',
          objectType: 'Catalog',
          valueType: 'placeholder',
          catalogType: 'CHEMICAL',
          text: 'Chemical 2',
          isPlaceholder: true,
          factorPropertiesForLevelId: 91,
          order: 0,
          factorLevelId: 2493976,
          questionCode: null,
        },
        {
          label: 'Insects',
          objectType: 'Catalog',
          valueType: 'placeholder',
          catalogType: 'INSECTS',
          text: 'Insects 2',
          isPlaceholder: true,
          factorPropertiesForLevelId: 92,
          order: 0,
          factorLevelId: 2493976,
          questionCode: null,
        },
        {
          label: 'Seed',
          objectType: 'Catalog',
          valueType: 'placeholder',
          catalogType: 'INTERNAL_SEED',
          text: 'Seed 3',
          isPlaceholder: true,
          factorPropertiesForLevelId: 90,
          order: 1,
          factorLevelId: 2493976,
          questionCode: null,
        },
        {
          label: 'Chemical',
          objectType: 'Catalog',
          valueType: 'placeholder',
          catalogType: 'CHEMICAL',
          text: 'Chemical 3',
          isPlaceholder: true,
          factorPropertiesForLevelId: 91,
          order: 1,
          factorLevelId: 2493976,
          questionCode: null,
        },
        {
          label: 'Insects',
          objectType: 'Catalog',
          valueType: 'placeholder',
          catalogType: 'INSECTS',
          text: 'Insects 3',
          isPlaceholder: true,
          factorPropertiesForLevelId: 92,
          order: 1,
          factorLevelId: 2493976,
          questionCode: null,
        },
        {
          label: 'Seed',
          objectType: 'Catalog',
          valueType: 'placeholder',
          catalogType: 'INTERNAL_SEED',
          text: 'Seed 3',
          isPlaceholder: true,
          factorLevelId: 2493977,
          factorPropertiesForLevelId: 90,
          order: 0,
          questionCode: null,
        },
        {
          label: 'Chemical',
          objectType: 'Catalog',
          valueType: 'placeholder',
          catalogType: 'CHEMICAL',
          text: 'Chemical 3',
          isPlaceholder: true,
          factorLevelId: 2493977,
          factorPropertiesForLevelId: 91,
          order: 0,
          questionCode: null,
        },
        {
          label: 'Insects',
          objectType: 'Catalog',
          valueType: 'placeholder',
          catalogType: 'INSECTS',
          text: 'Insects 3',
          isPlaceholder: true,
          factorLevelId: 2493977,
          factorPropertiesForLevelId: 92,
          order: 0,
          questionCode: null,
        },
        {
          label: 'Chemical',
          objectType: 'Catalog',
          valueType: 'placeholder',
          catalogType: 'CHEMICAL',
          text: 'Chemical 1',
          isPlaceholder: true,
          factorLevelId: 2493978,
          factorPropertiesForLevelId: 93,
          order: 0,
          questionCode: null,
        },
        {
          label: 'Application Rate',
          objectType: 'QandAV3',
          valueType: 'placeholder',
          questionCode: 'APP_RATE_MA',
          multiQuestionTag: 'APP_RATE',
          uomCode: 'LB_PER_AC',
          text: 'App Rate 1',
          isPlaceholder: true,
          factorLevelId: 2493978,
          factorPropertiesForLevelId: 94,
          order: 0,
        },
        {
          label: 'Application Timing',
          objectType: 'QandAV3',
          valueType: 'placeholder',
          questionCode: null,
          uomCode: 'STRING',
          text: 'Application Timing 1',
          isPlaceholder: true,
          factorLevelId: 2493978,
          factorPropertiesForLevelId: 95,
          order: 0,
        },
        {
          label: 'Application Method',
          objectType: 'QandAV3',
          valueType: 'placeholder',
          questionCode: null,
          uomCode: 'METHOD',
          text: 'Application Method 1',
          isPlaceholder: true,
          factorLevelId: 2493978,
          factorPropertiesForLevelId: 96,
          order: 0,
        },
        {
          label: 'Chemical',
          objectType: 'Catalog',
          valueType: 'placeholder',
          catalogType: 'CHEMICAL',
          text: 'Chemical 2',
          isPlaceholder: true,
          factorLevelId: 2493979,
          factorPropertiesForLevelId: 93,
          order: 0,
          questionCode: null,
        },
        {
          label: 'Application Rate',
          objectType: 'QandAV3',
          valueType: 'placeholder',
          questionCode: 'APP_RATE_MA',
          multiQuestionTag: 'APP_RATE',
          uomCode: 'KG_PER_HA',
          text: 'App Rate 2',
          isPlaceholder: true,
          factorLevelId: 2493979,
          factorPropertiesForLevelId: 94,
          order: 0,
        },
        {
          label: 'Application Timing',
          objectType: 'QandAV3',
          valueType: 'placeholder',
          questionCode: null,
          uomCode: 'STRING',
          text: 'Application Timing 2',
          isPlaceholder: true,
          factorLevelId: 2493979,
          factorPropertiesForLevelId: 95,
          order: 0,
        },
        {
          label: 'Application Method',
          objectType: 'QandAV3',
          valueType: 'placeholder',
          questionCode: null,
          uomCode: 'METHOD',
          text: 'Application Method 2',
          isPlaceholder: true,
          factorLevelId: 2493979,
          factorPropertiesForLevelId: 96,
          order: 0,
        },
      ]

      const factorLevelDetails = target.buildFactorLevelDetails(fLGMatrix, propsForFactorLevels, propertyIds)
      expect(factorLevelDetails).toEqual(factorLevelDetailsExpected)
    })

    test('test with multi-question tag', () => {
      const fLGMatrix = [
        [
          {
            factorId: 5668,
            isValidLevelNumber: true,
            isActive: false,
            items: [
              {
                label: 'Seed Density per Area',
                objectType: 'QandAV3',
                valueType: 'placeholder',
                questionCode: 'APP_RATE_MA',
                multiQuestionTag: 'APP_RATE',
                uomCode: 'TON_PER_AC',
                text: 'Seed Density per Area A',
                isPlaceholder: true,
              },
            ],
            objectType: 'Cluster',
            _refId: 40,
            id: 2494448,
          },
          {
            factorId: 5668,
            isValidLevelNumber: true,
            isActive: false,
            items: [
              {
                label: 'Seed Density per Area',
                objectType: 'QandAV3',
                valueType: 'placeholder',
                questionCode: 'APP_RATE_MA',
                multiQuestionTag: 'APP_RATE',
                uomCode: 'LB_PER_AC',
                text: 'Seed Density per Area 2',
                isPlaceholder: true,
              },
            ],
            objectType: 'Cluster',
            _refId: 42,
            id: 2494449,
          },
        ],
      ]

      const propsForFactorLevels = [
        {
          label: 'Seed Density per Area',
          objectType: 'QandAV3',
          valueType: 'placeholder',
          questionCode: null,
          multiQuestionTag: 'APP_RATE',
          uomCode: 'TON_PER_AC',
          text: 'Seed Density per Area A',
          isPlaceholder: true,
          factorId: 5668,
          order: 0,
        },
      ]

      const propertyIds = [
        {
          id: 305,
        },
      ]

      const factorLevelDetailsExpected = [
        {
          label: 'Seed Density per Area',
          objectType: 'QandAV3',
          valueType: 'placeholder',
          questionCode: 'APP_RATE_MA',
          multiQuestionTag: 'APP_RATE',
          uomCode: 'TON_PER_AC',
          text: 'Seed Density per Area A',
          isPlaceholder: true,
          factorLevelId: 2494448,
          factorPropertiesForLevelId: 305,
          order: 0,
        },
        {
          label: 'Seed Density per Area',
          objectType: 'QandAV3',
          valueType: 'placeholder',
          questionCode: 'APP_RATE_MA',
          multiQuestionTag: 'APP_RATE',
          uomCode: 'LB_PER_AC',
          text: 'Seed Density per Area 2',
          isPlaceholder: true,
          factorLevelId: 2494449,
          factorPropertiesForLevelId: 305,
          order: 0,
        },
      ]

      const factorLevelDetails = target.buildFactorLevelDetails(fLGMatrix, propsForFactorLevels, propertyIds)
      expect(factorLevelDetails).toEqual(factorLevelDetailsExpected)
    })
  })
})
