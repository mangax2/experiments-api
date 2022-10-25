import some from 'lodash/some'
import sortBy from 'lodash/sortBy'
import uniq from 'lodash/uniq'
import Transactional from '@monsantoit/pg-transactional'
import AppError from './utility/AppError'
import { dbRead, dbWrite } from '../db/DbManager'
import { notifyChanges } from '../decorators/notifyChanges'

const { getFullErrorCode, setErrorCode } = require('@monsantoit/error-decorator')()

const getFullDetails = (detail) => ({
  label: detail.label,
  objectType: detail.objectType,
  valueType: detail.valueType,
  catalogType: detail.catalogType,
  text: detail.text,
  value: detail.value && detail.catalogType ? Number(detail.value) : detail.value,
  questionCode: detail.questionCode,
  uomCode: detail.uomCode,
  multiQuestionTag: detail.multiQuestionTag,
  isPlaceholder: detail.valueType === 'placeholder',
})

const formatLevelItems = (rows) => {
  const detailsForLines = rows.map(line => line.details.map(getFullDetails))
  if (rows.length === 1) {
    return detailsForLines[0]
  }
  return detailsForLines.map(details => ({
    items: details,
    objectType: 'Composite',
  }))
}

const createOldObjectFormat = (treatmentVariableLevel) => {
  const rows = treatmentVariableLevel.treatmentVariableLevelDetails.reduce((tempRows, detail) => {
    const matchingRow = tempRows.find(tempRow => tempRow.rowNumber === detail.rowNumber)
    if (matchingRow) {
      matchingRow.details.push(detail)
      return tempRows
    }
    return [
      ...tempRows,
      {
        rowNumber: detail.rowNumber,
        details: [detail],
      },
    ]
  }, [])
  return formatLevelItems(rows)
}

// Error Codes 1DXXXX
class FactorService {
  @setErrorCode('1D2000')
  getAllFactors = () => dbRead.factor.all()

  @setErrorCode('1D3000')
  getFactorsByExperimentId = (id, isTemplate) =>
    dbRead.experiments.find(id, isTemplate)
      .then((experiment) => {
        if (experiment) {
          return dbRead.factor.findByExperimentId(id)
        }
        throw AppError.notFound(`No experiment found for id '${id}'.`, undefined, getFullErrorCode('1D3001'))
      })

  @setErrorCode('1D4000')
  static getFactorsByExperimentIdNoExistenceCheck(id) {
    return dbRead.factor.findByExperimentId(id)
  }

  @setErrorCode('1D8000')
  @Transactional('updateFactorsForDesign')
  updateFactorsForDesign = (experimentId, randStrategy, tx) => {
    const { rules } = randStrategy
    const hasSplits = some(rules, (rule, key) => key.includes('grouping'))
    if (!hasSplits) {
      return dbWrite.factor.removeTiersForExperiment(experimentId, tx)
    }

    return Promise.resolve()
  }

  @notifyChanges('update', 0)
  @setErrorCode('1D9000')
  @Transactional('saveTreatmentVariables')
  saveTreatmentVariablesAndTheirDescendents = async (
    experimentIdString,
    isTemplate,
    treatmentVariables,
    context,
    tx,
  ) => {
    const experimentId = Number(experimentIdString)
    await this.securityService.permissionsCheck(experimentId, context, isTemplate)
    this.validateTreatmentVariables(treatmentVariables)
    await this.saveTreatmentVariables(experimentId, treatmentVariables, context, tx)
    await this.saveTreatmentVariableLevels(experimentId, treatmentVariables, context, tx)
    const properties = await
      this.savePropertiesForTreatmentVariables(experimentId, treatmentVariables, context, tx)
    await this.createDetailsForTreatmentVariableLevels(treatmentVariables, properties, context, tx)
    await this.saveTreatmentVariableLevelAssociations(experimentId, treatmentVariables, context, tx)
  }

