import SecurityService from './SecurityService'
import { dbRead } from '../db/DbManager'
import HttpUtil from './utility/HttpUtil'
import OAuthUtil from './utility/OAuthUtil'
import apiUrls from '../config/apiUrls'
import AppError from './utility/AppError'

const { getFullErrorCode } = require('@monsantoit/error-decorator')()

const sendApiPostRequest = async (url, headers, request, errorMsg, errorCode) => {
  try {
    return await HttpUtil.post(`${apiUrls.chemApAPIUrl}${url}`, headers, request)
  } catch (error) {
    throw AppError.internalServerError(errorMsg, undefined, getFullErrorCode(errorCode))
  }
}

const createChemApPlan = async (experiment, owner, headers) => {
  const request = {
    name: experiment.name,
    owners: owner.user_ids,
    ownerGroups: owner.group_ids,
    isTemplate: false,
  }

  const errorMsg = 'An error occurred to create a chemical application plan'
  const result = await sendApiPostRequest('/plans', headers, request, errorMsg, '1G1001')
  return result.body.id
}

const createPlanAssociation = async (planId, experimentId, headers) => {
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
  await sendApiPostRequest('/plan-associations', headers, request, message, '1G2001')
}

const deleteChemApPlan = async (planId, headers) => {
  try {
    return await HttpUtil.delete(`${apiUrls.chemApAPIUrl}/plans/${planId}`, headers)
  } catch (error) {
    const message = `An error occurred to delete a chemAp plan: ${planId}`
    throw AppError.internalServerError(message, undefined, getFullErrorCode('1G3001'))
  }
}

const createAndSyncChemApPlanFromExperiment = async (body, context) => {
  await new SecurityService().permissionsCheck(body.experimentId, context, false)

  const [experimentData, ownerData] = await Promise.all([
    dbRead.experiments.find(body.experimentId, false),
    dbRead.owner.findByExperimentId(body.experimentId),
  ])

  const header = await OAuthUtil.getAuthorizationHeaders()
  const headers = [...header, { headerName: 'username', headerValue: context.userId }]

  const planId = await createChemApPlan(experimentData, ownerData, headers)
  try {
    await createPlanAssociation(planId, body.experimentId, headers)
  } catch (error) {
    await deleteChemApPlan(planId, headers)
    throw (error)
  }

  return { planId }
}

export { createAndSyncChemApPlanFromExperiment as default }
