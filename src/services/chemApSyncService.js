import {
  groupBy,
  isEqual,
  sortBy,
  uniqWith,
} from 'lodash'
import { dbRead } from '../db/DbManager'
import HttpUtil from './utility/HttpUtil'
import OAuthUtil from './utility/OAuthUtil'
import configurator from '../configs/configurator'
import AppError from './utility/AppError'
import QuestionsUtil from './utility/QuestionsUtil'

const apiUrls = configurator.get('urls')
const { getFullErrorCode } = require('@monsantoit/error-decorator')()

const qandaTimingCode = 'APP_TIM'
const qandaAppRateTag = 'APP_RATE'
const chemicalQAndATags = [qandaAppRateTag]
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

const updateChemApPlan = async (planId, experiment, owner, chemicals, headers, requestId) => {
  const request = {
    chemicals,
    name: experiment.name,
    owners: owner.user_ids,
    ownerGroups: owner.group_ids,
    isTemplate: false,
  }
  try {
    return await HttpUtil.put(`${apiUrls.chemApAPIUrl}/plans/${planId}`, headers, request)
  } catch (error) {
    const message = `An error occurred to update a chemAp plan: ${planId}`
    console.error(`[[${requestId}]] ${message}`, error.message)
    throw AppError.internalServerError(message, undefined, getFullErrorCode('1G8001'))
  }
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
    combinationElements,
  ] = await Promise.all([
    dbRead.experiments.find(experimentId, false),
    dbRead.owner.findByExperimentId(experimentId),
    dbRead.factorPropertiesForLevel.findByExperimentId(experimentId),
    dbRead.factorLevelDetails.findByExperimentId(experimentId),
    dbRead.combinationElement.findByExperimentIdWithTreatmentNumber(experimentId),
  ])
  if (experimentData && ownerData && factorPropertyData && factorLevelDetailsData
    && combinationElements) {
    return [
      experimentData,
      ownerData,
      factorPropertyData,
      factorLevelDetailsData,
      combinationElements,
    ]
  }

  const message = `Experiment Not Found for requested experiment Id: ${experimentId}`
  console.error(`[[${requestId}]] ${message}`)
  throw AppError.notFound(message, undefined, getFullErrorCode('1G4001'))
}

const validateExperimentChemicalProperties = (factorProperties, requestId) => {
  if (!factorProperties.find((property) => property.object_type === 'Catalog' && property.material_type === 'CHEMICAL')) {
    const message = 'The experiment does not have any chemical data'
    console.error(`[[${requestId}]] ${message}`)
    throw AppError.badRequest(message, undefined, getFullErrorCode('1G5001'))
  }

  const unclearQAndATags = chemicalQAndATags.filter((tag) =>
    factorProperties.filter((property) => property.multi_question_tag === tag).length > 1)
  const unclearQAndACodes = chemicalQAndACodes.filter((code) =>
    factorProperties.filter((property) => property.question_code === code).length > 1)
  const unclearQAndAData = [...unclearQAndACodes, ...unclearQAndATags]

  if (unclearQAndAData.length > 0) {
    const message = `Unable to parse experiment data, the following QandA data is defined more than once: ${unclearQAndAData.join()}`
    console.error(`[[${requestId}]] ${message}`)
    throw AppError.badRequest(message, undefined, getFullErrorCode('1G5002'))
  }
}

const getTimingDescriptionFromDetail = (detail, timingUomMap) =>
  (detail.value_type === 'noTreatment' ? undefined
    : detail.text || timingUomMap[detail.uom_code][detail.value])

