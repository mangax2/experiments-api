import createAndSyncChemApPlanFromExperiment, {
  getIntentsForTreatments,
  getTimingQuestionUoms,
  getUniqueIntentsWithTreatment,
  getUniqueTimings,
} from '../../src/services/chemApSyncService'
import AppError from '../../src/services/utility/AppError'
import apiUrls from '../configs/apiUrls'
import HttpUtil from '../../src/services/utility/HttpUtil'
import OAuthUtil from '../../src/services/utility/OAuthUtil'
import { dbRead } from '../../src/db/DbManager'
import { mock, mockResolve } from '../jestUtil'
import QuestionsUtil from '../../src/services/utility/QuestionsUtil'

jest.mock('../../src/services/SecurityService')
jest.mock('../../src/services/utility/OAuthUtil')
jest.mock('../../src/services/utility/HttpUtil')

const timingQuestionComplete = {
  uoms: [
    { code: 'TEXT' },
    {
      code: 'STRING',
      validation: {
        rule: {
          values: [
            { key: '589f4291-3a98-43da-831c-bea516750296', value: 'At Planting' },
            { key: 'c996909f-e8b3-4438-ac87-521cf5e406e9', value: 'Burndown' },
            { key: '49477d93-6be9-4843-bdc1-f22b68190675', value: 'Flowering' },
            { key: 'dc9dfbf6-eac7-4a0f-b819-1539d7ae7806', value: 'Post-emergence' },
            { key: '594bd43d-4509-444c-925d-368580973d97', value: 'Post-flowering' },
            { key: '590e9889-2172-43ed-aa02-1f669f5f1625', value: 'Pre-emergence' },
            { key: '236a8676-5d51-43e9-9364-8adb583c1c62', value: 'Pre-Plant' },
            { key: '4474793f-c106-4ffd-bf7d-fb8bbba8d4d3', value: 'Unknown' },
          ],
        },
      },
    },
  ],
}

const timingUomMap = {
  STRING: {
    '589f4291-3a98-43da-831c-bea516750296': 'At Planting',
    'c996909f-e8b3-4438-ac87-521cf5e406e9': 'Burndown',
    '49477d93-6be9-4843-bdc1-f22b68190675': 'Flowering',
    'dc9dfbf6-eac7-4a0f-b819-1539d7ae7806': 'Post-emergence',
    '594bd43d-4509-444c-925d-368580973d97': 'Post-flowering',
    '590e9889-2172-43ed-aa02-1f669f5f1625': 'Pre-emergence',
    '236a8676-5d51-43e9-9364-8adb583c1c62': 'Pre-Plant',
    '4474793f-c106-4ffd-bf7d-fb8bbba8d4d3': 'Unknown',
  },
  TEXT: {},
}

const timingProperty = { id: 6, question_code: 'APP_TIM' }

