import createAndSyncChemApPlanFromExperiment, {
  getTimingQuestionUoms,
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

const questionComplete = {
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
      { object_type: 'Catalog', catalog_type: 'CHEMICAL' },
      { id: 6, question_code: 'APP_TIM' },
    ])
    OAuthUtil.getAuthorizationHeaders = mockResolve([])
    AppError.internalServerError = mock()
    AppError.notFound = mock()
    AppError.badRequest = mock()
    QuestionsUtil.getCompleteQuestion = mockResolve(questionComplete)
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
      { object_type: 'Catalog', catalog_type: 'CHEMICAL' },
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

    expect(HttpUtil.put).toHaveBeenCalled()
  })

  test('does not save target timings when there are no timings to save', async () => {
    dbRead.factorLevelDetails.findByExperimentId = mockResolve([])
    HttpUtil.post.mockReturnValueOnce(Promise.resolve({ body: { id: 123 } }))
      .mockReturnValueOnce(Promise.resolve({}))
    HttpUtil.put = mockResolve()

    await createAndSyncChemApPlanFromExperiment({ experimentId: 1 }, { userId: 'tester1' })

    expect(HttpUtil.put).not.toHaveBeenCalled()
  })

  describe('getTimingQuestionUoms', () => {
    test('converts the multiple choice answers from uoms of the question into a map', async () => {
      const map = await getTimingQuestionUoms()

      expect(map).toEqual(timingUomMap)
    })
  })

  describe('getUniqueTimings', () => {
    const factorProperties = [
      { id: 2, question_code: 'APP_MET' },
      { id: 6, question_code: 'APP_TIM' },
      { id: 4, object_type: 'Catalog' },
    ]
    const requestId = '12345'

    test('returns an empty array if there is no timing property', () => {
      const levelDetails = []

      const result = getUniqueTimings([], levelDetails, timingUomMap, requestId)

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
        getUniqueTimings(factorProperties, levelDetails, timingUomMap, requestId)
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

      const result = getUniqueTimings(factorProperties, levelDetails, timingUomMap, requestId)

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

      const result = getUniqueTimings(factorProperties, levelDetails, timingUomMap, requestId)

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

      const result = getUniqueTimings(factorProperties, levelDetails, timingUomMap, requestId)

      expect(result).toEqual([
        { code: 'A' },
        { code: 'B', description: '2' },
        { code: 'C', description: '3' },
        { code: 'D', description: 'Flowering' },
      ])
    })
  })
})
