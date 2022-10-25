import { mock, mockReject, mockResolve } from '../jestUtil'
import FactorService from '../../src/services/FactorService'
import { dbRead, dbWrite } from '../../src/db/DbManager'
import AppError from '../../src/services/utility/AppError'

describe('FactorService', () => {
  let target
  const testContext = {}
  const testTx = { tx: {} }

  beforeEach(() => {
    target = new FactorService()
  })

  describe('getAllFactors', () => {
    test('returns factors', () => {
      dbRead.factor.all = mockResolve([{}])

      return target.getAllFactors().then((data) => {
        expect(dbRead.factor.all).toHaveBeenCalledWith()
        expect(data).toEqual([{}])
      })
    })

    test('rejects when get all call fails', () => {
      const error = { message: 'error' }
      dbRead.factor.all = mockReject(error)

      return target.getAllFactors().then(() => {}, (err) => {
        expect(dbRead.factor.all).toHaveBeenCalledWith()
        expect(err).toEqual(error)
      })
    })
  })

  describe('getFactorsByExperimentId', () => {
    test('gets an experiment, and finds factors by that id', () => {
      dbRead.experiments.find = mockResolve({})
      dbRead.factor.findByExperimentId = mockResolve([])

      return target.getFactorsByExperimentId(1, false, testContext).then((data) => {
        expect(dbRead.experiments.find).toHaveBeenCalledWith(1, false)
        expect(dbRead.factor.findByExperimentId).toHaveBeenCalledWith(1)
        expect(data).toEqual([])
      })
    })

    test('rejects when findByExperimentId fails', () => {
      const error = { message: 'error' }
      dbRead.experiments.find = mockResolve({})
      dbRead.factor.findByExperimentId = mockReject(error)

      return target.getFactorsByExperimentId(1, false, testContext).then(() => {}, (err) => {
        expect(dbRead.experiments.find).toHaveBeenCalledWith(1, false)
        expect(dbRead.factor.findByExperimentId).toHaveBeenCalledWith(1)
        expect(err).toEqual(error)
      })
    })

    test('rejects when getExperimentById fails', () => {
      const error = { message: 'error' }
      dbRead.experiments.find = mockResolve()
      dbRead.factor.findByExperimentId = mockReject(error)

      return target.getFactorsByExperimentId(1, false, testContext).then(() => {}, () => {
        expect(dbRead.experiments.find).toHaveBeenCalledWith(1, false)
        expect(dbRead.factor.findByExperimentId).not.toHaveBeenCalled()
      })
    })
  })

  describe('getFactorsByExperimentIdNoExistenceCheck', () => {
    test('finds factors by that id', () => {
      dbRead.factor.findByExperimentId = mockResolve([])

      return FactorService.getFactorsByExperimentIdNoExistenceCheck(1).then((data) => {
        expect(dbRead.factor.findByExperimentId).toHaveBeenCalledWith(1)
        expect(data).toEqual([])
      })
    })

    test('rejects when findByExperimentId fails', () => {
      const error = { message: 'error' }
      dbRead.factor.findByExperimentId = mockReject(error)

      return FactorService.getFactorsByExperimentIdNoExistenceCheck(1).then(() => {}, (err) => {
        expect(dbRead.factor.findByExperimentId).toHaveBeenCalledWith(1)
        expect(err).toEqual(error)
      })
    })
  })

  describe('updateFactorsForDesign', () => {
    test('calls removeTiersForExperiment when there is no split', () => {
      dbWrite.factor.removeTiersForExperiment = mockResolve()

      return target.updateFactorsForDesign(1, { rules: {} }, testTx).then(() => {
        expect(dbWrite.factor.removeTiersForExperiment).toHaveBeenCalledWith(1, testTx)
      })
    })

    test('does not call removeTiersForExperiment when there is splits', () => {
      dbWrite.factor.removeTiersForExperiment = mockResolve()

      return target.updateFactorsForDesign(1, { rules: { grouping: { min: 1, max: 10 } } }, testTx).then(() => {
        expect(dbWrite.factor.removeTiersForExperiment).not.toHaveBeenCalled()
      })
    })
  })

  describe('saveTreatmentVariables', () => {
    test('separates treatmentVariables into adds, updates, and deletes', async () => {
      const databaseTreatmentVariables = [
        { id: 1, name: 'firstDatabase' },
        { id: 2, name: 'secondDatabase' },
        { id: 3, name: 'thirdDatabase' },
      ]
      const requestTreatmentVariables = [
        { id: 1, name: 'firstRequest' },
        { id: 2, name: 'secondRequest' },
        { name: 'thirdRequest' },
      ]
      dbRead.factor.findByExperimentId = mockResolve(databaseTreatmentVariables)
      dbWrite.factor.batchRemove = mockResolve()
      dbWrite.factor.batchUpdate = mockResolve()
      dbWrite.factor.batchCreate = mockResolve([])

      await target.saveTreatmentVariables(5, requestTreatmentVariables, testContext, testTx)

      expect(dbWrite.factor.batchRemove).toHaveBeenCalledWith([3], testTx)
      expect(dbWrite.factor.batchUpdate).toHaveBeenCalledWith([
        requestTreatmentVariables[0],
        requestTreatmentVariables[1],
      ], testContext, testTx)
      expect(dbWrite.factor.batchCreate).toHaveBeenCalledWith(5, [
        requestTreatmentVariables[2],
      ], testContext, testTx)
    })

    test('puts the new id on created treatmentVariables', async () => {
      const databaseTreatmentVariables = [
        { id: 1, name: 'firstDatabase' },
        { id: 2, name: 'secondDatabase' },
        { id: 3, name: 'thirdDatabase' },
      ]
      const requestTreatmentVariables = [
        { id: 1, name: 'firstRequest' },
        { id: 2, name: 'secondRequest' },
        { name: 'thirdRequest' },
        { name: 'fourthRequest' },
      ]
      dbRead.factor.findByExperimentId = mockResolve(databaseTreatmentVariables)
      dbWrite.factor.batchRemove = mockResolve()
      dbWrite.factor.batchUpdate = mockResolve()
      dbWrite.factor.batchCreate = mockResolve([
        { id: 4, name: 'fourthRequest' },
        { id: 5, name: 'thirdRequest' },
      ])

      await target.saveTreatmentVariables(5, requestTreatmentVariables, testContext, testTx)

      expect(requestTreatmentVariables[2].id).toBe(5)
      expect(requestTreatmentVariables[3].id).toBe(4)
    })

    test('matches updates by id and by name', async () => {
      const databaseTreatmentVariables = [
        { id: 1, name: 'firstDatabase' },
        { id: 2, name: 'secondVariable' },
        { id: 3, name: 'thirdDatabase' },
      ]
      const requestTreatmentVariables = [
        { id: 1, name: 'firstRequest' },
        { name: 'secondVariable' },
        { name: 'thirdRequest' },
      ]
      dbRead.factor.findByExperimentId = mockResolve(databaseTreatmentVariables)
      dbWrite.factor.batchRemove = mockResolve()
      dbWrite.factor.batchUpdate = mockResolve()
      dbWrite.factor.batchCreate = mockResolve([])

      await target.saveTreatmentVariables(5, requestTreatmentVariables, testContext, testTx)

      expect(dbWrite.factor.batchUpdate).toHaveBeenCalledWith([
        requestTreatmentVariables[0],
        requestTreatmentVariables[1],
      ], testContext, testTx)
    })

    test('prefers id match over name match', async () => {
      const databaseTreatmentVariables = [
        { id: 1, name: 'firstDatabase' },
        { id: 2, name: 'secondVariable' },
        { id: 3, name: 'thirdDatabase' },
      ]
      const requestTreatmentVariables = [
        { id: 1, name: 'firstRequest' },
        { name: 'secondVariable' },
        { id: 2, name: 'thirdRequest' },
      ]
      dbRead.factor.findByExperimentId = mockResolve(databaseTreatmentVariables)
      dbWrite.factor.batchRemove = mockResolve()
      dbWrite.factor.batchUpdate = mockResolve()
      dbWrite.factor.batchCreate = mockResolve([])

      await target.saveTreatmentVariables(5, requestTreatmentVariables, testContext, testTx)

      expect(dbWrite.factor.batchUpdate).toHaveBeenCalledWith([
        requestTreatmentVariables[0],
        requestTreatmentVariables[2],
      ], testContext, testTx)
    })
  })

  describe('saveTreatmentVariableLevels', () => {
    test('separates levels into adds, updates, and deletes', async () => {
      const requestTreatmentVariables = [{
        id: 3,
        treatmentVariableLevels: [
          {
            id: 11,
            levelNumber: 1,
            treatmentVariableLevelDetails: [],
          },
          {
            id: 12,
            levelNumber: 2,
            treatmentVariableLevelDetails: [],
          },
          {
            levelNumber: 3,
            treatmentVariableLevelDetails: [],
          },
        ],
      }]
      const dbLevels = [
        { id: 11, factor_id: 3 },
        { id: 12, factor_id: 3 },
        { id: 13, factor_id: 3 },
      ]
      dbRead.factorLevel.findByExperimentId = mockResolve(dbLevels)
      dbWrite.factorLevel.batchRemove = mockResolve()
      dbWrite.factorLevel.batchUpdate = mockResolve()
      dbWrite.factorLevel.batchCreate = mockResolve([])

      await target.saveTreatmentVariableLevels(5, requestTreatmentVariables, testContext, testTx)

      expect(dbWrite.factorLevel.batchRemove).toHaveBeenCalledWith([13], testTx)
      expect(dbWrite.factorLevel.batchUpdate).toHaveBeenCalledWith([
        requestTreatmentVariables[0].treatmentVariableLevels[0],
        requestTreatmentVariables[0].treatmentVariableLevels[1],
      ], testContext, testTx)
      expect(dbWrite.factorLevel.batchCreate).toHaveBeenCalledWith([
        requestTreatmentVariables[0].treatmentVariableLevels[2],
      ], testContext, testTx)
    })

    test('puts the treatmentVariable id on the levels', async () => {
      const requestTreatmentVariables = [{
        id: 3,
        treatmentVariableLevels: [
          {
            id: 11,
            levelNumber: 1,
            treatmentVariableLevelDetails: [],
          },
          {
            id: 12,
            levelNumber: 2,
            treatmentVariableLevelDetails: [],
          },
          {
            levelNumber: 3,
            treatmentVariableLevelDetails: [],
          },
        ],
      }]
      const dbLevels = [
        { id: 11, factor_id: 3 },
        { id: 12, factor_id: 3 },
        { id: 13, factor_id: 3 },
      ]
      dbRead.factorLevel.findByExperimentId = mockResolve(dbLevels)
      dbWrite.factorLevel.batchRemove = mockResolve()
      dbWrite.factorLevel.batchUpdate = mockResolve()
      dbWrite.factorLevel.batchCreate = mockResolve([])

      await target.saveTreatmentVariableLevels(5, requestTreatmentVariables, testContext, testTx)

      expect(requestTreatmentVariables[0].treatmentVariableLevels[0].treatmentVariableId).toBe(3)
      expect(requestTreatmentVariables[0].treatmentVariableLevels[1].treatmentVariableId).toBe(3)
      expect(requestTreatmentVariables[0].treatmentVariableLevels[2].treatmentVariableId).toBe(3)
    })

    test('sorts the treatment variables by level number before creating them', async () => {
      const treatmentVariableLevels = [
        {
          id: 11,
          levelNumber: 1,
          treatmentVariableLevelDetails: [],
        },
        {
          id: 12,
          levelNumber: 2,
          treatmentVariableLevelDetails: [],
        },
        {
          levelNumber: 4,
          treatmentVariableLevelDetails: [],
        },
        {
          levelNumber: 3,
          treatmentVariableLevelDetails: [],
        },
      ]
      const requestTreatmentVariables = [{
        id: 3,
        treatmentVariableLevels: treatmentVariableLevels.slice(),
      }]
      const dbLevels = [
        { id: 11, factor_id: 3 },
        { id: 12, factor_id: 3 },
        { id: 13, factor_id: 3 },
      ]
      dbRead.factorLevel.findByExperimentId = mockResolve(dbLevels)
      dbWrite.factorLevel.batchRemove = mockResolve()
      dbWrite.factorLevel.batchUpdate = mockResolve()
      dbWrite.factorLevel.batchCreate = mockResolve([])

      await target.saveTreatmentVariableLevels(5, requestTreatmentVariables, testContext, testTx)

      expect(dbWrite.factorLevel.batchCreate).toHaveBeenCalledWith([
        treatmentVariableLevels[3],
        treatmentVariableLevels[2],
      ], testContext, testTx)
    })

    test('puts the new id on created levels', async () => {
      const treatmentVariableLevels = [
        {
          id: 11,
          levelNumber: 1,
          treatmentVariableLevelDetails: [],
        },
        {
          id: 12,
          levelNumber: 2,
          treatmentVariableLevelDetails: [],
        },
        {
          levelNumber: 4,
          treatmentVariableLevelDetails: [],
        },
        {
          levelNumber: 3,
          treatmentVariableLevelDetails: [],
        },
      ]
      const requestTreatmentVariables = [{
        id: 3,
        treatmentVariableLevels: treatmentVariableLevels.slice(),
      }]
      const dbLevels = [
        { id: 11, factor_id: 3 },
        { id: 12, factor_id: 3 },
        { id: 13, factor_id: 3 },
      ]
      dbRead.factorLevel.findByExperimentId = mockResolve(dbLevels)
      dbWrite.factorLevel.batchRemove = mockResolve()
      dbWrite.factorLevel.batchUpdate = mockResolve()
      dbWrite.factorLevel.batchCreate = mockResolve([{ id: 14 }, { id: 15 }])

      await target.saveTreatmentVariableLevels(5, requestTreatmentVariables, testContext, testTx)

      expect(treatmentVariableLevels[2].id).toBe(15)
      expect(treatmentVariableLevels[3].id).toBe(14)
    })

    test('adds the old details object onto the levels', async () => {
      const requestTreatmentVariables = [
        {
          id: 1,
          name: 'variableOne',
          treatmentVariableLevels: [
            {
              id: 101,
              levelNumber: 1,
              treatmentVariableLevelDetails: [
                {
                  label: 'propOne',
                  rowNumber: 1,
                  objectType: 'Catalog',
                  catalogType: 'Chemical',
                  valueType: 'placeholder',
                  text: 'propOne 1',
                },
                {
                  label: 'propTwo',
                  rowNumber: 1,
                  objectType: 'QandAV3',
                  valueType: 'placeholder',
                  questionCode: 'APP_RATE_VOL',
                  multiQuestionTag: 'APP_RATE',
                  uomCode: 'GAL',
                },
              ],
            },
            {
              id: 102,
              levelNumber: 2,
              treatmentVariableLevelDetails: [
                {
                  label: 'propOne',
                  rowNumber: 1,
                  objectType: 'Catalog',
                  catalogType: 'Chemical',
                  valueType: 'exact',
                  value: '12345',
                },
                {
                  label: 'propTwo',
                  rowNumber: 1,
                  objectType: 'QandAV3',
                  valueType: 'exact',
                  questionCode: 'APP_RATE_VOL',
                  multiQuestionTag: 'APP_RATE',
                  uomCode: 'GAL',
                  value: '12345',
                },
                {
                  label: 'propOne',
                  rowNumber: 2,
                  objectType: 'Catalog',
                  catalogType: 'Chemical',
                  valueType: 'exact',
                  value: '12345',
                },
                {
                  label: 'propTwo',
                  rowNumber: 2,
                  objectType: 'QandAV3',
                  valueType: 'exact',
                  questionCode: 'APP_RATE_VOL',
                  multiQuestionTag: 'APP_RATE',
                  uomCode: 'GAL',
                  value: '12345',
                },
              ],
            },
          ],
        },
        {
          id: 2,
          name: 'variableTwo',
          treatmentVariableLevels: [
            {
              id: 201,
              levelNumber: 1,
              treatmentVariableLevelDetails: [
                {
                  label: 'propOne',
                  rowNumber: 1,
                  objectType: 'QandAV3',
                  valueType: 'exact',
                  questionCode: 'APP_TIM',
                  uomCode: 'STRING',
                },
              ],
            },
            {
              id: 202,
              levelNumber: 2,
              treatmentVariableLevelDetails: [
                {
                  label: 'propOne',
                  rowNumber: 1,
                  objectType: 'QandAV3',
                  valueType: 'exact',
                  questionCode: 'APP_TIM',
                  uomCode: 'STRING',
                },
                {
                  label: 'propOne',
                  rowNumber: 2,
                  objectType: 'QandAV3',
                  valueType: 'exact',
                  questionCode: 'APP_TIM',
                  uomCode: 'STRING',
                },
              ],
            },
          ],
        },
      ]
      dbRead.factorLevel.findByExperimentId = mockResolve([])
      dbWrite.factorLevel.batchRemove = mockResolve()
      dbWrite.factorLevel.batchUpdate = mockResolve()
      dbWrite.factorLevel.batchCreate = mockResolve([])

      await target.saveTreatmentVariableLevels(5, requestTreatmentVariables, testContext, testTx)

      expect(requestTreatmentVariables[0].treatmentVariableLevels[0].value).toEqual({
        items: [
          {
            label: 'propOne',
            objectType: 'Catalog',
            catalogType: 'Chemical',
            valueType: 'placeholder',
            text: 'propOne 1',
            isPlaceholder: true,
          },
          {
            label: 'propTwo',
            objectType: 'QandAV3',
            valueType: 'placeholder',
            questionCode: 'APP_RATE_VOL',
            multiQuestionTag: 'APP_RATE',
            uomCode: 'GAL',
            isPlaceholder: true,
          },
        ],
        objectType: 'Cluster',
      })
      expect(requestTreatmentVariables[0].treatmentVariableLevels[1].value).toEqual({
        items: [
          {
            items: [
              {
                label: 'propOne',
                objectType: 'Catalog',
                catalogType: 'Chemical',
                valueType: 'exact',
                value: 12345,
                isPlaceholder: false,
              },
              {
                label: 'propTwo',
                objectType: 'QandAV3',
                valueType: 'exact',
                questionCode: 'APP_RATE_VOL',
                multiQuestionTag: 'APP_RATE',
                uomCode: 'GAL',
                value: '12345',
                isPlaceholder: false,
              },
            ],
            objectType: 'Composite',
          },
          {
            items: [
              {
                label: 'propOne',
                objectType: 'Catalog',
                catalogType: 'Chemical',
                valueType: 'exact',
                value: 12345,
                isPlaceholder: false,
              },
              {
                label: 'propTwo',
                objectType: 'QandAV3',
                valueType: 'exact',
                questionCode: 'APP_RATE_VOL',
                multiQuestionTag: 'APP_RATE',
                uomCode: 'GAL',
                value: '12345',
                isPlaceholder: false,
              },
            ],
            objectType: 'Composite',
          },
        ],
        objectType: 'Cluster',
      })
      expect(requestTreatmentVariables[1].treatmentVariableLevels[0].value).toEqual({
        items: [
          {
            label: 'propOne',
            objectType: 'QandAV3',
            valueType: 'exact',
            questionCode: 'APP_TIM',
            uomCode: 'STRING',
            isPlaceholder: false,
          },
        ],
        objectType: 'Cluster',
      })
      expect(requestTreatmentVariables[1].treatmentVariableLevels[1].value).toEqual({
        items: [
          {
            items: [
              {
                label: 'propOne',
                objectType: 'QandAV3',
                valueType: 'exact',
                questionCode: 'APP_TIM',
                uomCode: 'STRING',
                isPlaceholder: false,
              },
            ],
            objectType: 'Composite',
          },
          {
            items: [
              {
                label: 'propOne',
                objectType: 'QandAV3',
                valueType: 'exact',
                questionCode: 'APP_TIM',
                uomCode: 'STRING',
                isPlaceholder: false,
              },
            ],
            objectType: 'Composite',
          },
        ],
        objectType: 'Cluster',
      })
    })
  })

  describe('savePropertiesForTreatmentVariables', () => {
    test('deletes all the old properties', async () => {
      dbWrite.factorPropertiesForLevel.batchRemoveByExperimentId = mockResolve()
      dbWrite.factorPropertiesForLevel.batchCreate = mockResolve()
      const requestTreatmentVariables = []

      await target.savePropertiesForTreatmentVariables(5, requestTreatmentVariables, testContext, testTx)

      expect(dbWrite.factorPropertiesForLevel.batchRemoveByExperimentId).toHaveBeenCalledWith([5], testTx)
    })

    test('parses the first levels of each treatmentVariable to find the new properties to save', async () => {
      dbWrite.factorPropertiesForLevel.batchRemoveByExperimentId = mockResolve()
      dbWrite.factorPropertiesForLevel.batchCreate = mockResolve()
      const requestTreatmentVariables = [
        {
          id: 2,
          treatmentVariableLevels: [
            {
              levelNumber: 1,
              treatmentVariableLevelDetails: [
                {
                  rowNumber: 1,
                  multiQuestionTag: 'APP_RATE',
                  questionCode: 'APP_RATE_VOL',
                  objectType: 'QandAV3',
                },
                {
                  rowNumber: 1,
                  questionCode: 'APP_TIM',
                  objectType: 'QandAV3',
                },
                {
                  rowNumber: 2,
                  multiQuestionTag: 'APP_RATE',
                  questionCode: 'APP_RATE_VOL',
                  objectType: 'QandAV3',
                },
                {
                  rowNumber: 2,
                  objectType: 'Catalog',
                },
              ],
            },
            {
              levelNumber: 2,
              treatmentVariableLevelDetails: [
                {
                  rowNumber: 1,
                  objectType: 'Catalog',
                },
              ],
            },
          ],
        },
        {
          id: 3,
          treatmentVariableLevels: [
            {
              levelNumber: 1,
              treatmentVariableLevelDetails: [
                {
                  rowNumber: 1,
                  objectType: 'Catalog',
                  materialType: 'Chemical',
                },
              ],
            },
            {
              levelNumber: 2,
              treatmentVariableLevelDetails: [
                {
                  rowNumber: 1,
                  multiQuestionTag: 'APP_RATE',
                  questionCode: 'APP_RATE_VOL',
                  objectType: 'QandAV3',
                },
                {
                  rowNumber: 1,
                  questionCode: 'APP_TIM',
                  objectType: 'QandAV3',
                },
                {
                  rowNumber: 2,
                  multiQuestionTag: 'APP_RATE',
                  questionCode: 'APP_RATE_VOL',
                  objectType: 'QandAV3',
                },
                {
                  rowNumber: 2,
                  objectType: 'Catalog',
                },
              ],
            },
          ],
        },
      ]

      await target.savePropertiesForTreatmentVariables(5, requestTreatmentVariables, testContext, testTx)

      expect(dbWrite.factorPropertiesForLevel.batchCreate).toHaveBeenCalledWith([
        {
          rowNumber: 1,
          multiQuestionTag: 'APP_RATE',
          questionCode: null,
          objectType: 'QandAV3',
          columnNumber: 1,
          treatmentVariableId: 2,
        },
        {
          rowNumber: 1,
          questionCode: 'APP_TIM',
          objectType: 'QandAV3',
          columnNumber: 2,
          treatmentVariableId: 2,
        },
        {
          rowNumber: 1,
          objectType: 'Catalog',
          materialType: 'Chemical',
          columnNumber: 1,
          treatmentVariableId: 3,
        },
      ], testContext, testTx)
    })

    test('returns the created properties', async () => {
      const newProperties = [
        { id: 345, label: 'property one' },
        { id: 678, label: 'property two' },
      ]
      dbWrite.factorPropertiesForLevel.batchRemoveByExperimentId = mockResolve()
      dbWrite.factorPropertiesForLevel.batchCreate = mockResolve(newProperties)
      const requestTreatmentVariables = []

      const result = await target.savePropertiesForTreatmentVariables(5, requestTreatmentVariables, testContext, testTx)

      expect(result).toBe(newProperties)
    })
  })

  describe('createDetailsForTreatmentVariableLevels', () => {
    test('maps all the level details into a single array and saves them in one go', async () => {
      const requestTreatmentVariables = [
        {
          id: 1,
          name: 'variableOne',
          treatmentVariableLevels: [
            {
              id: 101,
              levelNumber: 1,
              treatmentVariableLevelDetails: [
                {
                  label: 'propOne',
                  rowNumber: 1,
                  objectType: 'Catalog',
                  valueType: 'placeholder',
                },
                {
                  label: 'propTwo',
                  rowNumber: 1,
                  objectType: 'QandAV3',
                  valueType: 'placeholder',
                  questionCode: 'APP_RATE_VOL',
                  uomCode: 'GAL',
                },
              ],
            },
            {
              id: 102,
              levelNumber: 2,
              treatmentVariableLevelDetails: [
                {
                  label: 'propOne',
                  rowNumber: 1,
                  objectType: 'Catalog',
                  valueType: 'noTreatment',
                },
                {
                  label: 'propTwo',
                  rowNumber: 1,
                  objectType: 'QandAV3',
                  valueType: 'noTreatment',
                  questionCode: 'APP_RATE_VOL',
                  uomCode: 'GAL',
                },
              ],
            },
          ],
        },
        {
          id: 2,
          name: 'variableTwo',
          treatmentVariableLevels: [
            {
              id: 201,
              levelNumber: 1,
              treatmentVariableLevelDetails: [
                {
                  label: 'propOne',
                  rowNumber: 1,
                  objectType: 'QandAV3',
                  valueType: 'exact',
                  questionCode: 'APP_TIM',
                  uomCode: 'STRING',
                },
              ],
            },
            {
              id: 202,
              levelNumber: 2,
              treatmentVariableLevelDetails: [
                {
                  label: 'propOne',
                  rowNumber: 1,
                  objectType: 'QandAV3',
                  valueType: 'exact',
                  questionCode: 'APP_TIM',
                  uomCode: 'STRING',
                },
                {
                  label: 'propOne',
                  rowNumber: 2,
                  objectType: 'QandAV3',
                  valueType: 'exact',
                  questionCode: 'APP_TIM',
                  uomCode: 'STRING',
                },
              ],
            },
          ],
        },
      ]
      const properties = [
        {
          id: 1000,
          factor_id: 1,
          label: 'propOne',
        },
        {
          id: 1001,
          factor_id: 1,
          label: 'propTwo',
          multi_question_tag: 'APP_RATE',
        },
        {
          id: 1002,
          factor_id: 2,
          label: 'propOne',
        },
      ]
      dbWrite.factorLevelDetails.batchCreate = mockResolve()

      await target.createDetailsForTreatmentVariableLevels(requestTreatmentVariables, properties, testContext, testTx)

      expect(dbWrite.factorLevelDetails.batchCreate).toHaveBeenCalledWith([
        {
          label: 'propOne',
          rowNumber: 1,
          objectType: 'Catalog',
          valueType: 'placeholder',
          treatmentVariableLevelId: 101,
          isPlaceholder: true,
          propertyId: 1000,
          questionCode: null,
        },
        {
          label: 'propTwo',
          rowNumber: 1,
          objectType: 'QandAV3',
          valueType: 'placeholder',
          questionCode: 'APP_RATE_VOL',
          uomCode: 'GAL',
          treatmentVariableLevelId: 101,
          isPlaceholder: true,
          propertyId: 1001,
        },
        {
          label: 'propOne',
          rowNumber: 1,
          objectType: 'Catalog',
          valueType: 'noTreatment',
          treatmentVariableLevelId: 102,
          isPlaceholder: false,
          propertyId: 1000,
          questionCode: null,
        },
        {
          label: 'propTwo',
          rowNumber: 1,
          objectType: 'QandAV3',
          valueType: 'noTreatment',
          questionCode: 'APP_RATE_VOL',
          uomCode: 'GAL',
          treatmentVariableLevelId: 102,
          isPlaceholder: false,
          propertyId: 1001,
        },
        {
          label: 'propOne',
          rowNumber: 1,
          objectType: 'QandAV3',
          valueType: 'exact',
          questionCode: null,
          uomCode: 'STRING',
          treatmentVariableLevelId: 201,
          isPlaceholder: false,
          propertyId: 1002,
        },
        {
          label: 'propOne',
          rowNumber: 1,
          objectType: 'QandAV3',
          valueType: 'exact',
          questionCode: null,
          uomCode: 'STRING',
          treatmentVariableLevelId: 202,
          isPlaceholder: false,
          propertyId: 1002,
        },
        {
          label: 'propOne',
          rowNumber: 2,
          objectType: 'QandAV3',
          valueType: 'exact',
          questionCode: null,
          uomCode: 'STRING',
          treatmentVariableLevelId: 202,
          isPlaceholder: false,
          propertyId: 1002,
        },
      ], testContext, testTx)
    })
  })

  describe('saveTreatmntVariableLevelAssociations', () => {
    test('separates levels associations into adds and deletes', async () => {
      const requestTreatmentVariables = [
        {
          id: 1,
          name: 'variableOne',
          treatmentVariableLevels: [
            { id: 101, levelNumber: 1 },
            { id: 102, levelNumber: 2 },
            { id: 103, levelNumber: 3 },
            { id: 104, levelNumber: 4 },
          ],
        },
        {
          id: 2,
          name: 'variableTwo',
          associatedTreatmentVariableName: 'variableOne',
          treatmentVariableLevels: [
            { id: 201, levelNumber: 1, associatedTreatmentVariableLevelNumber: 1 },
            { id: 202, levelNumber: 2, associatedTreatmentVariableLevelNumber: 2 },
            { id: 203, levelNumber: 3, associatedTreatmentVariableLevelNumber: 3 },
            { id: 204, levelNumber: 4, associatedTreatmentVariableLevelNumber: 4 },
            { id: 205, levelNumber: 5, associatedTreatmentVariableLevelNumber: 1 },
            { id: 206, levelNumber: 6, associatedTreatmentVariableLevelNumber: 2 },
            { id: 207, levelNumber: 7, associatedTreatmentVariableLevelNumber: 3 },
            { id: 208, levelNumber: 8, associatedTreatmentVariableLevelNumber: 4 },
          ],
        },
      ]
      const dbAssociations = [
        { id: 11, associated_level_id: 101, nested_level_id: 201 },
        { id: 12, associated_level_id: 102, nested_level_id: 202 },
        { id: 13, associated_level_id: 103, nested_level_id: 203 },
        { id: 14, associated_level_id: 104, nested_level_id: 204 },
        { id: 15, associated_level_id: 105, nested_level_id: 205 },
      ]
      dbRead.factorLevelAssociation.findByExperimentId = mockResolve(dbAssociations)
      dbWrite.factorLevelAssociation.batchRemove = mockResolve()
      dbWrite.factorLevelAssociation.batchCreate = mockResolve()

      await target.saveTreatmentVariableLevelAssociations(5, requestTreatmentVariables, testContext, testTx)

      expect(dbWrite.factorLevelAssociation.batchRemove).toHaveBeenCalledWith([15], testTx)
      expect(dbWrite.factorLevelAssociation.batchCreate).toHaveBeenCalledWith([
        { associatedLevelId: 101, nestedLevelId: 205 },
        { associatedLevelId: 102, nestedLevelId: 206 },
        { associatedLevelId: 103, nestedLevelId: 207 },
        { associatedLevelId: 104, nestedLevelId: 208 },
      ], testContext, testTx)
    })

    test('throws an exception if a level cannot find its associated level', async () => {
      const requestTreatmentVariables = [
        {
          id: 1,
          name: 'variableOne',
          treatmentVariableLevels: [
            { id: 101, levelNumber: 1 },
            { id: 102, levelNumber: 2 },
            { id: 103, levelNumber: 3 },
            { id: 104, levelNumber: 4 },
          ],
        },
        {
          id: 2,
          name: 'variableTwo',
          associatedTreatmentVariableName: 'variableOne',
          treatmentVariableLevels: [
            { id: 201, levelNumber: 1, associatedTreatmentVariableLevelNumber: 1 },
            { id: 202, levelNumber: 2, associatedTreatmentVariableLevelNumber: 2 },
            { id: 203, levelNumber: 3, associatedTreatmentVariableLevelNumber: 3 },
            { id: 204, levelNumber: 4, associatedTreatmentVariableLevelNumber: 4 },
            { id: 205, levelNumber: 5, associatedTreatmentVariableLevelNumber: 1 },
            { id: 206, levelNumber: 6, associatedTreatmentVariableLevelNumber: 2 },
            { id: 207, levelNumber: 7, associatedTreatmentVariableLevelNumber: 3 },
            { id: 208, levelNumber: 8, associatedTreatmentVariableLevelNumber: 5 },
          ],
        },
      ]
      const dbAssociations = [
        { id: 11, associated_level_id: 101, nested_level_id: 201 },
        { id: 12, associated_level_id: 102, nested_level_id: 202 },
        { id: 13, associated_level_id: 103, nested_level_id: 203 },
        { id: 14, associated_level_id: 104, nested_level_id: 204 },
        { id: 15, associated_level_id: 105, nested_level_id: 205 },
      ]
      dbRead.factorLevelAssociation.findByExperimentId = mockResolve(dbAssociations)
      dbWrite.factorLevelAssociation.batchRemove = mockResolve()
      dbWrite.factorLevelAssociation.batchCreate = mockResolve()
      AppError.badRequest = mock(new Error())

      try {
        await target.saveTreatmentVariableLevelAssociations(5, requestTreatmentVariables, testContext, testTx)
      } catch {
        expect(AppError.badRequest).toHaveBeenCalledWith('Invalid associations. Cannot find the associated level for at least one treatment variable level.', undefined, '1DE001')
      }
    })
  })

  describe('validateTreatmentVariables', () => {
    test('throws an error if variables share a name', () => {
      AppError.badRequest = mock(new Error())
      const treatmentVariables = [
        { name: 'test' },
        { name: 'same' },
        { name: 'same' },
      ]

      try {
        target.validateTreatmentVariables(treatmentVariables)
      } catch {
        expect(AppError.badRequest).toHaveBeenCalledWith('All variables must have a name and they must be unique.', undefined, '1DF001')
      }
    })

    test('throws an error if variables does not have a name', () => {
      AppError.badRequest = mock(new Error())
      const treatmentVariables = [
        { name: 'test' },
        { name: 'test2' },
        { },
      ]

      try {
        target.validateTreatmentVariables(treatmentVariables)
      } catch {
        expect(AppError.badRequest).toHaveBeenCalledWith('All variables must have a name and they must be unique.', undefined, '1DF001')
      }
    })

    test('throws an error if a nested variable has unnested levels', () => {
      AppError.badRequest = mock(new Error())
      const treatmentVariables = [
        { name: 'parent' },
        {
          name: 'nested',
          associatedTreatmentVariableName: 'parent',
          treatmentVariableLevels: [
            { levelNumber: 1 },
            { levelNumber: 2 },
          ],
        },
      ]

      try {
        target.validateTreatmentVariables(treatmentVariables)
      } catch {
        expect(AppError.badRequest).toHaveBeenCalledWith('All levels for nested variables must have an associated level.', undefined, '1DF002')
      }
    })

    test('throws an error if all variables are blocking factors', () => {
      AppError.badRequest = mock(new Error())
      const treatmentVariables = [
        { name: 'test', isBlockingFactorOnly: true },
        { name: 'test2', isBlockingFactorOnly: true },
      ]

      try {
        target.validateTreatmentVariables(treatmentVariables)
      } catch {
        expect(AppError.badRequest).toHaveBeenCalledWith('At least one treatment variable must not be a blocking factor.', undefined, '1DF003')
      }
    })

    test('throws an error if a variable has less than two levels', () => {
      AppError.badRequest = mock(new Error())
      const treatmentVariables = [
        { name: 'test1', treatmentVariableLevels: [] },
        {
          name: 'test2',
          treatmentVariableLevels: [
            { levelNumber: 1 },
            { levelNumber: 2 },
          ],
        },
      ]

      try {
        target.validateTreatmentVariables(treatmentVariables)
      } catch {
        expect(AppError.badRequest).toHaveBeenCalledWith('Every treatment variable needs to have at least two levels.', undefined, '1DF004')
      }
    })
  })
})
