import _ from 'lodash'
import FactorLevelAssociationEntityUtil from '../repos/util/FactorLevelAssociationEntityUtil'
import FactorLevelEntityUtil from '../repos/util/FactorLevelEntityUtil'
import SchemaValidator from './SchemaValidator'
import AppError from '../services/utility/AppError'
import db from '../db/DbManager'

function createLevelIdToFactorIdMap(levelDbEntities) {
  return _.zipObject(
    _.map(levelDbEntities, 'id'),
    _.map(levelDbEntities, 'factor_id'))
}

function createFactorIdToNestedFactorIdMap(
  levelDbEntities,
  associationDbEntitiesGroupedByAssociatedLevelId) {
  const factorLevelHashById =
    FactorLevelEntityUtil.assembleFactorLevelHashById(levelDbEntities)
  return _.mapValues(_.groupBy(levelDbEntities, 'factor_id'),
    levelsInFactor => FactorLevelAssociationEntityUtil.getNestedFactorIds(
      levelsInFactor, associationDbEntitiesGroupedByAssociatedLevelId, factorLevelHashById))
}

function createLookupMaps(levelDbEntities, associationDbEntities) {
  const associatedLevelIdToAssociationsMap =
    FactorLevelAssociationEntityUtil
      .assembleAssociationsGroupByAssociatedLevelId(associationDbEntities)
  return {
    associatedLevelIdToAssociationsMap,
    levelIdToFactorIdMap: createLevelIdToFactorIdMap(levelDbEntities),
    factorIdToNestedFactorIdMap: createFactorIdToNestedFactorIdMap(
      levelDbEntities, associatedLevelIdToAssociationsMap),
  }
}

function createFactorIdToCombinationElementLevelMap(
  combinationElementDTOs, levelIdToFactorIDMap) {
  return _.zipObject(
    _.map(combinationElementDTOs,
      combinationElementDTO =>
        levelIdToFactorIDMap[combinationElementDTO.factorLevelId]),
    _.map(combinationElementDTOs, 'factorLevelId'))
}

function findInvalidNestedRelationshipsForSingleAssociatedFactor(
  nestedFactorIds,
  validNestedLevelIds,
  factorIdToLevelIdMap) {
  return _.compact(_.map(nestedFactorIds, (nestedFactorId) => {
    const nestedLevelId = factorIdToLevelIdMap[nestedFactorId]
    if (!_.includes(validNestedLevelIds, nestedLevelId)) {
      return nestedLevelId
    }
    return null
  }))
}

function findInvalidNestedRelationshipsInTreatmentCombination(
  factorIdToLevelIdMap,
  associationDbEntitiesGroupedByAssociatedLevelId,
  nestedFactorIdsGroupedByFactorId) {
  return _.flatMap(factorIdToLevelIdMap,
    (associatedFactorLevelId, associatedFactorId) => {
      const invalidNestedLevelIds = findInvalidNestedRelationshipsForSingleAssociatedFactor(
        nestedFactorIdsGroupedByFactorId[associatedFactorId],
        _.map(associationDbEntitiesGroupedByAssociatedLevelId[associatedFactorLevelId], 'nested_level_id'),
        factorIdToLevelIdMap)
      return _.map(invalidNestedLevelIds,
          invalidNestedLevelId => ({
            associatedLevelId: associatedFactorLevelId,
            nestedLevelId: invalidNestedLevelId,
          }))
    })
}

function findInvalidNestedRelationshipsInTreatments(
  treatmentDTOs,
  levelIdToFactorIDMap,
  associationDbEntitiesGroupedByAssociatedLevelId,
  nestedFactorIdsGroupedByAssociatedFactorId) {
  return _.compact(_.map(treatmentDTOs, (treatmentDTO) => {
    const invalidNestedRelationships =
      findInvalidNestedRelationshipsInTreatmentCombination(
        createFactorIdToCombinationElementLevelMap(
          treatmentDTO.combinationElements, levelIdToFactorIDMap),
      associationDbEntitiesGroupedByAssociatedLevelId,
      nestedFactorIdsGroupedByAssociatedFactorId)
    if (_.isEmpty(invalidNestedRelationships)) {
      return null
    }
    return {
      treatmentDTO,
      invalidNestedRelationships,
    }
  }))
}

function formatInvalidNestedRelationships(invalidNestedRelationships) {
  return _.map(invalidNestedRelationships, invalidRelationship => `Associated Level Id: ${invalidRelationship.associatedLevelId}, Nested Level Id: ${invalidRelationship.nestedLevelId}`).join(', ')
}

function formatInvalidRelationshipsErrorMessage(invalidRelationships) {
  return _.map(invalidRelationships, invalidRelationship =>
    `Treatment number: ${invalidRelationship.treatmentDTO.treatmentNumber} has the following invalid level id combinations: ${formatInvalidNestedRelationships(invalidRelationship.invalidNestedRelationships)}`)
}

