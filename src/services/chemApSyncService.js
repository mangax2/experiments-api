import { sortBy, uniqWith } from 'lodash'
import { dbRead } from '../db/DbManager'
import HttpUtil from './utility/HttpUtil'
import OAuthUtil from './utility/OAuthUtil'
import configurator from '../configs/configurator'
import AppError from './utility/AppError'
import QuestionsUtil from './utility/QuestionsUtil'

const apiUrls = configurator.get('urls')
const { getFullErrorCode } = require('@monsantoit/error-decorator')()

const qandaTimingCode = 'APP_TIM'
const chemicalQAndATags = ['APP_RATE']
const chemicalQAndACodes = [qandaTimingCode, 'APP_MET']

const sendApiPostRequest = async (url, headers, request, errorMsg, errorCode, requestId) => {
  try {
    return await HttpUtil.post(`${apiUrls.chemApAPIUrl}${url}`, headers, request)
  } catch (error) {
    console.error(`[[${requestId}]] ${errorMsg}`, errorCode, error.message)
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
    console.error(`[[${requestId}]] ${message}`, error.message)
    throw AppError.internalServerError(message, undefined, getFullErrorCode('1G3001'))
  }
}

const createPlanTimings = async (planId, targetTimings, headers, requestId) => {
  if (targetTimings.length === 0) {
    return {}
  }
  try {
    return await HttpUtil.put(`${apiUrls.chemApAPIUrl}/target-timings?planId=${planId}`, headers, targetTimings)
  } catch (error) {
    const message = `An error occurred while creating target timings for planId ${planId}`
    console.error(`[[${requestId}]] ${message}`, error.message)
    throw AppError.internalServerError(message, undefined, getFullErrorCode('1G7001'))
  }
}

const getExperimentData = async (experimentId, requestId) => {
  const [
    experimentData,
    ownerData,
    factorPropertyData,
    factorLevelDetailsData,
  ] = await Promise.all([
    dbRead.experiments.find(experimentId, false),
    dbRead.owner.findByExperimentId(experimentId),
    dbRead.factorPropertiesForLevel.findByExperimentId(experimentId),
    dbRead.factorLevelDetails.findByExperimentId(experimentId),
  ])
  if (experimentData && ownerData && factorPropertyData && factorLevelDetailsData) {
    return [experimentData, ownerData, factorPropertyData, factorLevelDetailsData]
  }

  const message = `Experiment Not Found for requested experiment Id: ${experimentId}`
  console.error(`[[${requestId}]] ${message}`)
  throw AppError.notFound(message, undefined, getFullErrorCode('1G4001'))
}

const validateExperimentChemicalProperties = (factorProperties, requestId) => {
  if (!factorProperties.find(property => property.object_type === 'Catalog' && property.catalog_type === 'CHEMICAL')) {
    const message = 'The experiment does not have any chemical data'
    console.error(`[[${requestId}]] ${message}`)
    throw AppError.badRequest(message, undefined, getFullErrorCode('1G5001'))
  }

  const unclearQAndATags = chemicalQAndATags.filter(tag =>
    factorProperties.filter(property => property.multi_question_tag === tag).length > 1)
  const unclearQAndACodes = chemicalQAndACodes.filter(code =>
    factorProperties.filter(property => property.question_code === code).length > 1)
  const unclearQAndAData = [...unclearQAndACodes, ...unclearQAndATags]

  if (unclearQAndAData.length > 0) {
    const message = `Unable to parse experiment data, the following QandA data is defined more than once: ${unclearQAndAData.join()}`
    console.error(`[[${requestId}]] ${message}`)
    throw AppError.badRequest(message, undefined, getFullErrorCode('1G5002'))
  }
}

export const getUniqueTimings = (factorProperties, levelDetails, timingUomMap, requestId) => {
  const timingProperty = factorProperties.find(prop => prop.question_code === qandaTimingCode)
  if (!timingProperty) {
    return []
  }
  const timingDetails = levelDetails.filter(detail =>
    detail.factor_properties_for_level_id === timingProperty.id)

  const sortedTimingDetails = sortBy(timingDetails, ['treatment_number', 'row_number'])

  const uniqueTimingDetails = uniqWith(sortedTimingDetails, (detail1, detail2) =>
    detail1.value === detail2.value && detail1.text === detail2.text)

  if (uniqueTimingDetails.length > 26) {
    const message = 'The experiment has too many unique timings. The maximum unique timings allowed is 26.'
    console.error(`[[${requestId}]] ${message}`)
    throw AppError.badRequest(message, undefined, getFullErrorCode('1G6001'))
  }

  return uniqueTimingDetails.map((detail, index) => {
    const code = String.fromCharCode(65 + index)
    if (detail.value_type === 'noTreatment') {
      return { code }
    }
    return {
      code,
      description: detail.text || timingUomMap[detail.uom_code][detail.value],
    }
  })
}

export const getTimingQuestionUoms = async () => {
  const timingQuestion = await QuestionsUtil.getCompleteQuestion(qandaTimingCode)
  return timingQuestion.uoms.reduce((uomMapper, uom) => {
    uomMapper[uom.code] = (uom.validation?.rule?.values || []).reduce((valueMapper, value) => {
      valueMapper[value.key] = value.value
      return valueMapper
    }, {})
    return uomMapper
  }, {})
}

const createAndSyncChemApPlanFromExperiment = async (body, context) => {
  const [
    experimentData,
    ownerData,
    factorPropertyData,
    factorLevelDetailsData,
  ] = await getExperimentData(body.experimentId, context.requestId)
  const questionPromise = getTimingQuestionUoms()

  validateExperimentChemicalProperties(factorPropertyData, context.requestId)

  const header = await OAuthUtil.getAuthorizationHeaders()
  const headers = [...header, { headerName: 'username', headerValue: context.userId }]

  const timingUomMap = await questionPromise
  const uniqueTimings = getUniqueTimings(factorPropertyData, factorLevelDetailsData, timingUomMap,
    context.requestId)

  const planId = await createChemApPlan(experimentData, ownerData, headers, context.requestId)
  try {
    await Promise.all([
      createPlanAssociation(planId, body.experimentId, headers, context.requestId),
      createPlanTimings(planId, uniqueTimings, headers, context.requestId),
    ])
  } catch (error) {
    await deleteChemApPlan(planId, headers, context.requestId)
    throw (error)
  }

  return { planId }
}

export { createAndSyncChemApPlanFromExperiment as default }
