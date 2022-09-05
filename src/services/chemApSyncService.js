import {
  cloneDeep,
  differenceWith,
  groupBy,
  isEqual,
  omit,
  sortBy,
  uniq,
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
const qandaAppMethodCode = 'APP_MET'
const qandaAppVolumeTag = 'APP_VOL'
const qandaMixSizeTag = 'MIX_SIZE'
const qandaAppPlacementCode = 'APPPLCT'
const qandaAppPlacementDetailCode = 'APPPLCDT'
const qandaAppEquipmentCode = 'APP_EQUIP'
const chemicalQAndATags = [
  qandaAppRateTag,
  qandaAppVolumeTag,
  qandaMixSizeTag,
]
const chemicalQAndACodes = [
  qandaTimingCode,
  qandaAppMethodCode,
  qandaAppPlacementCode,
  qandaAppPlacementDetailCode,
  qandaAppEquipmentCode,
]

export const getErrorFromChemAP = (err) => {
  if (err.response) {
    if (err.response.body && !isEqual(err.response.body, {})) {
      return err.response.body
    }
    return `${err.response.statusCode}: ${err.response.text}`
  }
  if (err.message) {
    return err.message
  }
  return err
}

const sendApiPostRequest = async (url, headers, request, errorMsg, errorCode, requestId) => {
  try {
    return await HttpUtil.post(`${apiUrls.chemApAPIUrl}${url}`, headers, request)
  } catch (error) {
    console.error(`[[${requestId}]] ${errorMsg}`, errorCode, getErrorFromChemAP(error))
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

const updateChemApPlan = async (planId, experiment, owner, intents, headers, requestId) => {
  const request = {
    intents,
    name: experiment.name,
    owners: owner.user_ids,
    ownerGroups: owner.group_ids,
    isTemplate: false,
  }
  try {
    return await HttpUtil.put(`${apiUrls.chemApAPIUrl}/plans/${planId}`, headers, request)
  } catch (error) {
    const message = `An error occurred to update a chemAp plan: ${planId}`
    console.error(`[[${requestId}]] ${message}`, getErrorFromChemAP(error))
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

const getChemApPlan = async (planId, headers, requestId) => {
  try {
    const response = await HttpUtil.getWithRetry(`${apiUrls.chemApAPIUrl}/plans/${planId}?includeIncomplete=true`, headers)
    return response.body
  } catch (error) {
    const message = `An error occurred while retrieving chemAp plan: ${planId}`
    console.error(`[[${requestId}]] ${message}`, getErrorFromChemAP(error))
    throw AppError.internalServerError(message, undefined, getFullErrorCode('1GA001'))
  }
}

export const createIntentAssociations = async (
  planId,
  intentsWithTreatments,
  headers,
  requestId,
) => {
  const { intents } = await getChemApPlan(planId, headers, requestId)
  const associations = intents.flatMap(intent => {
    const matchingIntentTreatment = intentsWithTreatments.find(intentWithTreatment =>
      intentWithTreatment.intent.intentNumber === intent.intentNumber)
    return matchingIntentTreatment.treatmentIds.map(treatmentId => ({
      intentId: intent.id,
      externalEntity: 'treatment',
      externalEntityId: treatmentId,
      isSource: true,
    }))
  })

  const message = `An error occurred to create intent associations for plan ${planId}`
  await sendApiPostRequest('/intent-associations', headers, associations, message, '1G9001', requestId)
}

const deleteChemApPlan = async (planId, headers, requestId) => {
  try {
    return await HttpUtil.delete(`${apiUrls.chemApAPIUrl}/plans/${planId}`, headers)
  } catch (error) {
    const message = `An error occurred to delete a chemAp plan: ${planId}`
    console.error(`[[${requestId}]] ${message}`, getErrorFromChemAP(error))
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
    console.error(`[[${requestId}]] ${message}`, getErrorFromChemAP(error))
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
    factorProperties.filter((property) => property.multi_question_tag === tag && property.object_type === 'QandAV3').length > 1)
  const unclearQAndACodes = chemicalQAndACodes.filter((code) =>
    factorProperties.filter((property) => property.question_code === code && property.object_type === 'QandAV3').length > 1)
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

const convertQandaDetail = (detail, questionCode) => ({
  isPlaceholder: detail.value_type === 'placeholder',
  questionCode: questionCode || detail.question_code,
  uomCode: detail.uom_code,
  value: detail.value || detail.text,
})

const applyDetailRowToIntents = (
  baseIntents,
  methodDetail,
  volumeDetail,
  mixSizeDetail,
  equipmentDetail,
  placementDetail,
  placementDetailDetail,
  chemicalDetail,
  appRateDetail,
  timingDetail,
  timingCodeMap,
  timingUomMap,
) => {
  if (methodDetail) {
    baseIntents = baseIntents.map((intent) => ({
      ...intent,
      applicationMethod: convertQandaDetail(methodDetail, qandaAppMethodCode),
    }))
  }

  if (volumeDetail) {
    baseIntents = baseIntents.map((intent) => ({
      ...intent,
      applicationVolume: convertQandaDetail(volumeDetail),
    }))
  }

  if (mixSizeDetail) {
    baseIntents = baseIntents.map((intent) => ({
      ...intent,
      mixSize: convertQandaDetail(mixSizeDetail),
    }))
  }

  if (equipmentDetail) {
    baseIntents = baseIntents.map((intent) => ({
      ...intent,
      applicationEquipment: convertQandaDetail(equipmentDetail, qandaAppEquipmentCode),
    }))
  }

  if (placementDetail) {
    baseIntents = baseIntents.map((intent) => ({
      ...intent,
      applicationPlacement: convertQandaDetail(placementDetail, qandaAppPlacementCode),
    }))
  }

  if (placementDetailDetail) {
    baseIntents = baseIntents.map((intent) => ({
      ...intent,
      applicationPlacementDetails: convertQandaDetail(placementDetailDetail,
        qandaAppPlacementDetailCode),
    }))
  }

  if (chemicalDetail || appRateDetail || timingDetail) {
    baseIntents.forEach((intent) => {
      intent.chemicals = intent.chemicals || [{}]
    })

    if (chemicalDetail) {
      baseIntents = baseIntents.map((intent) => ({
        ...intent,
        chemicals: intent.chemicals.map((chemical) => ({
          ...chemical,
          entryType: chemicalDetail.value_type,
          materialCategory: chemicalDetail.value ? 'catalog' : undefined,
          materialId: chemicalDetail.value || undefined,
          placeholder: chemicalDetail.text || undefined,
        })),
      }))
    }

    if (appRateDetail) {
      baseIntents = baseIntents.map((intent) => ({
        ...intent,
        chemicals: intent.chemicals.map((chemical) => ({
          ...chemical,
          applicationRate: convertQandaDetail(appRateDetail),
        })),
      }))
    }

    if (timingDetail) {
      const targetTimingCode =
        timingCodeMap.get(getTimingDescriptionFromDetail(timingDetail, timingUomMap))
      baseIntents = baseIntents.map((intent) => ({
        ...intent,
        targetTimingCode,
        chemicals: intent.chemicals.map((chemical) => ({
          ...chemical,
          targetTimingCodes: [targetTimingCode],
        })),
      }))
    }
  }

  return baseIntents
}

const filterByPropertyGenerator = (property) => (detail) =>
  detail.factor_properties_for_level_id === property?.id
  && detail.value_type !== 'noTreatment'

const createIntentsFromDetails = (
  baseIntents,
  details,
  relevantProperties,
  timingCodeMap,
  timingUomMap,
) => {
  const timingDetails = details.filter(filterByPropertyGenerator(relevantProperties.timing))
  const chemicalDetails = details.filter(filterByPropertyGenerator(relevantProperties.chemical))
  const appRateDetails = details.filter(filterByPropertyGenerator(
    relevantProperties.applicationRate))
  const appMethodDetails = details.filter(filterByPropertyGenerator(
    relevantProperties.applicationMethod))
  const appVolumeDetails = details.filter(filterByPropertyGenerator(
    relevantProperties.applicationVolume))
  const mixSizeDetails = details.filter(filterByPropertyGenerator(relevantProperties.mixSize))
  const appPlacementDetails = details.filter(filterByPropertyGenerator(
    relevantProperties.applicationPlacement))
  const appPlacementDetailDetails = details.filter(filterByPropertyGenerator(
    relevantProperties.applicationPlacementDetails))
  const appEquipmentDetails = details.filter(filterByPropertyGenerator(
    relevantProperties.applicationEquipment))

  const allRowNumbers = uniq([
    appMethodDetails,
    appVolumeDetails,
    mixSizeDetails,
    appPlacementDetails,
    appPlacementDetailDetails,
    appEquipmentDetails,
    chemicalDetails,
    appRateDetails,
    timingDetails,
  ].filter(array => array.length > 0)
    .flatMap(array => array.map(detail => detail.row_number)))
    .sort()

  if (allRowNumbers.length > 0) {
    return allRowNumbers.flatMap((rowNumber) => {
      const findByRowNumber = detail => detail.row_number === rowNumber
      const appMethodDetail = appMethodDetails.find(findByRowNumber)
      const appVolumeDetail = appVolumeDetails.find(findByRowNumber)
      const mixSizeDetail = mixSizeDetails.find(findByRowNumber)
      const appPlacementDetail = appPlacementDetails.find(findByRowNumber)
      const appPlacementDetailDetail = appPlacementDetailDetails.find(findByRowNumber)
      const appEquipmentDetail = appEquipmentDetails.find(findByRowNumber)
      const chemicalDetail = chemicalDetails.find((detail) => detail.row_number === rowNumber)
      const appRateDetail = appRateDetails.find((detail) => detail.row_number === rowNumber)
      const timingDetail = timingDetails.find(findByRowNumber)

      return applyDetailRowToIntents(
        baseIntents,
        appMethodDetail,
        appVolumeDetail,
        mixSizeDetail,
        appEquipmentDetail,
        appPlacementDetail,
        appPlacementDetailDetail,
        chemicalDetail,
        appRateDetail,
        timingDetail,
        timingCodeMap,
        timingUomMap)
    })
  }
  return baseIntents
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
        treatmentId: ce.treatment_id,
        treatmentNumber: ce.treatment_number,
        factorLevels: [factorLevel],
      },
    ]
  }, [])

const collapseChemicals = (intent) => {
  const chemicals = intent.chemicals || []
  const uniqueChemicals = chemicals.reduce((chemicalArray, chemical) => {
    const matchedChemical = chemicalArray.find(uniqueChemical =>
      isEqual(omit(uniqueChemical, ['targetTimingCodes']), omit(chemical, ['targetTimingCodes'])))
    if (matchedChemical) {
      matchedChemical.targetTimingCodes = [
        ...(matchedChemical.targetTimingCodes),
        ...(chemical.targetTimingCodes),
      ]
      return chemicalArray
    }
    return [
      ...chemicalArray,
      chemical,
    ]
  }, [])
  uniqueChemicals.forEach((chemical) => {
    chemical.targetTimingCodes = uniq(chemical.targetTimingCodes)
  })
  intent.chemicals = uniqueChemicals
}

const applyTimingsToChemicalsAcrossIntents = (intents) => {
  const chemicals = intents.flatMap(intent => intent.chemicals || [])
    .reduce((chemicalArray, chemical) => {
      const matchedChemical = chemicalArray.find(uniqueChemical =>
        isEqual(omit(uniqueChemical.key, ['targetTimingCodes']), omit(chemical, ['targetTimingCodes'])))
      if (matchedChemical) {
        matchedChemical.chemicals.push(chemical)
        return chemicalArray
      }
      return [
        ...chemicalArray,
        {
          key: chemical,
          chemicals: [chemical],
        },
      ]
    }, [])
  chemicals.forEach((chemicalSet) => {
    const targetTimingCodes = uniq(chemicalSet.chemicals.flatMap(chemical =>
      chemical.targetTimingCodes || []))
    chemicalSet.chemicals.forEach((chemical) => {
      chemical.targetTimingCodes = targetTimingCodes
    })
  })
}

const collapseIntents = (intents) => {
  const uniqueIntents = intents.reduce((intentArray, intent) => {
    const matchedIntent = intentArray.find(uniqueIntent =>
      isEqual(omit(uniqueIntent, ['chemicals']), omit(intent, ['chemicals'])))
    if (matchedIntent) {
      matchedIntent.chemicals = [...(matchedIntent.chemicals), ...(intent.chemicals)]
      return intentArray
    }
    return [
      ...intentArray,
      intent,
    ]
  }, [])
  uniqueIntents.forEach(collapseChemicals)
  applyTimingsToChemicalsAcrossIntents(uniqueIntents)
  return uniqueIntents
}

export const getIntentsForTreatments = (
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

  const findByQandaCode = qandaCode => factorPropertyData.find((prop) =>
    prop.question_code === qandaCode && prop.object_type === 'QandAV3')
  const findByQandaTag = qandaTag => factorPropertyData.find((prop) =>
    prop.multi_question_tag === qandaTag && prop.object_type === 'QandAV3')
  const chemicalProperty = factorPropertyData.find((property) =>
    property.object_type === 'Catalog' && property.material_type === 'CHEMICAL')
  const relevantProperties = {
    applicationEquipment: findByQandaCode(qandaAppEquipmentCode),
    applicationMethod: findByQandaCode(qandaAppMethodCode),
    applicationPlacement: findByQandaCode(qandaAppPlacementCode),
    applicationPlacementDetails: findByQandaCode(qandaAppPlacementDetailCode),
    applicationRate: findByQandaTag(qandaAppRateTag),
    applicationVolume: findByQandaTag(qandaAppVolumeTag),
    chemical: chemicalProperty,
    mixSize: findByQandaTag(qandaMixSizeTag),
    timing: timingProperty,
  }

  const factorLevelsToIntentsReducer = (currentIntents, levelDetails) =>
    createIntentsFromDetails(currentIntents, levelDetails, relevantProperties, timingCodeMap,
      timingUomMap)
  return sortedTreatments.flatMap((treatment) => {
    const allIntents = treatment.factorLevels.reduce(factorLevelsToIntentsReducer, [{}])
    const uniqueIntents = collapseIntents(allIntents)
    return {
      intents: uniqueIntents,
      treatmentId: treatment.treatmentId,
    }
  })
}

const assignGroupNumber = (chemicals, groupNumber) => {
  chemicals.forEach((chemical) => {
    chemical.chemicalGroupNumber = groupNumber
  })
}

const getUniqueChemicalGroups = (uniqueChemicalGroups, chemicals) => {
  const matchingIndex = uniqueChemicalGroups.findIndex(chemicalGroup =>
    isEqual(chemicalGroup, chemicals))
  if (matchingIndex === -1) {
    const groupCopy = cloneDeep(chemicals)
    assignGroupNumber(chemicals, uniqueChemicalGroups.length + 1)
    return [
      ...uniqueChemicalGroups,
      groupCopy,
    ]
  }
  assignGroupNumber(chemicals, matchingIndex + 1)
  return uniqueChemicalGroups
}

export const getUniqueIntentsWithTreatment = (intentsByTreatment) => {
  const chemicalsByTreatment = intentsByTreatment.map(intentTreatments =>
    intentTreatments.intents.flatMap(intent => intent.chemicals))
  chemicalsByTreatment.reduce(getUniqueChemicalGroups, [])

  const uniqueIntentsWithTreatmentNumber = []
  intentsByTreatment.forEach((treatmentIntents) => {
    treatmentIntents.intents.forEach((intent) => {
      const matchingIntent = uniqueIntentsWithTreatmentNumber.find(intentGroup =>
        isEqual(intentGroup.intent, intent))
      if (matchingIntent) {
        matchingIntent.treatmentIds = [
          ...(matchingIntent.treatmentIds),
          treatmentIntents.treatmentId,
        ]
      } else {
        uniqueIntentsWithTreatmentNumber.push({
          intent,
          treatmentIds: [treatmentIntents.treatmentId],
        })
      }
    })
  })
  uniqueIntentsWithTreatmentNumber.forEach((intentGroup, index) => {
    intentGroup.intent.intentNumber = index + 1
  })

  return uniqueIntentsWithTreatmentNumber
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

  const intentsForTreatments = getIntentsForTreatments(factorLevelDetailsData, factorPropertyData,
    combinationElements, uniqueTimings, timingUomMap, timingProperty)
  const uniqueIntentsWithTreatment = getUniqueIntentsWithTreatment(intentsForTreatments)
  const uniqueIntents = uniqueIntentsWithTreatment.map(intentGroup => intentGroup.intent)

  const planId = await createChemApPlan(experimentData, ownerData, headers, context.requestId)
  try {
    await Promise.all([
      createPlanAssociation(planId, body.experimentId, headers, context.requestId),
      createPlanTimings(planId, uniqueTimings, headers, context.requestId),
    ])
    await updateChemApPlan(planId, experimentData, ownerData, uniqueIntents, headers,
      context.requestId)
    await createIntentAssociations(planId, uniqueIntentsWithTreatment, headers, context.requestId)
  } catch (error) {
    await deleteChemApPlan(planId, headers, context.requestId)
    throw (error)
  }

  return { planId }
}

const getIntentAssociationsByExperimentId = async (experimentId, header, requestId) => {
  try {
    const { body: planAssociations } = await HttpUtil.getWithRetry(`${apiUrls.chemApAPIUrl}/plan-associations?externalEntity=experiment&externalEntityId=${experimentId}`, header)
    const planId = planAssociations[0]?.planId
    const { body: intentAssociations } = await HttpUtil.getWithRetry(`${apiUrls.chemApAPIUrl}/intent-associations?planId=${planId}`, header)
    return intentAssociations
  } catch (error) {
    const message = `An error occurred while retrieving chemAp details for experiment ${experimentId}`
    console.error(`[[${requestId}]] ${message}`, getErrorFromChemAP(error))
    throw AppError.internalServerError(message, undefined, getFullErrorCode('1GC001'))
  }
}

const createSetEntryAssociations = (treatmentAssociations, experimentalUnits) =>
  experimentalUnits.filter((unit) => unit.set_entry_id).flatMap(unit => {
    const matchingTreatmentAssociations = treatmentAssociations.filter(assoc =>
      Number(assoc.externalEntityId) === unit.treatment_id)
    return matchingTreatmentAssociations.map(assoc => ({
      intentId: assoc.intentId,
      externalEntity: 'set entry',
      externalEntityId: unit.set_entry_id.toString(),
      isSource: false,
    }))
  })

export const addSetAssociationsToChemAP = async ({ experimentId }, context) => {
  const header = await OAuthUtil.getAuthorizationHeaders()
  const [
    experimentalUnits,
    intentAssociations,
  ] = await Promise.all([
    dbRead.unit.findAllByExperimentId(experimentId),
    getIntentAssociationsByExperimentId(experimentId, header, context.requestId),
  ])
  const treatmentAssociations = intentAssociations.filter(assoc => assoc.externalEntity === 'treatment' && assoc.isSource)
  const existingSetEntryAssociations = intentAssociations.filter(assoc => assoc.externalEntity === 'set entry' && !assoc.isSource)
    .map(assoc => ({
      intentId: assoc.intentId,
      externalEntity: assoc.externalEntity,
      externalEntityId: assoc.externalEntityId,
      isSource: assoc.isSource,
    }))
  const setEntryAssociations = createSetEntryAssociations(treatmentAssociations, experimentalUnits)

  const newSetEntryAssociations = differenceWith(setEntryAssociations,
    existingSetEntryAssociations, isEqual)

  if (newSetEntryAssociations.length > 0) {
    const headers = [...header, { headerName: 'username', headerValue: context.userId }]
    const message = `An error occurred while trying to associate intents to set entries for experiment ${experimentId}`
    await sendApiPostRequest('/intent-associations', headers, newSetEntryAssociations, message, '1GB001', context.requestId)
  }
}