class TreatmentValidator extends SchemaValidator {
  static get POST_VALIDATION_SCHEMA() {
    return [
      { paramName: 'isControl', type: 'boolean', required: true },
      { paramName: 'treatmentNumber', type: 'numeric', required: true },
      { paramName: 'notes', type: 'text', lengthRange: { min: 0, max: 500 }, required: false },
      { paramName: 'experimentId', type: 'numeric', required: true },
      { paramName: 'experimentId', type: 'refData', entity: db.experiments },
      {
        paramName: 'Treatment',
        type: 'businessKey',
        keys: ['experimentId', 'treatmentNumber'],
        entity: db.treatment,
      },
    ]
  }

  static get PUT_ADDITIONAL_SCHEMA_ELEMENTS() {
    return [
      { paramName: 'id', type: 'numeric', required: true },
      { paramName: 'id', type: 'refData', entity: db.treatment },
    ]
  }

  getEntityName = () => 'Treatment'

  getSchema = (operationName) => {
    switch (operationName) {
      case 'POST':
        return TreatmentValidator.POST_VALIDATION_SCHEMA
      case 'PUT':
        return TreatmentValidator.POST_VALIDATION_SCHEMA.concat(
          TreatmentValidator.PUT_ADDITIONAL_SCHEMA_ELEMENTS,
        )
      default:
        throw AppError.badRequest('Invalid Operation')
    }
  }

  getBusinessKeyPropertyNames = () => ['experimentId', 'treatmentNumber']

  getDuplicateBusinessKeyError = () => 'Duplicate treatment number in request payload with same experiment id'

  getLevelsForExperiments = experimentIds => Promise.all(
    _.map(experimentIds,
        experimentId => db.factorLevel.findByExperimentId(experimentId)))

  getAssociationsForExperiments = experimentIds => Promise.all(
    _.map(experimentIds,
        experimentId => db.factorLevelAssociation.findByExperimentId(experimentId)))

  getDistinctExperimentIdsFromDTOs = treatmentDTOs =>
    _.uniq(_.map(treatmentDTOs, dto => Number(dto.experimentId)))

  getDataForEachExperiment = (experimentIds, treatmentDTOs) => {
    const treatmentDTOsForEachExperiment =
      _.map(experimentIds, experimentId =>
        _.filter(treatmentDTOs, dto => dto.experimentId === experimentId))
    return Promise.all([
      this.getLevelsForExperiments(experimentIds),
      this.getAssociationsForExperiments(experimentIds),
    ]).then(([levelsForEachExperiment, associationsForEachExperiment]) => _.zip(
        levelsForEachExperiment,
        associationsForEachExperiment,
        treatmentDTOsForEachExperiment))
  }

  validateNestedFactorsInTreatmentDTOs = (treatmentDTOsFromRequest) => {
    const distinctExperimentIds =
      this.getDistinctExperimentIdsFromDTOs(treatmentDTOsFromRequest)
    return this.getDataForEachExperiment(distinctExperimentIds, treatmentDTOsFromRequest)
      .then(dataGroupedByExperiment => _.flatMap(dataGroupedByExperiment,
        ([levels, associations, treatmentDTOsForExperiment]) => {
          const { levelIdToFactorIdMap, associatedLevelIdToAssociationsMap,
            factorIdToNestedFactorIdMap } = createLookupMaps(levels, associations)
          return findInvalidNestedRelationshipsInTreatments(
            treatmentDTOsForExperiment,
            levelIdToFactorIdMap,
            associatedLevelIdToAssociationsMap,
            factorIdToNestedFactorIdMap)
        }))
      .then((invalidRelationships) => {
        if (!_.isEmpty(invalidRelationships)) {
          _.forEach(formatInvalidRelationshipsErrorMessage(invalidRelationships),
              errorMessage => this.messages.push(errorMessage))
        }
        return Promise.resolve()
      })
  }

  preValidate = (treatmentDTOs) => {
    if (!_.isArray(treatmentDTOs) || treatmentDTOs.length === 0) {
      return Promise.reject(
        AppError.badRequest('Treatment request object needs to be an array'))
    }
    return Promise.resolve()
  }

  postValidate = (treatmentDTOs) => {
    if (!this.hasErrors()) {
      const businessKeyPropertyNames = this.getBusinessKeyPropertyNames()
      const businessKeyArray = _.map(treatmentDTOs, obj => _.pick(obj, businessKeyPropertyNames))
      const groupByObject = _.values(_.groupBy(businessKeyArray, keyObj => keyObj.experimentId))
      _.forEach(groupByObject, (innerArray) => {
        const names = _.map(innerArray, e => e[businessKeyPropertyNames[1]])
        if (_.uniq(names).length !== names.length) {
          this.messages.push(this.getDuplicateBusinessKeyError())
          return false
        }
        return true
      })
      return this.validateNestedFactorsInTreatmentDTOs(treatmentDTOs)
    }
    return Promise.resolve()
  }
}

module.exports = TreatmentValidator