describe('ChemApSyncService', () => {
  beforeEach(() => {
    apiUrls.chemApAPIUrl = 'chemApAPIUrl'
    dbRead.experiments.find = mockResolve({ name: 'test' })
    dbRead.owner.findByExperimentId = mockResolve({ user_ids: ['tester'], group_ids: [] })
    dbRead.factorLevelDetails.findByExperimentId = mockResolve([
      { factor_properties_for_level_id: 6, text: '1' },
      { factor_properties_for_level_id: 6, text: '2' },
      { factor_properties_for_level_id: 6, text: '3' },
      { factor_properties_for_level_id: 6, text: '4' },
      { factor_properties_for_level_id: 6, text: '5' },
      { factor_properties_for_level_id: 6, text: '4' },
      { factor_properties_for_level_id: 6, text: '3' },
      { factor_properties_for_level_id: 6, text: '4' },
    ])
    dbRead.factorPropertiesForLevel.findByExperimentId = mockResolve([
      { object_type: 'Catalog', material_type: 'CHEMICAL' },
      { id: 6, question_code: 'APP_TIM' },
    ])
    dbRead.combinationElement.findByExperimentIdWithTreatmentNumber = mockResolve([])
    OAuthUtil.getAuthorizationHeaders = mockResolve([])
    AppError.internalServerError = mock()
    AppError.notFound = mock()
    AppError.badRequest = mock()
    QuestionsUtil.getCompleteQuestion = mockResolve(timingQuestionComplete)
  })

  test('should fail when experiment does not exist', async () => {
    dbRead.experiments.find = mockResolve(null)
    try {
      await createAndSyncChemApPlanFromExperiment({ experimentId: 1 }, { userId: 'tester1' })
      // eslint-disable-next-line no-empty
    } catch (e) {}
    expect(AppError.notFound).toHaveBeenCalledWith('Experiment Not Found for requested experiment Id: 1', undefined, '1G4001')
  })

  test('should fail when experiment does not have a chemical property', async () => {
    dbRead.factorPropertiesForLevel.findByExperimentId = mockResolve([{}])
    try {
      await createAndSyncChemApPlanFromExperiment({ experimentId: 1 }, { userId: 'tester1' })
      // eslint-disable-next-line no-empty
    } catch (e) {}
    expect(AppError.badRequest).toHaveBeenCalledWith('The experiment does not have any chemical data', undefined, '1G5001')
  })

  test('should fail when experiment has duplicate QandA properties', async () => {
    dbRead.factorPropertiesForLevel.findByExperimentId = mockResolve([
      { object_type: 'Catalog', material_type: 'CHEMICAL' },
      { object_type: 'QandAV3', question_code: 'APP_TIM' },
      { object_type: 'QandAV3', question_code: 'APP_TIM' },
    ])
    try {
      await createAndSyncChemApPlanFromExperiment({ experimentId: 1 }, { userId: 'tester1' })
      // eslint-disable-next-line no-empty
    } catch (e) {}
    expect(AppError.badRequest).toHaveBeenCalledWith('Unable to parse experiment data, the following QandA data is defined more than once: APP_TIM', undefined, '1G5002')
  })

  test('user header is added', async () => {
    HttpUtil.post.mockReturnValueOnce(Promise.resolve({ body: { id: 123 } }))
      .mockReturnValueOnce(Promise.resolve({}))
    await createAndSyncChemApPlanFromExperiment({ experimentId: 1 }, { userId: 'tester1' })
    expect(HttpUtil.post).toHaveBeenCalledWith('chemApAPIUrl/plans',
      [{ headerName: 'username', headerValue: 'tester1' }],
      {
        isTemplate: false, name: 'test', ownerGroups: [], owners: ['tester'],
      })
  })

  test('requests are sent to create chemAp plan and add association', async () => {
    HttpUtil.post.mockReturnValueOnce(Promise.resolve({ body: { id: 123 } }))
      .mockReturnValueOnce(Promise.resolve({}))
    await createAndSyncChemApPlanFromExperiment({ experimentId: 1 }, { userId: 'tester1' })
    expect(HttpUtil.post).toHaveBeenCalledWith('chemApAPIUrl/plans',
      [{ headerName: 'username', headerValue: 'tester1' }],
      {
        isTemplate: false, name: 'test', ownerGroups: [], owners: ['tester'],
      })
    expect(HttpUtil.post).toHaveBeenCalledWith('chemApAPIUrl/plan-associations',
      [{ headerName: 'username', headerValue: 'tester1' }],
      [{
        planId: 123, externalEntity: 'experiment', externalEntityId: 1, isSource: true,
      }])
  })

  test('when chemAp is successfully created, plan id is returned in the response', async () => {
    HttpUtil.post.mockReturnValueOnce(Promise.resolve({ body: { id: 123 } }))
      .mockReturnValueOnce(Promise.resolve({}))
    const result = await createAndSyncChemApPlanFromExperiment({ experimentId: 1 }, { userId: 'tester1' })
    expect(result).toEqual({ planId: 123 })
  })

  test('when chemAp fails to be created, an error is throw', async () => {
    HttpUtil.post.mockReturnValueOnce(Promise.reject(new Error()))
    try {
      await createAndSyncChemApPlanFromExperiment({ experimentId: 1 }, { userId: 'tester1' })
      // eslint-disable-next-line no-empty
    } catch (error) {}
    expect(AppError.internalServerError).toHaveBeenCalledWith('An error occurred to create a chemical application plan', undefined, '1G1001')
  })

  test('when chemAp plan fails to be associated with an experiment, plan is deleted', async () => {
    HttpUtil.post.mockReturnValueOnce(Promise.resolve({ body: { id: 123 } }))
      .mockReturnValueOnce(Promise.reject(new Error()))
    try {
      await createAndSyncChemApPlanFromExperiment({ experimentId: 1 }, { userId: 'tester1' })
      // eslint-disable-next-line no-empty
    } catch (error) {}
    expect(AppError.internalServerError).toHaveBeenCalledWith('An error occurred to create a plan association for plan 123 and experiment 1', undefined, '1G2001')
    expect(HttpUtil.delete).toHaveBeenCalledWith('chemApAPIUrl/plans/123', [{ headerName: 'username', headerValue: 'tester1' }])
  })

  test('when chemAp plan timings fails to be saved, plan is deleted', async () => {
    HttpUtil.post.mockReturnValueOnce(Promise.resolve({ body: { id: 123 } }))
      .mockReturnValueOnce(Promise.resolve({}))
    HttpUtil.put.mockReturnValueOnce(Promise.reject(new Error()))
    try {
      await createAndSyncChemApPlanFromExperiment({ experimentId: 1 }, { userId: 'tester1' })
      // eslint-disable-next-line no-empty
    } catch (error) {}
    expect(AppError.internalServerError).toHaveBeenCalledWith('An error occurred while creating target timings for planId 123', undefined, '1G7001')
    expect(HttpUtil.delete).toHaveBeenCalledWith('chemApAPIUrl/plans/123', [{ headerName: 'username', headerValue: 'tester1' }])
  })

  test('when chemAp plan fails to be associated with an experiment and failed to delete', async () => {
    HttpUtil.post.mockReturnValueOnce(Promise.resolve({ body: { id: 123 } }))
      .mockReturnValueOnce(Promise.reject(new Error()))
    HttpUtil.delete.mockReturnValueOnce(Promise.reject(new Error()))
    try {
      await createAndSyncChemApPlanFromExperiment({ experimentId: 1 }, { userId: 'tester1' })
      // eslint-disable-next-line no-empty
    } catch (error) {}
    expect(AppError.internalServerError).toHaveBeenCalledWith('An error occurred to delete a chemAp plan: 123', undefined, '1G3001')
    expect(HttpUtil.delete).toHaveBeenCalledWith('chemApAPIUrl/plans/123', [{ headerName: 'username', headerValue: 'tester1' }])
  })

  test('saves target timings when there are timings to save', async () => {
    HttpUtil.post.mockReturnValueOnce(Promise.resolve({ body: { id: 123 } }))
      .mockReturnValueOnce(Promise.resolve({}))
    HttpUtil.put = mockResolve()

    await createAndSyncChemApPlanFromExperiment({ experimentId: 1 }, { userId: 'tester1' })

    expect(HttpUtil.put).toHaveBeenCalledTimes(2)
  })

  test('does not save target timings when there are no timings to save', async () => {
    dbRead.factorLevelDetails.findByExperimentId = mockResolve([])
    HttpUtil.post.mockReturnValueOnce(Promise.resolve({ body: { id: 123 } }))
      .mockReturnValueOnce(Promise.resolve({}))
    HttpUtil.put = mockResolve()

    await createAndSyncChemApPlanFromExperiment({ experimentId: 1 }, { userId: 'tester1' })

    expect(HttpUtil.put).toHaveBeenCalledTimes(1)
  })

  describe('getTimingQuestionUoms', () => {
    test('converts the multiple choice answers from uoms of the question into a map', async () => {
      const map = await getTimingQuestionUoms()

      expect(map).toEqual(timingUomMap)
    })
  })

  describe('getUniqueTimings', () => {
    const requestId = '12345'

    test('returns an empty array if there is no timing property', () => {
      const levelDetails = []

      const result = getUniqueTimings(undefined, levelDetails, timingUomMap, requestId)

      expect(result).toEqual([])
    })

    test('throws an error if there are more than 26 unique timings', () => {
      const levelDetails = [
        { factor_properties_for_level_id: 6, text: '1' },
        { factor_properties_for_level_id: 6, text: '2' },
        { factor_properties_for_level_id: 6, text: '3' },
        { factor_properties_for_level_id: 6, text: '4' },
        { factor_properties_for_level_id: 6, text: '5' },
        { factor_properties_for_level_id: 6, text: '6' },
        { factor_properties_for_level_id: 6, text: '7' },
        { factor_properties_for_level_id: 6, text: '8' },
        { factor_properties_for_level_id: 6, text: '9' },
        { factor_properties_for_level_id: 6, text: '10' },
        { factor_properties_for_level_id: 6, text: '11' },
        { factor_properties_for_level_id: 6, text: '12' },
        { factor_properties_for_level_id: 6, text: '13' },
        { factor_properties_for_level_id: 6, text: '14' },
        { factor_properties_for_level_id: 6, text: '15' },
        { factor_properties_for_level_id: 6, text: '16' },
        { factor_properties_for_level_id: 6, text: '17' },
        { factor_properties_for_level_id: 6, text: '18' },
        { factor_properties_for_level_id: 6, text: '19' },
        { factor_properties_for_level_id: 6, text: '20' },
        { factor_properties_for_level_id: 6, text: '21' },
        { factor_properties_for_level_id: 6, text: '22' },
        { factor_properties_for_level_id: 6, text: '23' },
        { factor_properties_for_level_id: 6, text: '24' },
        { factor_properties_for_level_id: 6, text: '25' },
        { factor_properties_for_level_id: 6, text: '26' },
        { factor_properties_for_level_id: 6, text: '27' },
      ]

      try {
        getUniqueTimings(timingProperty, levelDetails, timingUomMap, requestId)
      } catch (error) {
        expect(AppError.badRequest).toHaveBeenCalledWith('The experiment has too many unique timings. The maximum unique timings allowed is 26.', undefined, '1G6001')
      }
    })

    test('filters out any duplicate timings', () => {
      const levelDetails = [
        { factor_properties_for_level_id: 6, text: '1' },
        { factor_properties_for_level_id: 6, text: '2' },
        { factor_properties_for_level_id: 6, text: '3' },
        { factor_properties_for_level_id: 6, text: '4' },
        { factor_properties_for_level_id: 6, text: '5' },
        { factor_properties_for_level_id: 6, text: '4' },
        { factor_properties_for_level_id: 6, text: '3' },
        { factor_properties_for_level_id: 6, text: '4' },
      ]

      const result = getUniqueTimings(timingProperty, levelDetails, timingUomMap, requestId)

      expect(result.length).toBe(5)
    })

    test('sorts the timings into the correct order', () => {
      const levelDetails = [
        {
          factor_properties_for_level_id: 6,
          text: '3.1',
          treatment_number: 3,
          row_number: 1,
        },
        {
          factor_properties_for_level_id: 6,
          text: '1.2',
          treatment_number: 1,
          row_number: 2,
        },
        {
          factor_properties_for_level_id: 6,
          text: '2.1',
          treatment_number: 2,
          row_number: 1,
        },
        {
          factor_properties_for_level_id: 6,
          text: '2.3',
          treatment_number: 2,
          row_number: 3,
        },
        {
          factor_properties_for_level_id: 6,
          text: '2.2',
          treatment_number: 2,
          row_number: 2,
        },
        {
          factor_properties_for_level_id: 6,
          text: '1.1',
          treatment_number: 1,
          row_number: 1,
        },
      ]

      const result = getUniqueTimings(timingProperty, levelDetails, timingUomMap, requestId)

      expect(result).toEqual([
        { code: 'A', description: '1.1' },
        { code: 'B', description: '1.2' },
        { code: 'C', description: '2.1' },
        { code: 'D', description: '2.2' },
        { code: 'E', description: '2.3' },
        { code: 'F', description: '3.1' },
      ])
    })

    test('pulls the correct description for each type of timing', () => {
      const levelDetails = [
        { factor_properties_for_level_id: 6, value_type: 'noTreatment' },
        { factor_properties_for_level_id: 6, value_type: 'placeholder', text: '2' },
        {
          factor_properties_for_level_id: 6,
          value_type: 'exact',
          uom_code: 'TEXT',
          text: '3',
        },
        {
          factor_properties_for_level_id: 6,
          value_type: 'exact',
          uom_code: 'STRING',
          value: '49477d93-6be9-4843-bdc1-f22b68190675',
        },
      ]

      const result = getUniqueTimings(timingProperty, levelDetails, timingUomMap, requestId)

      expect(result).toEqual([
        { code: 'A' },
        { code: 'B', description: '2' },
        { code: 'C', description: '3' },
        { code: 'D', description: 'Flowering' },
      ])
    })
  })

  describe('getIntentsForTreatments', () => {
    const factorProperties = [
      { id: 4, multi_question_tag: 'APP_RATE' },
      { id: 6, question_code: 'APP_TIM' },
      { id: 2, object_type: 'Catalog', material_type: 'CHEMICAL' },
      { id: 7, question_code: 'APP_MET' },
      { id: 7, question_code: 'APP_MET' },
      { id: 5, object_type: 'Catalog', material_type: 'INTERNAL_SEED' },
      { id: 8, multi_question_tag: 'APP_VOL' },
      { id: 9, multi_question_tag: 'MIX_SIZE' },
      { id: 10, question_code: 'APPPLCT' },
      { id: 11, question_code: 'APPPLCDT' },
      { id: 12, question_code: 'APP_EQUIP' },
    ]
    const uniqueTimings = [
      { code: 'A', description: '1' },
      { code: 'B', description: '2' },
      { code: 'C', description: '3' },
    ]

    test('completely parses a single intent from a single variable level row when all data is present', () => {
      const factorLevelDetails = [
        {
          factor_level_id: 1,
          factor_properties_for_level_id: 2,
          text: '1',
          value_type: 'placeholder',
          row_number: 1,
        },
        {
          factor_level_id: 1,
          factor_properties_for_level_id: 6,
          text: '1',
          row_number: 1,
        },
        {
          factor_level_id: 1,
          factor_properties_for_level_id: 4,
          value_type: 'exact',
          text: '5',
          question_code: 'APP_RATE1',
          uom_code: 'uom',
          row_number: 1,
        },
        {
          factor_level_id: 1,
          factor_properties_for_level_id: 7,
          value_type: 'exact',
          value: 'appMetGuid',
          uom_code: 'uom',
          row_number: 1,
        },
        {
          factor_level_id: 1,
          factor_properties_for_level_id: 8,
          value_type: 'placeholder',
          text: '7',
          question_code: 'APP_VOL1',
          uom_code: 'uom',
          row_number: 1,
        },
        {
          factor_level_id: 1,
          factor_properties_for_level_id: 9,
          value_type: 'exact',
          text: '8',
          question_code: 'MIX_SIZE1',
          uom_code: 'uom',
          row_number: 1,
        },
        {
          factor_level_id: 1,
          factor_properties_for_level_id: 10,
          value_type: 'placeholder',
          text: '9',
          uom_code: 'uom',
          row_number: 1,
        },
        {
          factor_level_id: 1,
          factor_properties_for_level_id: 11,
          value_type: 'placeholder',
          text: '10',
          uom_code: 'uom',
          row_number: 1,
        },
        {
          factor_level_id: 1,
          factor_properties_for_level_id: 12,
          value_type: 'exact',
          text: 'equipmentGUID',
          uom_code: 'uom',
          row_number: 1,
        },
      ]
      const combinationElements = [
        { treatment_number: 1, factor_level_id: 1 },
      ]

      const intents = getIntentsForTreatments(factorLevelDetails, factorProperties, combinationElements,
        uniqueTimings, timingUomMap, timingProperty)

      expect(intents).toEqual([
        {
          intents: [{
            applicationMethod: {
              isPlaceholder: false,
              questionCode: 'APP_MET',
              uomCode: 'uom',
              value: 'appMetGuid',
            },
            applicationVolume: {
              isPlaceholder: true,
              questionCode: 'APP_VOL1',
              uomCode: 'uom',
              value: '7',
            },
            mixSize: {
              isPlaceholder: false,
              questionCode: 'MIX_SIZE1',
              uomCode: 'uom',
              value: '8',
            },
            applicationEquipment: {
              isPlaceholder: false,
              questionCode: 'APP_EQUIP',
              uomCode: 'uom',
              value: 'equipmentGUID',
            },
            applicationPlacement: {
              isPlaceholder: true,
              questionCode: 'APPPLCT',
              uomCode: 'uom',
              value: '9',
            },
            applicationPlacementDetails: {
              isPlaceholder: true,
              questionCode: 'APPPLCDT',
              uomCode: 'uom',
              value: '10',
            },
            chemicals: [{
              applicationRate: {
                isPlaceholder: false,
                questionCode: 'APP_RATE1',
                value: '5',
                uomCode: 'uom',
              },
              entryType: 'placeholder',
              placeholder: '1',
              targetTimingCodes: ['A'],
            }],
            targetTimingCode: 'A',
          }],
          treatmentNumber: 1,
        },
      ])
    })

    test('partially parses a single intent from a single variable level row when some data is missing', () => {
      const factorLevelDetails = [
        {
          factor_level_id: 1,
          factor_properties_for_level_id: 2,
          text: '1',
          value_type: 'placeholder',
          row_number: 1,
        },
        {
          factor_level_id: 1,
          factor_properties_for_level_id: 6,
          text: '1',
          row_number: 1,
        },
        {
          factor_level_id: 1,
          factor_properties_for_level_id: 4,
          value_type: 'exact',
          text: '5',
          question_code: 'APP_RATE1',
          uom_code: 'uom',
          row_number: 1,
        },
        {
          factor_level_id: 1,
          factor_properties_for_level_id: 7,
          value_type: 'exact',
          value: 'appMetGuid',
          uom_code: 'uom',
          row_number: 1,
        },
        {
          factor_level_id: 1,
          factor_properties_for_level_id: 8,
          value_type: 'placeholder',
          text: '7',
          question_code: 'APP_VOL1',
          uom_code: 'uom',
          row_number: 1,
        },
        {
          factor_level_id: 1,
          factor_properties_for_level_id: 9,
          value_type: 'exact',
          text: '8',
          question_code: 'MIX_SIZE1',
          uom_code: 'uom',
          row_number: 1,
        },
      ]
      const combinationElements = [
        { treatment_number: 1, factor_level_id: 1 },
      ]

      const intents = getIntentsForTreatments(factorLevelDetails, factorProperties, combinationElements,
        uniqueTimings, timingUomMap, timingProperty)

      expect(intents).toEqual([
        {
          intents: [{
            applicationMethod: {
              isPlaceholder: false,
              questionCode: 'APP_MET',
              uomCode: 'uom',
              value: 'appMetGuid',
            },
            applicationVolume: {
              isPlaceholder: true,
              questionCode: 'APP_VOL1',
              uomCode: 'uom',
              value: '7',
            },
            mixSize: {
              isPlaceholder: false,
              questionCode: 'MIX_SIZE1',
              uomCode: 'uom',
              value: '8',
            },
            chemicals: [{
              applicationRate: {
                isPlaceholder: false,
                questionCode: 'APP_RATE1',
                value: '5',
                uomCode: 'uom',
              },
              entryType: 'placeholder',
              placeholder: '1',
              targetTimingCodes: ['A'],
            }],
            targetTimingCode: 'A',
          }],
          treatmentNumber: 1,
        },
      ])
    })

    test('parses a single intent from multiple variable level rows when there are more than one chemical', () => {
      const factorLevelDetails = [
        {
          factor_level_id: 1,
          factor_properties_for_level_id: 2,
          text: '1',
          value_type: 'placeholder',
          row_number: 1,
        },
        {
          factor_level_id: 1,
          factor_properties_for_level_id: 6,
          text: '1',
          row_number: 1,
        },
        {
          factor_level_id: 1,
          factor_properties_for_level_id: 4,
          value_type: 'exact',
          text: '5',
          question_code: 'APP_RATE1',
          uom_code: 'uom',
          row_number: 1,
        },
        {
          factor_level_id: 1,
          factor_properties_for_level_id: 7,
          value_type: 'exact',
          value: 'appMetGuid',
          uom_code: 'uom',
          row_number: 1,
        },
        {
          factor_level_id: 1,
          factor_properties_for_level_id: 8,
          value_type: 'placeholder',
          text: '7',
          question_code: 'APP_VOL1',
          uom_code: 'uom',
          row_number: 1,
        },
        {
          factor_level_id: 1,
          factor_properties_for_level_id: 9,
          value_type: 'exact',
          text: '8',
          question_code: 'MIX_SIZE1',
          uom_code: 'uom',
          row_number: 1,
        },
        {
          factor_level_id: 1,
          factor_properties_for_level_id: 2,
          text: '2',
          value_type: 'placeholder',
          row_number: 2,
        },
        {
          factor_level_id: 1,
          factor_properties_for_level_id: 6,
          text: '1',
          row_number: 2,
        },
        {
          factor_level_id: 1,
          factor_properties_for_level_id: 4,
          value_type: 'exact',
          text: '5',
          question_code: 'APP_RATE1',
          uom_code: 'uom',
          row_number: 2,
        },
        {
          factor_level_id: 1,
          factor_properties_for_level_id: 7,
          value_type: 'exact',
          value: 'appMetGuid',
          uom_code: 'uom',
          row_number: 2,
        },
        {
          factor_level_id: 1,
          factor_properties_for_level_id: 8,
          value_type: 'placeholder',
          text: '7',
          question_code: 'APP_VOL1',
          uom_code: 'uom',
          row_number: 2,
        },
        {
          factor_level_id: 1,
          factor_properties_for_level_id: 9,
          value_type: 'exact',
          text: '8',
          question_code: 'MIX_SIZE1',
          uom_code: 'uom',
          row_number: 2,
        },
      ]
      const combinationElements = [
        { treatment_number: 1, factor_level_id: 1 },
      ]

      const intents = getIntentsForTreatments(factorLevelDetails, factorProperties, combinationElements,
        uniqueTimings, timingUomMap, timingProperty)

      expect(intents).toEqual([
        {
          intents: [{
            applicationMethod: {
              isPlaceholder: false,
              questionCode: 'APP_MET',
              uomCode: 'uom',
              value: 'appMetGuid',
            },
            applicationVolume: {
              isPlaceholder: true,
              questionCode: 'APP_VOL1',
              uomCode: 'uom',
              value: '7',
            },
            mixSize: {
              isPlaceholder: false,
              questionCode: 'MIX_SIZE1',
              uomCode: 'uom',
              value: '8',
            },
            chemicals: [
              {
                applicationRate: {
                  isPlaceholder: false,
                  questionCode: 'APP_RATE1',
                  value: '5',
                  uomCode: 'uom',
                },
                entryType: 'placeholder',
                placeholder: '1',
                targetTimingCodes: ['A'],
              },
              {
                applicationRate: {
                  isPlaceholder: false,
                  questionCode: 'APP_RATE1',
                  value: '5',
                  uomCode: 'uom',
                },
                entryType: 'placeholder',
                placeholder: '2',
                targetTimingCodes: ['A'],
              },
            ],
            targetTimingCode: 'A',
          }],
          treatmentNumber: 1,
        },
      ])
    })

    test('parses multiple intents from multiple variable level rows when each row is a separate intent', () => {
      const factorLevelDetails = [
        {
          factor_level_id: 1,
          factor_properties_for_level_id: 2,
          text: '1',
          value_type: 'placeholder',
          row_number: 1,
        },
        {
          factor_level_id: 1,
          factor_properties_for_level_id: 6,
          text: '1',
          row_number: 1,
        },
        {
          factor_level_id: 1,
          factor_properties_for_level_id: 4,
          value_type: 'exact',
          text: '5',
          question_code: 'APP_RATE1',
          uom_code: 'uom',
          row_number: 1,
        },
        {
          factor_level_id: 1,
          factor_properties_for_level_id: 7,
          value_type: 'exact',
          value: 'appMetGuid',
          uom_code: 'uom',
          row_number: 1,
        },
        {
          factor_level_id: 1,
          factor_properties_for_level_id: 8,
          value_type: 'placeholder',
          text: '7',
          question_code: 'APP_VOL1',
          uom_code: 'uom',
          row_number: 1,
        },
        {
          factor_level_id: 1,
          factor_properties_for_level_id: 9,
          value_type: 'exact',
          text: '8',
          question_code: 'MIX_SIZE1',
          uom_code: 'uom',
          row_number: 1,
        },
        {
          factor_level_id: 1,
          factor_properties_for_level_id: 2,
          text: '2',
          value_type: 'placeholder',
          row_number: 2,
        },
        {
          factor_level_id: 1,
          factor_properties_for_level_id: 6,
          text: '1',
          row_number: 2,
        },
        {
          factor_level_id: 1,
          factor_properties_for_level_id: 4,
          value_type: 'exact',
          text: '5',
          question_code: 'APP_RATE1',
          uom_code: 'uom',
          row_number: 2,
        },
        {
          factor_level_id: 1,
          factor_properties_for_level_id: 7,
          value_type: 'exact',
          value: 'appMetGuid',
          uom_code: 'uom',
          row_number: 2,
        },
        {
          factor_level_id: 1,
          factor_properties_for_level_id: 8,
          value_type: 'placeholder',
          text: '7',
          question_code: 'APP_VOL1',
          uom_code: 'uom',
          row_number: 2,
        },
        {
          factor_level_id: 1,
          factor_properties_for_level_id: 9,
          value_type: 'exact',
          text: '9',
          question_code: 'MIX_SIZE1',
          uom_code: 'uom',
          row_number: 2,
        },
      ]
      const combinationElements = [
        { treatment_number: 1, factor_level_id: 1 },
      ]

      const intents = getIntentsForTreatments(factorLevelDetails, factorProperties, combinationElements,
        uniqueTimings, timingUomMap, timingProperty)

      expect(intents).toEqual([
        {
          intents: [
              {
              applicationMethod: {
                isPlaceholder: false,
                questionCode: 'APP_MET',
                uomCode: 'uom',
                value: 'appMetGuid',
              },
              applicationVolume: {
                isPlaceholder: true,
                questionCode: 'APP_VOL1',
                uomCode: 'uom',
                value: '7',
              },
              mixSize: {
                isPlaceholder: false,
                questionCode: 'MIX_SIZE1',
                uomCode: 'uom',
                value: '8',
              },
              chemicals: [
                {
                  applicationRate: {
                    isPlaceholder: false,
                    questionCode: 'APP_RATE1',
                    value: '5',
                    uomCode: 'uom',
                  },
                  entryType: 'placeholder',
                  placeholder: '1',
                  targetTimingCodes: ['A'],
                },
              ],
              targetTimingCode: 'A',
            },
            {
            applicationMethod: {
              isPlaceholder: false,
              questionCode: 'APP_MET',
              uomCode: 'uom',
              value: 'appMetGuid',
            },
            applicationVolume: {
              isPlaceholder: true,
              questionCode: 'APP_VOL1',
              uomCode: 'uom',
              value: '7',
            },
            mixSize: {
              isPlaceholder: false,
              questionCode: 'MIX_SIZE1',
              uomCode: 'uom',
              value: '9',
            },
            chemicals: [
              {
                applicationRate: {
                  isPlaceholder: false,
                  questionCode: 'APP_RATE1',
                  value: '5',
                  uomCode: 'uom',
                },
                entryType: 'placeholder',
                placeholder: '2',
                targetTimingCodes: ['A'],
              },
            ],
            targetTimingCode: 'A',
          },
          ],
          treatmentNumber: 1,
        },
      ])
    })

    test('parses multiple intents from multiple variable level rows when the intents may have multiple chemicals', () => {
      const factorLevelDetails = [
        {
          factor_level_id: 1,
          factor_properties_for_level_id: 2,
          text: '1',
          value_type: 'placeholder',
          row_number: 1,
        },
        {
          factor_level_id: 1,
          factor_properties_for_level_id: 6,
          text: '1',
          row_number: 1,
        },
        {
          factor_level_id: 1,
          factor_properties_for_level_id: 4,
          value_type: 'exact',
          text: '5',
          question_code: 'APP_RATE1',
          uom_code: 'uom',
          row_number: 1,
        },
        {
          factor_level_id: 1,
          factor_properties_for_level_id: 7,
          value_type: 'exact',
          value: 'appMetGuid',
          uom_code: 'uom',
          row_number: 1,
        },
        {
          factor_level_id: 1,
          factor_properties_for_level_id: 8,
          value_type: 'placeholder',
          text: '7',
          question_code: 'APP_VOL1',
          uom_code: 'uom',
          row_number: 1,
        },
        {
          factor_level_id: 1,
          factor_properties_for_level_id: 9,
          value_type: 'exact',
          text: '8',
          question_code: 'MIX_SIZE1',
          uom_code: 'uom',
          row_number: 1,
        },
        {
          factor_level_id: 1,
          factor_properties_for_level_id: 2,
          text: '2',
          value_type: 'placeholder',
          row_number: 2,
        },
        {
          factor_level_id: 1,
          factor_properties_for_level_id: 6,
          text: '1',
          row_number: 2,
        },
        {
          factor_level_id: 1,
          factor_properties_for_level_id: 4,
          value_type: 'exact',
          text: '5',
          question_code: 'APP_RATE1',
          uom_code: 'uom',
          row_number: 2,
        },
        {
          factor_level_id: 1,
          factor_properties_for_level_id: 7,
          value_type: 'exact',
          value: 'appMetGuid',
          uom_code: 'uom',
          row_number: 2,
        },
        {
          factor_level_id: 1,
          factor_properties_for_level_id: 8,
          value_type: 'placeholder',
          text: '7',
          question_code: 'APP_VOL1',
          uom_code: 'uom',
          row_number: 2,
        },
        {
          factor_level_id: 1,
          factor_properties_for_level_id: 9,
          value_type: 'exact',
          text: '9',
          question_code: 'MIX_SIZE1',
          uom_code: 'uom',
          row_number: 2,
        },
        {
          factor_level_id: 1,
          factor_properties_for_level_id: 2,
          text: '3',
          value_type: 'placeholder',
          row_number: 3,
        },
        {
          factor_level_id: 1,
          factor_properties_for_level_id: 6,
          text: '1',
          row_number: 3,
        },
        {
          factor_level_id: 1,
          factor_properties_for_level_id: 4,
          value_type: 'exact',
          text: '5',
          question_code: 'APP_RATE1',
          uom_code: 'uom',
          row_number: 3,
        },
        {
          factor_level_id: 1,
          factor_properties_for_level_id: 7,
          value_type: 'exact',
          value: 'appMetGuid',
          uom_code: 'uom',
          row_number: 3,
        },
        {
          factor_level_id: 1,
          factor_properties_for_level_id: 8,
          value_type: 'placeholder',
          text: '7',
          question_code: 'APP_VOL1',
          uom_code: 'uom',
          row_number: 3,
        },
        {
          factor_level_id: 1,
          factor_properties_for_level_id: 9,
          value_type: 'exact',
          text: '9',
          question_code: 'MIX_SIZE1',
          uom_code: 'uom',
          row_number: 3,
        },
      ]
      const combinationElements = [
        { treatment_number: 1, factor_level_id: 1 },
      ]

      const intents = getIntentsForTreatments(factorLevelDetails, factorProperties, combinationElements,
        uniqueTimings, timingUomMap, timingProperty)

      expect(intents).toEqual([
        {
          intents: [
              {
              applicationMethod: {
                isPlaceholder: false,
                questionCode: 'APP_MET',
                uomCode: 'uom',
                value: 'appMetGuid',
              },
              applicationVolume: {
                isPlaceholder: true,
                questionCode: 'APP_VOL1',
                uomCode: 'uom',
                value: '7',
              },
              mixSize: {
                isPlaceholder: false,
                questionCode: 'MIX_SIZE1',
                uomCode: 'uom',
                value: '8',
              },
              chemicals: [
                {
                  applicationRate: {
                    isPlaceholder: false,
                    questionCode: 'APP_RATE1',
                    value: '5',
                    uomCode: 'uom',
                  },
                  entryType: 'placeholder',
                  placeholder: '1',
                  targetTimingCodes: ['A'],
                },
              ],
              targetTimingCode: 'A',
            },
            {
            applicationMethod: {
              isPlaceholder: false,
              questionCode: 'APP_MET',
              uomCode: 'uom',
              value: 'appMetGuid',
            },
            applicationVolume: {
              isPlaceholder: true,
              questionCode: 'APP_VOL1',
              uomCode: 'uom',
              value: '7',
            },
            mixSize: {
              isPlaceholder: false,
              questionCode: 'MIX_SIZE1',
              uomCode: 'uom',
              value: '9',
            },
            chemicals: [
              {
                applicationRate: {
                  isPlaceholder: false,
                  questionCode: 'APP_RATE1',
                  value: '5',
                  uomCode: 'uom',
                },
                entryType: 'placeholder',
                placeholder: '2',
                targetTimingCodes: ['A'],
              },
              {
                applicationRate: {
                  isPlaceholder: false,
                  questionCode: 'APP_RATE1',
                  value: '5',
                  uomCode: 'uom',
                },
                entryType: 'placeholder',
                placeholder: '3',
                targetTimingCodes: ['A'],
              },
            ],
            targetTimingCode: 'A',
          },
          ],
          treatmentNumber: 1,
        },
      ])
    })

    test('parses a single intent from multiple variables that have a single level row each', () => {
      const factorLevelDetails = [
        {
          factor_level_id: 1,
          factor_properties_for_level_id: 2,
          text: '1',
          value_type: 'placeholder',
          row_number: 1,
        },
        {
          factor_level_id: 2,
          factor_properties_for_level_id: 6,
          text: '1',
          row_number: 1,
        },
        {
          factor_level_id: 1,
          factor_properties_for_level_id: 4,
          value_type: 'exact',
          text: '5',
          question_code: 'APP_RATE1',
          uom_code: 'uom',
          row_number: 1,
        },
        {
          factor_level_id: 1,
          factor_properties_for_level_id: 7,
          value_type: 'exact',
          value: 'appMetGuid',
          uom_code: 'uom',
          row_number: 1,
        },
        {
          factor_level_id: 2,
          factor_properties_for_level_id: 8,
          value_type: 'placeholder',
          text: '7',
          question_code: 'APP_VOL1',
          uom_code: 'uom',
          row_number: 1,
        },
        {
          factor_level_id: 1,
          factor_properties_for_level_id: 9,
          value_type: 'exact',
          text: '8',
          question_code: 'MIX_SIZE1',
          uom_code: 'uom',
          row_number: 1,
        },
        {
          factor_level_id: 2,
          factor_properties_for_level_id: 10,
          value_type: 'placeholder',
          text: '9',
          uom_code: 'uom',
          row_number: 1,
        },
        {
          factor_level_id: 2,
          factor_properties_for_level_id: 11,
          value_type: 'placeholder',
          text: '10',
          uom_code: 'uom',
          row_number: 1,
        },
        {
          factor_level_id: 1,
          factor_properties_for_level_id: 12,
          value_type: 'exact',
          text: 'equipmentGUID',
          uom_code: 'uom',
          row_number: 1,
        },
      ]
      const combinationElements = [
        { treatment_number: 1, factor_level_id: 1 },
        { treatment_number: 1, factor_level_id: 2 },
      ]

      const intents = getIntentsForTreatments(factorLevelDetails, factorProperties, combinationElements,
        uniqueTimings, timingUomMap, timingProperty)

      expect(intents).toEqual([
        {
          intents: [{
            applicationMethod: {
              isPlaceholder: false,
              questionCode: 'APP_MET',
              uomCode: 'uom',
              value: 'appMetGuid',
            },
            applicationVolume: {
              isPlaceholder: true,
              questionCode: 'APP_VOL1',
              uomCode: 'uom',
              value: '7',
            },
            mixSize: {
              isPlaceholder: false,
              questionCode: 'MIX_SIZE1',
              uomCode: 'uom',
              value: '8',
            },
            applicationEquipment: {
              isPlaceholder: false,
              questionCode: 'APP_EQUIP',
              uomCode: 'uom',
              value: 'equipmentGUID',
            },
            applicationPlacement: {
              isPlaceholder: true,
              questionCode: 'APPPLCT',
              uomCode: 'uom',
              value: '9',
            },
            applicationPlacementDetails: {
              isPlaceholder: true,
              questionCode: 'APPPLCDT',
              uomCode: 'uom',
              value: '10',
            },
            chemicals: [{
              applicationRate: {
                isPlaceholder: false,
                questionCode: 'APP_RATE1',
                value: '5',
                uomCode: 'uom',
              },
              entryType: 'placeholder',
              placeholder: '1',
              targetTimingCodes: ['A'],
            }],
            targetTimingCode: 'A',
          }],
          treatmentNumber: 1,
        },
      ])
    })

    test('parses multiple intents from multiple variables when at least one variable has more than one level row', () => {
      const factorLevelDetails = [
        {
          factor_level_id: 1,
          factor_properties_for_level_id: 2,
          text: '1',
          value_type: 'placeholder',
          row_number: 1,
        },
        {
          factor_level_id: 1,
          factor_properties_for_level_id: 2,
          text: '2',
          value_type: 'placeholder',
          row_number: 2,
        },
        {
          factor_level_id: 2,
          factor_properties_for_level_id: 6,
          text: '1',
          row_number: 1,
        },
        {
          factor_level_id: 1,
          factor_properties_for_level_id: 4,
          value_type: 'exact',
          text: '5',
          question_code: 'APP_RATE1',
          uom_code: 'uom',
          row_number: 1,
        },
        {
          factor_level_id: 1,
          factor_properties_for_level_id: 4,
          value_type: 'exact',
          text: '6',
          question_code: 'APP_RATE1',
          uom_code: 'uom',
          row_number: 2,
        },
        {
          factor_level_id: 1,
          factor_properties_for_level_id: 7,
          value_type: 'exact',
          value: 'appMetGuid',
          uom_code: 'uom',
          row_number: 1,
        },
        {
          factor_level_id: 1,
          factor_properties_for_level_id: 7,
          value_type: 'exact',
          value: 'appMetGuid2',
          uom_code: 'uom',
          row_number: 2,
        },
        {
          factor_level_id: 2,
          factor_properties_for_level_id: 8,
          value_type: 'placeholder',
          text: '7',
          question_code: 'APP_VOL1',
          uom_code: 'uom',
          row_number: 1,
        },
        {
          factor_level_id: 1,
          factor_properties_for_level_id: 9,
          value_type: 'exact',
          text: '8',
          question_code: 'MIX_SIZE1',
          uom_code: 'uom',
          row_number: 1,
        },
        {
          factor_level_id: 1,
          factor_properties_for_level_id: 9,
          value_type: 'exact',
          text: '8',
          question_code: 'MIX_SIZE1',
          uom_code: 'uom',
          row_number: 2,
        },
        {
          factor_level_id: 2,
          factor_properties_for_level_id: 10,
          value_type: 'placeholder',
          text: '9',
          uom_code: 'uom',
          row_number: 1,
        },
        {
          factor_level_id: 2,
          factor_properties_for_level_id: 11,
          value_type: 'placeholder',
          text: '10',
          uom_code: 'uom',
          row_number: 1,
        },
        {
          factor_level_id: 1,
          factor_properties_for_level_id: 12,
          value_type: 'exact',
          text: 'equipmentGUID',
          uom_code: 'uom',
          row_number: 1,
        },
        {
          factor_level_id: 1,
          factor_properties_for_level_id: 12,
          value_type: 'exact',
          text: 'equipmentGUID',
          uom_code: 'uom',
          row_number: 2,
        },
      ]
      const combinationElements = [
        { treatment_number: 1, factor_level_id: 1 },
        { treatment_number: 1, factor_level_id: 2 },
      ]

      const intents = getIntentsForTreatments(factorLevelDetails, factorProperties, combinationElements,
        uniqueTimings, timingUomMap, timingProperty)

      expect(intents).toEqual([
        {
          intents: [
            {
              applicationMethod: {
                isPlaceholder: false,
                questionCode: 'APP_MET',
                uomCode: 'uom',
                value: 'appMetGuid',
              },
              applicationVolume: {
                isPlaceholder: true,
                questionCode: 'APP_VOL1',
                uomCode: 'uom',
                value: '7',
              },
              mixSize: {
                isPlaceholder: false,
                questionCode: 'MIX_SIZE1',
                uomCode: 'uom',
                value: '8',
              },
              applicationEquipment: {
                isPlaceholder: false,
                questionCode: 'APP_EQUIP',
                uomCode: 'uom',
                value: 'equipmentGUID',
              },
              applicationPlacement: {
                isPlaceholder: true,
                questionCode: 'APPPLCT',
                uomCode: 'uom',
                value: '9',
              },
              applicationPlacementDetails: {
                isPlaceholder: true,
                questionCode: 'APPPLCDT',
                uomCode: 'uom',
                value: '10',
              },
              chemicals: [{
                applicationRate: {
                  isPlaceholder: false,
                  questionCode: 'APP_RATE1',
                  value: '5',
                  uomCode: 'uom',
                },
                entryType: 'placeholder',
                placeholder: '1',
                targetTimingCodes: ['A'],
              }],
              targetTimingCode: 'A',
            },
            {
              applicationMethod: {
                isPlaceholder: false,
                questionCode: 'APP_MET',
                uomCode: 'uom',
                value: 'appMetGuid2',
              },
              applicationVolume: {
                isPlaceholder: true,
                questionCode: 'APP_VOL1',
                uomCode: 'uom',
                value: '7',
              },
              mixSize: {
                isPlaceholder: false,
                questionCode: 'MIX_SIZE1',
                uomCode: 'uom',
                value: '8',
              },
              applicationEquipment: {
                isPlaceholder: false,
                questionCode: 'APP_EQUIP',
                uomCode: 'uom',
                value: 'equipmentGUID',
              },
              applicationPlacement: {
                isPlaceholder: true,
                questionCode: 'APPPLCT',
                uomCode: 'uom',
                value: '9',
              },
              applicationPlacementDetails: {
                isPlaceholder: true,
                questionCode: 'APPPLCDT',
                uomCode: 'uom',
                value: '10',
              },
              chemicals: [{
                applicationRate: {
                  isPlaceholder: false,
                  questionCode: 'APP_RATE1',
                  value: '6',
                  uomCode: 'uom',
                },
                entryType: 'placeholder',
                placeholder: '2',
                targetTimingCodes: ['A'],
              }],
              targetTimingCode: 'A',
            },
          ],
          treatmentNumber: 1,
        },
      ])
    })

    test('properly assigns multiple timings correctly at the intent and chemical level', () => {
      const factorLevelDetails = [
        {
          factor_level_id: 1,
          factor_properties_for_level_id: 2,
          text: '1',
          value_type: 'placeholder',
          row_number: 1,
        },
        {
          factor_level_id: 1,
          factor_properties_for_level_id: 6,
          text: '1',
          row_number: 1,
        },
        {
          factor_level_id: 1,
          factor_properties_for_level_id: 4,
          value_type: 'exact',
          text: '5',
          question_code: 'APP_RATE1',
          uom_code: 'uom',
          row_number: 1,
        },
        {
          factor_level_id: 1,
          factor_properties_for_level_id: 7,
          value_type: 'exact',
          value: 'appMetGuid',
          uom_code: 'uom',
          row_number: 1,
        },
        {
          factor_level_id: 1,
          factor_properties_for_level_id: 8,
          value_type: 'placeholder',
          text: '7',
          question_code: 'APP_VOL1',
          uom_code: 'uom',
          row_number: 1,
        },
        {
          factor_level_id: 1,
          factor_properties_for_level_id: 9,
          value_type: 'exact',
          text: '8',
          question_code: 'MIX_SIZE1',
          uom_code: 'uom',
          row_number: 1,
        },
        {
          factor_level_id: 1,
          factor_properties_for_level_id: 2,
          text: '1',
          value_type: 'placeholder',
          row_number: 2,
        },
        {
          factor_level_id: 1,
          factor_properties_for_level_id: 6,
          text: '2',
          row_number: 2,
        },
        {
          factor_level_id: 1,
          factor_properties_for_level_id: 4,
          value_type: 'exact',
          text: '5',
          question_code: 'APP_RATE1',
          uom_code: 'uom',
          row_number: 2,
        },
        {
          factor_level_id: 1,
          factor_properties_for_level_id: 7,
          value_type: 'exact',
          value: 'appMetGuid',
          uom_code: 'uom',
          row_number: 2,
        },
        {
          factor_level_id: 1,
          factor_properties_for_level_id: 8,
          value_type: 'placeholder',
          text: '7',
          question_code: 'APP_VOL1',
          uom_code: 'uom',
          row_number: 2,
        },
        {
          factor_level_id: 1,
          factor_properties_for_level_id: 9,
          value_type: 'exact',
          text: '8',
          question_code: 'MIX_SIZE1',
          uom_code: 'uom',
          row_number: 2,
        },
      ]
      const combinationElements = [
        { treatment_number: 1, factor_level_id: 1 },
      ]

      const intents = getIntentsForTreatments(factorLevelDetails, factorProperties, combinationElements,
        uniqueTimings, timingUomMap, timingProperty)

      expect(intents).toEqual([
        {
          intents: [
            {
              applicationMethod: {
                isPlaceholder: false,
                questionCode: 'APP_MET',
                uomCode: 'uom',
                value: 'appMetGuid',
              },
              applicationVolume: {
                isPlaceholder: true,
                questionCode: 'APP_VOL1',
                uomCode: 'uom',
                value: '7',
              },
              mixSize: {
                isPlaceholder: false,
                questionCode: 'MIX_SIZE1',
                uomCode: 'uom',
                value: '8',
              },
              chemicals: [
                {
                  applicationRate: {
                    isPlaceholder: false,
                    questionCode: 'APP_RATE1',
                    value: '5',
                    uomCode: 'uom',
                  },
                  entryType: 'placeholder',
                  placeholder: '1',
                  targetTimingCodes: ['A', 'B'],
                },
              ],
              targetTimingCode: 'A',
            },
            {
              applicationMethod: {
                isPlaceholder: false,
                questionCode: 'APP_MET',
                uomCode: 'uom',
                value: 'appMetGuid',
              },
              applicationVolume: {
                isPlaceholder: true,
                questionCode: 'APP_VOL1',
                uomCode: 'uom',
                value: '7',
              },
              mixSize: {
                isPlaceholder: false,
                questionCode: 'MIX_SIZE1',
                uomCode: 'uom',
                value: '8',
              },
              chemicals: [
                {
                  applicationRate: {
                    isPlaceholder: false,
                    questionCode: 'APP_RATE1',
                    value: '5',
                    uomCode: 'uom',
                  },
                  entryType: 'placeholder',
                  placeholder: '1',
                  targetTimingCodes: ['A', 'B'],
                },
              ],
              targetTimingCode: 'B',
            },
          ],
          treatmentNumber: 1,
        },
      ])
    })

    test('constructs intents with just chemical data if no intent level data is present', () => {
      const factorLevelDetails = [
        {
          factor_level_id: 1,
          factor_properties_for_level_id: 2,
          text: '1',
          value_type: 'placeholder',
          row_number: 1,
        },
        {
          factor_level_id: 1,
          factor_properties_for_level_id: 4,
          value_type: 'exact',
          text: '5',
          question_code: 'APP_RATE1',
          uom_code: 'uom',
          row_number: 1,
        },
        {
          factor_level_id: 1,
          factor_properties_for_level_id: 2,
          value: 12345,
          value_type: 'exact',
          row_number: 2,
        },
        {
          factor_level_id: 1,
          factor_properties_for_level_id: 4,
          value_type: 'exact',
          text: '5',
          question_code: 'APP_RATE1',
          uom_code: 'uom',
          row_number: 2,
        },
      ]
      const combinationElements = [
        { treatment_number: 1, factor_level_id: 1 },
      ]

      const intents = getIntentsForTreatments(factorLevelDetails, factorProperties, combinationElements,
        uniqueTimings, timingUomMap, timingProperty)

      expect(intents).toEqual([
        {
          intents: [{
            chemicals: [
              {
                applicationRate: {
                  isPlaceholder: false,
                  questionCode: 'APP_RATE1',
                  value: '5',
                  uomCode: 'uom',
                },
                entryType: 'placeholder',
                placeholder: '1',
                targetTimingCodes: [],
              },
              {
                applicationRate: {
                  isPlaceholder: false,
                  questionCode: 'APP_RATE1',
                  value: '5',
                  uomCode: 'uom',
                },
                entryType: 'exact',
                materialCategory: 'catalog',
                materialId: 12345,
                targetTimingCodes: [],
              },
            ],
          }],
          treatmentNumber: 1,
        },
      ])
    })

    test('constructs intents with just intent data if no chemical level data is present', () => {
      const factorLevelDetails = [
        {
          factor_level_id: 1,
          factor_properties_for_level_id: 7,
          value_type: 'exact',
          value: 'appMetGuid',
          uom_code: 'uom',
          row_number: 1,
        },
        {
          factor_level_id: 1,
          factor_properties_for_level_id: 8,
          value_type: 'placeholder',
          text: '7',
          question_code: 'APP_VOL1',
          uom_code: 'uom',
          row_number: 1,
        },
        {
          factor_level_id: 1,
          factor_properties_for_level_id: 9,
          value_type: 'exact',
          text: '8',
          question_code: 'MIX_SIZE1',
          uom_code: 'uom',
          row_number: 1,
        },
      ]
      const combinationElements = [
        { treatment_number: 1, factor_level_id: 1 },
      ]

      const intents = getIntentsForTreatments(factorLevelDetails, factorProperties, combinationElements,
        uniqueTimings, timingUomMap, timingProperty)

      expect(intents).toEqual([
        {
          intents: [{
            applicationMethod: {
              isPlaceholder: false,
              questionCode: 'APP_MET',
              uomCode: 'uom',
              value: 'appMetGuid',
            },
            applicationVolume: {
              isPlaceholder: true,
              questionCode: 'APP_VOL1',
              uomCode: 'uom',
              value: '7',
            },
            mixSize: {
              isPlaceholder: false,
              questionCode: 'MIX_SIZE1',
              uomCode: 'uom',
              value: '8',
            },
            chemicals: [],
          }],
          treatmentNumber: 1,
        },
      ])
    })

    test('ignores variable levels without any chemAP details to loop through', () => {
      const factorLevelDetails = [
        {
          factor_level_id: 1,
          factor_properties_for_level_id: 2,
          text: '1',
          value_type: 'placeholder',
          row_number: 1,
        },
        {
          factor_level_id: 1,
          factor_properties_for_level_id: 6,
          text: '1',
          row_number: 1,
        },
        {
          factor_level_id: 1,
          factor_properties_for_level_id: 4,
          value_type: 'exact',
          text: '5',
          question_code: 'APP_RATE1',
          uom_code: 'uom',
          row_number: 1,
        },
        {
          factor_level_id: 1,
          factor_properties_for_level_id: 7,
          value_type: 'exact',
          value: 'appMetGuid',
          uom_code: 'uom',
          row_number: 1,
        },
        {
          factor_level_id: 1,
          factor_properties_for_level_id: 8,
          value_type: 'placeholder',
          text: '7',
          question_code: 'APP_VOL1',
          uom_code: 'uom',
          row_number: 1,
        },
        {
          factor_level_id: 1,
          factor_properties_for_level_id: 9,
          value_type: 'exact',
          text: '8',
          question_code: 'MIX_SIZE1',
          uom_code: 'uom',
          row_number: 1,
        },
        {
          factor_level_id: 2,
          factor_properties_for_level_id: 5,
          text: '21',
          value_type: 'placeholder',
          row_number: 1,
        },
        {
          factor_level_id: 2,
          factor_properties_for_level_id: 5,
          text: '31',
          value_type: 'placeholder',
          row_number: 2,
        },
      ]
      const combinationElements = [
        { treatment_number: 1, factor_level_id: 1 },
        { treatment_number: 1, factor_level_id: 2 },
      ]

      const intents = getIntentsForTreatments(factorLevelDetails, factorProperties, combinationElements,
        uniqueTimings, timingUomMap, timingProperty)

      expect(intents).toEqual([
        {
          intents: [{
            applicationMethod: {
              isPlaceholder: false,
              questionCode: 'APP_MET',
              uomCode: 'uom',
              value: 'appMetGuid',
            },
            applicationVolume: {
              isPlaceholder: true,
              questionCode: 'APP_VOL1',
              uomCode: 'uom',
              value: '7',
            },
            mixSize: {
              isPlaceholder: false,
              questionCode: 'MIX_SIZE1',
              uomCode: 'uom',
              value: '8',
            },
            chemicals: [{
              applicationRate: {
                isPlaceholder: false,
                questionCode: 'APP_RATE1',
                value: '5',
                uomCode: 'uom',
              },
              entryType: 'placeholder',
              placeholder: '1',
              targetTimingCodes: ['A'],
            }],
            targetTimingCode: 'A',
          }],
          treatmentNumber: 1,
        },
      ])
    })

    test('collapses duplicate chemicals', () => {
      const factorLevelDetails = [
        {
          factor_level_id: 2,
          factor_properties_for_level_id: 2,
          text: 'chem1',
          value_type: 'placeholder',
          row_number: 1,
        },
        {
          factor_level_id: 2,
          factor_properties_for_level_id: 2,
          text: 'chem1',
          value_type: 'placeholder',
          row_number: 2,
        },
        {
          factor_level_id: 2,
          factor_properties_for_level_id: 5,
          text: 'seed1',
          value_type: 'placeholder',
          row_number: 1,
        },
        {
          factor_level_id: 2,
          factor_properties_for_level_id: 5,
          text: 'seed2',
          value_type: 'placeholder',
          row_number: 2,
        },
        {
          factor_level_id: 1,
          factor_properties_for_level_id: 6,
          text: '1',
          row_number: 1,
        },
        {
          factor_level_id: 1,
          factor_properties_for_level_id: 4,
          value_type: 'exact',
          text: '5',
          question_code: 'APP_RATE1',
          uom_code: 'uom',
          row_number: 1,
        },
        {
          factor_level_id: 1,
          factor_properties_for_level_id: 7,
          value_type: 'exact',
          value: 'appMetGuid',
          uom_code: 'uom',
          row_number: 1,
        },
        {
          factor_level_id: 1,
          factor_properties_for_level_id: 8,
          value_type: 'placeholder',
          text: '7',
          question_code: 'APP_VOL1',
          uom_code: 'uom',
          row_number: 1,
        },
        {
          factor_level_id: 1,
          factor_properties_for_level_id: 9,
          value_type: 'exact',
          text: '8',
          question_code: 'MIX_SIZE1',
          uom_code: 'uom',
          row_number: 1,
        },
      ]
      const combinationElements = [
        { treatment_number: 1, factor_level_id: 1 },
        { treatment_number: 1, factor_level_id: 2 },
      ]

      const intents = getIntentsForTreatments(factorLevelDetails, factorProperties, combinationElements,
        uniqueTimings, timingUomMap, timingProperty)

      expect(intents).toEqual([
        {
          intents: [{
            applicationMethod: {
              isPlaceholder: false,
              questionCode: 'APP_MET',
              uomCode: 'uom',
              value: 'appMetGuid',
            },
            applicationVolume: {
              isPlaceholder: true,
              questionCode: 'APP_VOL1',
              uomCode: 'uom',
              value: '7',
            },
            mixSize: {
              isPlaceholder: false,
              questionCode: 'MIX_SIZE1',
              uomCode: 'uom',
              value: '8',
            },
            chemicals: [{
              applicationRate: {
                isPlaceholder: false,
                questionCode: 'APP_RATE1',
                value: '5',
                uomCode: 'uom',
              },
              entryType: 'placeholder',
              placeholder: 'chem1',
              targetTimingCodes: ['A'],
            }],
            targetTimingCode: 'A',
          }],
          treatmentNumber: 1,
        },
      ])
    })

    test('parses all available data when no treatments are present', () => {
      const factorLevelDetails = [
        {
          factor_level_id: 1,
          factor_properties_for_level_id: 2,
          text: '1',
          value_type: 'placeholder',
          row_number: 1,
        },
        {
          factor_level_id: 1,
          factor_properties_for_level_id: 4,
          value_type: 'noTreatment',
          row_number: 1,
        },
        {
          factor_level_id: 1,
          factor_properties_for_level_id: 2,
          value_type: 'noTreatment',
          row_number: 2,
        },
        {
          factor_level_id: 1,
          factor_properties_for_level_id: 4,
          value_type: 'exact',
          text: '5',
          question_code: 'APP_RATE1',
          uom_code: 'uom',
          row_number: 2,
        },
      ]
      const combinationElements = [
        { treatment_number: 1, factor_level_id: 1 },
      ]

      const intents = getIntentsForTreatments(factorLevelDetails, factorProperties, combinationElements,
        uniqueTimings, timingUomMap, timingProperty)

      expect(intents).toEqual([
        {
          intents: [{
            chemicals: [
              {
                entryType: 'placeholder',
                placeholder: '1',
                targetTimingCodes: [],
              },
              {
                applicationRate: {
                  isPlaceholder: false,
                  questionCode: 'APP_RATE1',
                  value: '5',
                  uomCode: 'uom',
                },
                targetTimingCodes: [],
              },
            ],
          }],
          treatmentNumber: 1,
        },
      ])
    })
  })

  describe('getUniqueIntentsWithTreatment', () => {
    test('deduplicates and numbers chemical groups correctly', () => {
      const intentsByTreatment = [
        {
          intents: [
            {
              applicationMethod: {
                isPlaceholder: true,
                questionCode: 'APP_MET',
                uomCode: 'someUomGuid',
                value: 'Spray',
              },
              mixSize: {
                isPlaceholder: false,
                questionCode: 'MIX_SIZE',
                uomCode: 'someUomGuid',
                value: '1',
              },
              chemicals: [{
                entryType: 'exact',
                materialCategory: 'catalog',
                materialId: 1,
                targetinTimingCodes: ['A'],
              }],
              targetTimingCode: 'A',
            },
          ],
          treatmentNumber: 1,
        },
        {
          intents: [{
            applicationMethod: {
              isPlaceholder: true,
              questionCode: 'APP_MET',
              uomCode: 'someUomGuid',
              value: 'Spray',
            },
            mixSize: {
              isPlaceholder: false,
              questionCode: 'MIX_SIZE',
              uomCode: 'someUomGuid',
              value: '2',
            },
            chemicals: [{
              entryType: 'exact',
              materialCategory: 'catalog',
              materialId: 1,
              targetinTimingCodes: ['A'],
            }],
            targetTimingCode: 'A',
          }],
          treatmentNumber: 2,
        },
      ]

      const result = getUniqueIntentsWithTreatment(intentsByTreatment)

      expect(result).toEqual([
        {
          intent: {
            intentNumber: 1,
            applicationMethod: {
              isPlaceholder: true,
              questionCode: 'APP_MET',
              uomCode: 'someUomGuid',
              value: 'Spray',
            },
            mixSize: {
              isPlaceholder: false,
              questionCode: 'MIX_SIZE',
              uomCode: 'someUomGuid',
              value: '1',
            },
            chemicals: [{
              entryType: 'exact',
              materialCategory: 'catalog',
              materialId: 1,
              targetinTimingCodes: ['A'],
              chemicalGroupNumber: 1,
            }],
            targetTimingCode: 'A',
          },
          treatmentNumbers: [1],
        },
        {
          intent: {
            intentNumber: 2,
            applicationMethod: {
              isPlaceholder: true,
              questionCode: 'APP_MET',
              uomCode: 'someUomGuid',
              value: 'Spray',
            },
            mixSize: {
              isPlaceholder: false,
              questionCode: 'MIX_SIZE',
              uomCode: 'someUomGuid',
              value: '2',
            },
            chemicals: [{
              entryType: 'exact',
              materialCategory: 'catalog',
              materialId: 1,
              targetinTimingCodes: ['A'],
              chemicalGroupNumber: 1,
            }],
            targetTimingCode: 'A',
          },
          treatmentNumbers: [2],
        },
      ])
    })

    test('deduplicates and numbers intents correctly', () => {
      const intentsByTreatment = [
        {
          intents: [
            {
              applicationMethod: {
                isPlaceholder: true,
                questionCode: 'APP_MET',
                uomCode: 'someUomGuid',
                value: 'Spray',
              },
              mixSize: {
                isPlaceholder: false,
                questionCode: 'MIX_SIZE',
                uomCode: 'someUomGuid',
                value: '1',
              },
              chemicals: [{
                entryType: 'exact',
                materialCategory: 'catalog',
                materialId: 1,
                targetinTimingCodes: ['A'],
              }],
              targetTimingCode: 'A',
            },
          ],
          treatmentNumber: 1,
        },
        {
          intents: [{
            applicationMethod: {
              isPlaceholder: true,
              questionCode: 'APP_MET',
              uomCode: 'someUomGuid',
              value: 'Spray',
            },
            mixSize: {
              isPlaceholder: false,
              questionCode: 'MIX_SIZE',
              uomCode: 'someUomGuid',
              value: '1',
            },
            chemicals: [{
              entryType: 'exact',
              materialCategory: 'catalog',
              materialId: 1,
              targetinTimingCodes: ['A'],
            }],
            targetTimingCode: 'A',
          }],
          treatmentNumber: 2,
        },
        {
          intents: [{
            applicationMethod: {
              isPlaceholder: true,
              questionCode: 'APP_MET',
              uomCode: 'someUomGuid',
              value: 'Spray',
            },
            mixSize: {
              isPlaceholder: false,
              questionCode: 'MIX_SIZE',
              uomCode: 'someUomGuid',
              value: '1',
            },
            chemicals: [{
              entryType: 'exact',
              materialCategory: 'catalog',
              materialId: 1,
              targetinTimingCodes: ['B'],
            }],
            targetTimingCode: 'B',
          }],
          treatmentNumber: 3,
        },
      ]

      const result = getUniqueIntentsWithTreatment(intentsByTreatment)

      expect(result).toEqual([
        {
          intent: {
            intentNumber: 1,
            applicationMethod: {
              isPlaceholder: true,
              questionCode: 'APP_MET',
              uomCode: 'someUomGuid',
              value: 'Spray',
            },
            mixSize: {
              isPlaceholder: false,
              questionCode: 'MIX_SIZE',
              uomCode: 'someUomGuid',
              value: '1',
            },
            chemicals: [{
              entryType: 'exact',
              materialCategory: 'catalog',
              materialId: 1,
              targetinTimingCodes: ['A'],
              chemicalGroupNumber: 1,
            }],
            targetTimingCode: 'A',
          },
          treatmentNumbers: [1, 2],
        },
        {
          intent: {
            intentNumber: 2,
            applicationMethod: {
              isPlaceholder: true,
              questionCode: 'APP_MET',
              uomCode: 'someUomGuid',
              value: 'Spray',
            },
            mixSize: {
              isPlaceholder: false,
              questionCode: 'MIX_SIZE',
              uomCode: 'someUomGuid',
              value: '1',
            },
            chemicals: [{
              entryType: 'exact',
              materialCategory: 'catalog',
              materialId: 1,
              targetinTimingCodes: ['B'],
              chemicalGroupNumber: 2,
            }],
            targetTimingCode: 'B',
          },
          treatmentNumbers: [3],
        },
      ])
    })

    test('separates out multiple intents for a treatment while maintaining the relationships', () => {
      const intentsByTreatment = [
        {
          intents: [
            {
              applicationMethod: {
                isPlaceholder: true,
                questionCode: 'APP_MET',
                uomCode: 'someUomGuid',
                value: 'Spray',
              },
              mixSize: {
                isPlaceholder: false,
                questionCode: 'MIX_SIZE',
                uomCode: 'someUomGuid',
                value: '1',
              },
              chemicals: [{
                entryType: 'exact',
                materialCategory: 'catalog',
                materialId: 1,
                targetinTimingCodes: ['A'],
              }],
              targetTimingCode: 'A',
            },
            {
              applicationMethod: {
                isPlaceholder: true,
                questionCode: 'APP_MET',
                uomCode: 'someUomGuid',
                value: 'Spray',
              },
              mixSize: {
                isPlaceholder: false,
                questionCode: 'MIX_SIZE',
                uomCode: 'someUomGuid',
                value: '1',
              },
              chemicals: [{
                entryType: 'exact',
                materialCategory: 'catalog',
                materialId: 1,
                targetinTimingCodes: ['B'],
              }],
              targetTimingCode: 'B',
            },
          ],
          treatmentNumber: 1,
        },
      ]

      const result = getUniqueIntentsWithTreatment(intentsByTreatment)

      expect(result).toEqual([
        {
          intent: {
            intentNumber: 1,
            applicationMethod: {
              isPlaceholder: true,
              questionCode: 'APP_MET',
              uomCode: 'someUomGuid',
              value: 'Spray',
            },
            mixSize: {
              isPlaceholder: false,
              questionCode: 'MIX_SIZE',
              uomCode: 'someUomGuid',
              value: '1',
            },
            chemicals: [{
              entryType: 'exact',
              materialCategory: 'catalog',
              materialId: 1,
              targetinTimingCodes: ['A'],
              chemicalGroupNumber: 1,
            }],
            targetTimingCode: 'A',
          },
          treatmentNumbers: [1],
        },
        {
          intent: {
            intentNumber: 2,
            applicationMethod: {
              isPlaceholder: true,
              questionCode: 'APP_MET',
              uomCode: 'someUomGuid',
              value: 'Spray',
            },
            mixSize: {
              isPlaceholder: false,
              questionCode: 'MIX_SIZE',
              uomCode: 'someUomGuid',
              value: '1',
            },
            chemicals: [{
              entryType: 'exact',
              materialCategory: 'catalog',
              materialId: 1,
              targetinTimingCodes: ['B'],
              chemicalGroupNumber: 1,
            }],
            targetTimingCode: 'B',
          },
          treatmentNumbers: [1],
        },
      ])
    })

    test('treats identical intents as distinct if chemicals are not in the same group', () => {
      const intentsByTreatment = [
        {
          intents: [
            {
              applicationMethod: {
                isPlaceholder: true,
                questionCode: 'APP_MET',
                uomCode: 'someUomGuid',
                value: 'Spray',
              },
              mixSize: {
                isPlaceholder: false,
                questionCode: 'MIX_SIZE',
                uomCode: 'someUomGuid',
                value: '1',
              },
              chemicals: [{
                entryType: 'exact',
                materialCategory: 'catalog',
                materialId: 1,
                targetinTimingCodes: ['A'],
              }],
              targetTimingCode: 'A',
            },
            {
              applicationMethod: {
                isPlaceholder: true,
                questionCode: 'APP_MET',
                uomCode: 'someUomGuid',
                value: 'Spray',
              },
              mixSize: {
                isPlaceholder: false,
                questionCode: 'MIX_SIZE',
                uomCode: 'someUomGuid',
                value: '1',
              },
              chemicals: [{
                entryType: 'exact',
                materialCategory: 'catalog',
                materialId: 1,
                targetinTimingCodes: ['B'],
              }],
              targetTimingCode: 'B',
            },
          ],
          treatmentNumber: 1,
        },
        {
          intents: [{
            applicationMethod: {
              isPlaceholder: true,
              questionCode: 'APP_MET',
              uomCode: 'someUomGuid',
              value: 'Spray',
            },
            mixSize: {
              isPlaceholder: false,
              questionCode: 'MIX_SIZE',
              uomCode: 'someUomGuid',
              value: '1',
            },
            chemicals: [{
              entryType: 'exact',
              materialCategory: 'catalog',
              materialId: 1,
              targetinTimingCodes: ['A'],
            }],
            targetTimingCode: 'A',
          }],
          treatmentNumber: 2,
        },
      ]

      const result = getUniqueIntentsWithTreatment(intentsByTreatment)

      expect(result.length).toBe(3)
      expect(result).toEqual([
        {
          intent: {
            intentNumber: 1,
            applicationMethod: {
              isPlaceholder: true,
              questionCode: 'APP_MET',
              uomCode: 'someUomGuid',
              value: 'Spray',
            },
            mixSize: {
              isPlaceholder: false,
              questionCode: 'MIX_SIZE',
              uomCode: 'someUomGuid',
              value: '1',
            },
            chemicals: [{
              entryType: 'exact',
              materialCategory: 'catalog',
              materialId: 1,
              targetinTimingCodes: ['A'],
              chemicalGroupNumber: 1,
            }],
            targetTimingCode: 'A',
          },
          treatmentNumbers: [1],
        },
        {
          intent: {
            intentNumber: 2,
            applicationMethod: {
              isPlaceholder: true,
              questionCode: 'APP_MET',
              uomCode: 'someUomGuid',
              value: 'Spray',
            },
            mixSize: {
              isPlaceholder: false,
              questionCode: 'MIX_SIZE',
              uomCode: 'someUomGuid',
              value: '1',
            },
            chemicals: [{
              entryType: 'exact',
              materialCategory: 'catalog',
              materialId: 1,
              targetinTimingCodes: ['B'],
              chemicalGroupNumber: 1,
            }],
            targetTimingCode: 'B',
          },
          treatmentNumbers: [1],
        },
        {
          intent: {
            intentNumber: 3,
            applicationMethod: {
              isPlaceholder: true,
              questionCode: 'APP_MET',
              uomCode: 'someUomGuid',
              value: 'Spray',
            },
            mixSize: {
              isPlaceholder: false,
              questionCode: 'MIX_SIZE',
              uomCode: 'someUomGuid',
              value: '1',
            },
            chemicals: [{
              entryType: 'exact',
              materialCategory: 'catalog',
              materialId: 1,
              targetinTimingCodes: ['A'],
              chemicalGroupNumber: 2,
            }],
            targetTimingCode: 'A',
          },
          treatmentNumbers: [2],
        },
      ])
    })
  })
})