  @setErrorCode('1DA000')
  saveTreatmentVariables = async (experimentId, treatmentVariables, context, tx) => {
    const dbTreatmentVariables = await dbRead.factor.findByExperimentId(experimentId)
    dbTreatmentVariables.forEach(dbTreatmentVariable => {
      const matchedTreatmentVariable = treatmentVariables.find(tv =>
        tv.id === dbTreatmentVariable.id && !tv.isMatched)
      if (matchedTreatmentVariable) {
        dbTreatmentVariable.isMatched = true
        matchedTreatmentVariable.isMatched = true
      }
    })
    treatmentVariables.filter(tv => !tv.isMatched).forEach(tv => {
      const matchedTreatmentVariable = dbTreatmentVariables.find(dbTv =>
        tv.name === dbTv.name && !dbTv.isMatched)
      if (matchedTreatmentVariable) {
        matchedTreatmentVariable.isMatched = true
        tv.isMatched = true
        tv.id = matchedTreatmentVariable.id
      }
    })
    const adds = treatmentVariables.filter(tv => !tv.isMatched)
    const deletes = dbTreatmentVariables.filter(tv => !tv.isMatched)
    const updates = treatmentVariables.filter(tv => tv.isMatched)

    await dbWrite.factor.batchRemove(deletes.map(tv => tv.id), tx)
    await dbWrite.factor.batchUpdate(updates, context, tx)
    const createdTreatmentVariables = await dbWrite.factor.batchCreate(
      experimentId, adds, context, tx)
    createdTreatmentVariables.forEach(ctv => {
      const matchedTreatmentVariable = treatmentVariables.find(tv => tv.name === ctv.name)
      matchedTreatmentVariable.id = ctv.id
    })
  }

  @setErrorCode('1DB000')
  saveTreatmentVariableLevels = async (experimentId, treatmentVariables, context, tx) => {
    treatmentVariables.forEach(tv => {
      tv.treatmentVariableLevels = sortBy(tv.treatmentVariableLevels, 'levelNumber')
      tv.treatmentVariableLevels.forEach(level => {
        level.treatmentVariableId = tv.id
        level.value = {
          items: createOldObjectFormat(level),
          objectType: 'Cluster',
        }
      })
    })
    const dbTreatmentVariableLevels = await dbRead.factorLevel.findByExperimentId(experimentId)
    const treatmentVariableLevels = treatmentVariables.flatMap(tv => tv.treatmentVariableLevels)
    dbTreatmentVariableLevels.forEach(dbLevel => {
      const matchedLevel = treatmentVariableLevels.find(level =>
        level.id === dbLevel.id && !level.isMatched)
      if (matchedLevel) {
        dbLevel.isMatched = true
        matchedLevel.isMatched = true
      }
    })
    const adds = treatmentVariableLevels.filter(level => !level.isMatched)
    const deletes = dbTreatmentVariableLevels.filter(level => !level.isMatched)
    const updates = treatmentVariableLevels.filter(level => level.isMatched)

    await dbWrite.factorLevel.batchRemove(deletes.map(level => level.id), tx)
    await dbWrite.factorLevel.batchUpdate(updates, context, tx)
    const createdLevels = await dbWrite.factorLevel.batchCreate(adds, context, tx)
    createdLevels.forEach((level, index) => {
      adds[index].id = level.id
    })
  }

  @setErrorCode('1DC000')
  savePropertiesForTreatmentVariables = async (
    experimentId,
    treatmentVariables,
    context,
    tx,
  ) => {
    await dbWrite.factorPropertiesForLevel.batchRemoveByExperimentId([experimentId], tx)
    const properties = treatmentVariables.flatMap(tv => {
      const firstLevel = tv.treatmentVariableLevels.find(level => level.levelNumber === 1)
      const detailsForProps = firstLevel.treatmentVariableLevelDetails.filter(detail =>
        detail.rowNumber === 1)
      return detailsForProps.map((detail, index) => ({
        ...detail,
        treatmentVariableId: tv.id,
        columnNumber: index + 1,
        questionCode: detail.multiQuestionTag ? null : detail.questionCode,
      }))
    })

    return dbWrite.factorPropertiesForLevel.batchCreate(properties, context, tx)
  }

