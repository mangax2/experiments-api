import createAndSyncChemApPlanFromExperiment from '../../src/services/chemApSyncService'
import AppError from '../../src/services/utility/AppError'
import apiUrls from '../../src/config/apiUrls'
import HttpUtil from '../../src/services/utility/HttpUtil'
import OAuthUtil from '../../src/services/utility/OAuthUtil'
import { dbRead } from '../../src/db/DbManager'
import { mockResolve } from '../jestUtil'

jest.mock('../../src/services/SecurityService')
jest.mock('../../src/services/utility/OAuthUtil')
jest.mock('../../src/services/utility/HttpUtil')

describe('ChemApSyncService', () => {
  beforeEach(() => {
    apiUrls.chemApAPIUrl = 'chemApAPIUrl'
    dbRead.experiments.find = mockResolve({ name: 'test' })
    dbRead.owner.findByExperimentId = mockResolve({ user_ids: ['tester'], group_ids: [] })
    OAuthUtil.getAuthorizationHeaders = mockResolve([])
    AppError.internalServerError = jest.fn()
    AppError.notFound = jest.fn()
  })

  test('should fail when experiment does not exist', async () => {
    dbRead.experiments.find = mockResolve(null)
    try {
      await createAndSyncChemApPlanFromExperiment({ experimentId: 1 }, { userId: 'tester1' })
      // eslint-disable-next-line no-empty
    } catch (e) {}
    expect(AppError.notFound).toHaveBeenCalledWith('Experiment Not Found for requested experiment Id: 1', undefined, '1G4001')
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
    HttpUtil.post.mockReturnValueOnce(Promise.reject())
    try {
      await createAndSyncChemApPlanFromExperiment({ experimentId: 1 }, { userId: 'tester1' })
      // eslint-disable-next-line no-empty
    } catch (error) {}
    expect(AppError.internalServerError).toHaveBeenCalledWith('An error occurred to create a chemical application plan', undefined, '1G1001')
  })

  test('when chemAp plan fails to be associated with an experiment, plan is deleted', async () => {
    HttpUtil.post.mockReturnValueOnce(Promise.resolve({ body: { id: 123 } }))
      .mockReturnValueOnce(Promise.reject())
    try {
      await createAndSyncChemApPlanFromExperiment({ experimentId: 1 }, { userId: 'tester1' })
      // eslint-disable-next-line no-empty
    } catch (error) {}
    expect(AppError.internalServerError).toHaveBeenCalledWith('An error occurred to create a plan association for plan 123 and experiment 1', undefined, '1G2001')
    expect(HttpUtil.delete).toHaveBeenCalledWith('chemApAPIUrl/plans/123', [{ headerName: 'username', headerValue: 'tester1' }])
  })

  test('when chemAp plan fails to be associated with an experiment and failed to delete', async () => {
    HttpUtil.post.mockReturnValueOnce(Promise.resolve({ body: { id: 123 } }))
      .mockReturnValueOnce(Promise.reject())
    HttpUtil.delete.mockReturnValueOnce(Promise.reject())
    try {
      await createAndSyncChemApPlanFromExperiment({ experimentId: 1 }, { userId: 'tester1' })
      // eslint-disable-next-line no-empty
    } catch (error) {}
    expect(AppError.internalServerError).toHaveBeenCalledWith('An error occurred to delete a chemAp plan: 123', undefined, '1G3001')
    expect(HttpUtil.delete).toHaveBeenCalledWith('chemApAPIUrl/plans/123', [{ headerName: 'username', headerValue: 'tester1' }])
  })
})