export const getUniqueTimings = (timingProperty, levelDetails, timingUomMap, requestId) => {
  if (!timingProperty) {
    return []
  }
  const timingDetails = levelDetails.filter((detail) =>
    detail.factor_properties_for_level_id === timingProperty.id)

  const sortedTimingDetails = sortBy(timingDetails, ['treatment_number', 'row_number'])

  const uniqueTimingDetails = uniqWith(sortedTimingDetails, (detail1, detail2) =>
    detail1.value === detail2.value && detail1.text === detail2.text)

  if (uniqueTimingDetails.length > 26) {
    const message = 'The experiment has too many unique timings. The maximum unique timings allowed is 26.'
    console.error(`[[${requestId}]] ${message}`)
    throw AppError.badRequest(message, undefined, getFullErrorCode('1G6001'))
  }

  return uniqueTimingDetails.map((detail, index) => ({
    code: String.fromCharCode(65 + index),
    description: getTimingDescriptionFromDetail(detail, timingUomMap),
  }))
}

const applyTimingCodesToChemicals = (baseChemicals, timingDetails, timingCodeMap, timingUomMap) => {
  const targetTimingCodes = timingDetails.map((detail) =>
    timingCodeMap.get(getTimingDescriptionFromDetail(detail, timingUomMap)))
  return baseChemicals.map((chemical) => ({
    ...chemical,
    targetTimingCodes,
  }))
}

const applyDetailRowToChemicals = (
  baseChemicals,
  chemicalDetail,
  appRateDetail,
  timingDetail,
  timingCodeMap,
  timingUomMap,
) => {
  if (chemicalDetail) {
    baseChemicals = baseChemicals.map((chemical) => ({
      ...chemical,
      entryType: chemicalDetail.value_type,
      materialCategory: chemicalDetail.value ? 'catalog' : undefined,
      materialId: chemicalDetail.value || undefined,
      placeholder: chemicalDetail.text || undefined,
    }))
  }

  if (appRateDetail) {
    baseChemicals = baseChemicals.map((chemical) => ({
      ...chemical,
      applicationRate: {
        questionCode: appRateDetail.question_code,
        value: appRateDetail.text,
        uomCode: appRateDetail.uom_code,
      },
    }))
  }

  if (timingDetail) {
    baseChemicals = applyTimingCodesToChemicals(baseChemicals, [timingDetail], timingCodeMap,
      timingUomMap)
  }
  return baseChemicals
}

const createChemicalsFromDetails = (
  baseChemicals,
  details,
  relevantProperties,
  timingCodeMap,
  timingUomMap,
) => {
  const timingDetails = details.filter((detail) =>
    detail.factor_properties_for_level_id === relevantProperties.timing.id
      && detail.value_type !== 'noTreatment')
  const chemicalDetails = details.filter((detail) =>
    detail.factor_properties_for_level_id === relevantProperties.chemical.id
      && detail.value_type !== 'noTreatment')
  const appRateDetails = details.filter((detail) =>
    detail.factor_properties_for_level_id === relevantProperties.applicationRate.id
      && detail.value_type !== 'noTreatment')

  if (chemicalDetails.length > 1 || appRateDetails.length > 1) {
    const detailsToLoopThrough = chemicalDetails.length === 0 ? appRateDetails : chemicalDetails
    return sortBy(detailsToLoopThrough, 'row_number').flatMap((loopingDetail) => {
      const rowNumber = loopingDetail.row_number
      const chemicalDetail = chemicalDetails.find((detail) => detail.row_number === rowNumber)
      const appRateDetail = appRateDetails.find((detail) => detail.row_number === rowNumber)
      const timingDetail = timingDetails.find((detail) => detail.row_number === rowNumber)

      return applyDetailRowToChemicals(baseChemicals, chemicalDetail, appRateDetail, timingDetail,
        timingCodeMap, timingUomMap)
    })
  }
  if (chemicalDetails.length === 1 || appRateDetails.length === 1) {
    const chemicalDetail = chemicalDetails[0]
    const appRateDetail = appRateDetails[0]
    const timingDetail = timingDetails[0]

    return applyDetailRowToChemicals(baseChemicals, chemicalDetail, appRateDetail, timingDetail,
      timingCodeMap, timingUomMap)
  }
  if (timingDetails.length > 0) {
    const sortedTimingDetails = sortBy(timingDetails, 'row_number')
    return applyTimingCodesToChemicals(baseChemicals, sortedTimingDetails, timingCodeMap,
      timingUomMap)
  }
  return baseChemicals
}

