import { dbRead } from '../db/DbManager'
import HttpUtil from './utility/HttpUtil'
import OAuthUtil from './utility/OAuthUtil'
import apiUrls from '../config/apiUrls'
import AppError from './utility/AppError'

const { getFullErrorCode } = require('@monsantoit/error-decorator')()

const sendApiPostRequest = async (url, headers, request, errorMsg, errorCode, requestId) => {
  try {
    return await HttpUtil.post(`${apiUrls.chemApAPIUrl}${url}`, headers, request)
  } catch (error) {
    console.error(`[[${requestId}]] ${errorMsg}`, errorCode, error)
    throw AppError.internalServerError(errorMsg, undefined, getFullErrorCode(errorCode))
  }
}

const createChemApPlan = async (experiment, owner, headers, requestId) => {
  const request = {
    name: experiment.name,
    owners: owner.user_ids,
    ownerGroups: owner.group_ids,
    isTemplate: false,
  }

  const errorMsg = 'An error occurred to create a chemical application plan'
  const result = await sendApiPostRequest('/plans', headers, request, errorMsg, '1G1001', requestId)
  return result.body.id
}

const createPlanAssociation = async (planId, experimentId, headers, requestId) => {
  const request =
    [
      {
        planId,
        externalEntity: 'experiment',
        externalEntityId: experimentId,
        isSource: true,
      },
    ]

  const message = `An error occurred to create a plan association for plan ${planId} and experiment ${experimentId}`
  await sendApiPostRequest('/plan-associations', headers, request, message, '1G2001', requestId)
}

const deleteChemApPlan = async (planId, headers, requestId) => {
  try {
    return await HttpUtil.delete(`${apiUrls.chemApAPIUrl}/plans/${planId}`, headers)
  } catch (error) {
    const message = `An error occurred to delete a chemAp plan: ${planId}`
    console.error(`[[${requestId}]] ${message}`, error)
    throw AppError.internalServerError(message, undefined, getFullErrorCode('1G3001'))
  }
}

const getExperimentData = async (experimentId, requestId) => {
  const [experimentData, ownerData] = await Promise.all([
    dbRead.experiments.find(experimentId, false),
    dbRead.owner.findByExperimentId(experimentId),
  ])
  if (experimentData && ownerData) {
    return [experimentData, ownerData]
  }

  const message = `Experiment Not Found for requested experiment Id: ${experimentId}`
  console.error(`[[${requestId}]] ${message}`)
  throw AppError.notFound(message, undefined, getFullErrorCode('1G4001'))
}

const createAndSyncChemApPlanFromExperiment = async (body, context) => {
  const [experimentData, ownerData] = await getExperimentData(body.experimentId, context.requestId)

  const header = await OAuthUtil.getAuthorizationHeaders()
  const headers = [...header, { headerName: 'username', headerValue: context.userId }]

  const planId = await createChemApPlan(experimentData, ownerData, headers, context.requestId)
  try {
    await createPlanAssociation(planId, body.experimentId, headers, context.requestId)
  } catch (error) {
    await deleteChemApPlan(planId, headers, context.requestId)
    throw (error)
  }

  return { planId }
}

export { createAndSyncChemApPlanFromExperiment as default }