  @setErrorCode('1DD000')
  createDetailsForTreatmentVariableLevels = async (
    treatmentVariables,
    properties,
    context,
    tx,
  ) => {
    const details = treatmentVariables.flatMap(tv =>
      tv.treatmentVariableLevels.flatMap(level =>
        level.treatmentVariableLevelDetails.map(detail => {
          const matchedProperty = properties.find(property =>
            property.factor_id === tv.id && property.label === detail.label)
          return {
            ...detail,
            propertyId: matchedProperty.id,
            treatmentVariableLevelId: level.id,
            questionCode: matchedProperty.multi_question_tag ? detail.questionCode : null,
            isPlaceholder: detail.valueType === 'placeholder',
          }
      })))

    await dbWrite.factorLevelDetails.batchCreate(details, context, tx)
  }

  @setErrorCode('1DE000')
  saveTreatmentVariableLevelAssociations = async (
    experimentId,
    treatmentVariables,
    context,
    tx,
  ) => {
    treatmentVariables.forEach(tv => {
      tv.treatmentVariableLevels.forEach(level => {
        level.treatmentVariableName = tv.name
        level.associatedTreatmentVariableName = tv.associatedTreatmentVariableName
      })
    })
    const treatmentVariableLevels = treatmentVariables.flatMap(tv => tv.treatmentVariableLevels)
    const dbAssociations = await dbRead.factorLevelAssociation.findByExperimentId(experimentId)

    const nestedLevels = treatmentVariableLevels.filter(level =>
      level.associatedTreatmentVariableName && level.associatedTreatmentVariableLevelNumber)
    const associations = nestedLevels.map(nestedLevel => {
      const parentLevel = treatmentVariableLevels.find(level =>
        level.treatmentVariableName === nestedLevel.associatedTreatmentVariableName &&
        level.levelNumber === nestedLevel.associatedTreatmentVariableLevelNumber)
      return {
        associatedLevelId: parentLevel?.id,
        nestedLevelId: nestedLevel.id,
      }
    })

    if (associations.filter(assoc => !assoc.associatedLevelId).length > 0) {
      throw AppError.badRequest('Invalid associations. Cannot find the associated level for at least one treatment variable level.', undefined, getFullErrorCode('1DE001'))
    }

    dbAssociations.forEach(dbAssociation => {
      const matchingAssociation = associations.find(association =>
        association.associatedLevelId === dbAssociation.associated_level_id &&
        association.nestedLevelId === dbAssociation.nested_level_id)
      if (matchingAssociation) {
        dbAssociation.isMatched = true
        matchingAssociation.isMatched = true
      }
    })

    const deletes = dbAssociations.filter(assoc => !assoc.isMatched)
    const adds = associations.filter(assoc => !assoc.isMatched)
    await dbWrite.factorLevelAssociation.batchRemove(deletes.map(assoc => assoc.id), tx)
    await dbWrite.factorLevelAssociation.batchCreate(adds, context, tx)
  }

  @setErrorCode('1DF000')
  validateTreatmentVariables = (treatmentVariables) => {
    const variableNames = treatmentVariables.map(tv => tv.name).filter(name => name)
    if (treatmentVariables.length !== uniq(variableNames).length) {
      throw AppError.badRequest('All variables must have a name and they must be unique.', undefined, getFullErrorCode('1DF001'))
    }

    const nestedVariables = treatmentVariables.filter(tv => tv.associatedTreatmentVariableName)
    const levelsWithoutNesting = nestedVariables.flatMap(tv => tv.treatmentVariableLevels)
      .filter(levels => !levels.associatedTreatmentVariableLevelNumber)
    if (levelsWithoutNesting.length > 0) {
      throw AppError.badRequest('All levels for nested variables must have an associated level.', undefined, getFullErrorCode('1DF002'))
    }

    const nonBlockingVariables = treatmentVariables.filter(tv => !tv.isBlockingFactorOnly)
    if (nonBlockingVariables.length === 0) {
      throw AppError.badRequest('At least one treatment variable must not be a blocking factor.', undefined, getFullErrorCode('1DF003'))
    }

    const treatmentVariablesWithoutLevels = treatmentVariables.filter(tv =>
      tv.treatmentVariableLevels.length < 2)
    if (treatmentVariablesWithoutLevels.length > 0) {
      throw AppError.badRequest('Every treatment variable needs to have at least two levels.', undefined, getFullErrorCode('1DF004'))
    }
  }
}

module.exports = FactorService