const createTreatmentsFromCombinationElements = (combinationElements, factorLevelDetailsMap) =>
  combinationElements.reduce((agg, ce) => {
    const existingTreatment = agg.find((treatment) =>
      treatment.treatmentNumber === ce.treatment_number)
    const factorLevel = factorLevelDetailsMap[ce.factor_level_id]
    if (existingTreatment) {
      existingTreatment.factorLevels.push(factorLevel)
      return agg
    }
    return [
      ...agg,
      {
        treatmentNumber: ce.treatment_number,
        factorLevels: [factorLevel],
      },
    ]
  }, [])

export const getChemicalsWithGroups = (
  factorLevelDetails,
  factorPropertyData,
  combinationElements,
  uniqueTimings,
  timingUomMap,
  timingProperty,
) => {
  const factorLevelDetailsMap = groupBy(factorLevelDetails, (detail) => detail.factor_level_id)
  const timingCodeMap = new Map()
  uniqueTimings.forEach((timing) => timingCodeMap.set(timing.description, timing.code))
  const treatments = createTreatmentsFromCombinationElements(combinationElements,
    factorLevelDetailsMap)
  const sortedTreatments = sortBy(treatments, 'treatmentNumber')

  const applicationRateProperty = factorPropertyData.find((prop) =>
    prop.multi_question_tag === qandaAppRateTag)
  const chemicalProperty = factorPropertyData.find((property) =>
    property.object_type === 'Catalog' && property.material_type === 'CHEMICAL')
  const relevantProperties = {
    applicationRate: applicationRateProperty,
    chemical: chemicalProperty,
    timing: timingProperty,
  }

  const factorLevelsToChemicalsReducer = (currentChemicals, levelDetails) =>
    createChemicalsFromDetails(currentChemicals, levelDetails, relevantProperties, timingCodeMap,
      timingUomMap)
  const chemicalsForTreatments = sortedTreatments.map((treatment) =>
    treatment.factorLevels.reduce(factorLevelsToChemicalsReducer, [{}]))

  const uniqueChemicalGroups = uniqWith(chemicalsForTreatments, isEqual)
  return uniqueChemicalGroups.flatMap((chemicals, index) => chemicals.map((chemical) => {
    chemical.chemicalGroupNumber = index + 1
    return chemical
  }))
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

export const createAndSyncChemApPlanFromExperiment = async (body, context) => {
  const [
    experimentData,
    ownerData,
    factorPropertyData,
    factorLevelDetailsData,
    combinationElements,
  ] = await getExperimentData(body.experimentId, context.requestId)
  const questionPromise = getTimingQuestionUoms()

  validateExperimentChemicalProperties(factorPropertyData, context.requestId)

  const header = await OAuthUtil.getAuthorizationHeaders()
  const headers = [...header, { headerName: 'username', headerValue: context.userId }]

  const timingUomMap = await questionPromise
  const timingProperty = factorPropertyData.find((prop) => prop.question_code === qandaTimingCode)
  const uniqueTimings = getUniqueTimings(timingProperty, factorLevelDetailsData, timingUomMap,
    context.requestId)

  const chemicalsWithGroups = getChemicalsWithGroups(factorLevelDetailsData, factorPropertyData,
    combinationElements, uniqueTimings, timingUomMap, timingProperty)

  const planId = await createChemApPlan(experimentData, ownerData, headers, context.requestId)
  try {
    await Promise.all([
      createPlanAssociation(planId, body.experimentId, headers, context.requestId),
      createPlanTimings(planId, uniqueTimings, headers, context.requestId),
    ])
    await updateChemApPlan(planId, experimentData, ownerData, chemicalsWithGroups, headers,
      context.requestId)
  } catch (error) {
    await deleteChemApPlan(planId, headers, context.requestId)
    throw (error)
  }

  return { planId }
}

export default createAndSyncChemApPlanFromExperiment
