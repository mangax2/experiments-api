import _ from 'lodash'
import FactorLevelAssociationEntityUtil from '../repos/util/FactorLevelAssociationEntityUtil'
import FactorLevelEntityUtil from '../repos/util/FactorLevelEntityUtil'
import SchemaValidator from './SchemaValidator'
import AppError from '../services/utility/AppError'
import { dbRead } from '../db/DbManager'

const { getFullErrorCode, setErrorCode } = require('@monsantoit/error-decorator')()

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

function createFactorIdToCombinationElementLevelIdMap(
  combinationElementDTOs, levelIdToFactorIDMap) {
  return _.zipObject(
    _.map(combinationElementDTOs,
      combinationElementDTO =>
        levelIdToFactorIDMap[combinationElementDTO.factorLevelId]),
    _.map(combinationElementDTOs, 'factorLevelId'))
}

function findInvalidNestedRelationshipsForSingleAssociatedFactorLevelInTreatmentCombination(
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
  factorIdToCombinationLevelIdMap,
  associationDbEntitiesGroupedByAssociatedLevelId,
  nestedFactorIdsGroupedByFactorId) {
  return _.flatMap(factorIdToCombinationLevelIdMap,
    (associatedFactorLevelId, associatedFactorId) => {
      const invalidNestedLevelIds =
        findInvalidNestedRelationshipsForSingleAssociatedFactorLevelInTreatmentCombination(
          nestedFactorIdsGroupedByFactorId[associatedFactorId],
          _.map(associationDbEntitiesGroupedByAssociatedLevelId[associatedFactorLevelId], 'nested_level_id'),
          factorIdToCombinationLevelIdMap)
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
        createFactorIdToCombinationElementLevelIdMap(
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
  return _.map(invalidNestedRelationships, invalidRelationship => `{ Associated Level Id: ${invalidRelationship.associatedLevelId}, Nested Level Id: ${invalidRelationship.nestedLevelId} }`).join(', ')
}

function formatInvalidRelationshipsErrorMessage(invalidRelationships) {
  return _.map(invalidRelationships, invalidRelationship =>
    `Treatment number: ${invalidRelationship.treatmentDTO.treatmentNumber} has the following invalid level id combinations: ${formatInvalidNestedRelationships(invalidRelationship.invalidNestedRelationships)}`)
}

// Error Codes 3FXXXX
class TreatmentValidator extends SchemaValidator {
  constructor() {
    super()
    super.setFileCode('3F')
  }

  static get POST_VALIDATION_SCHEMA() {
    return [
      { paramName: 'treatmentNumber', type: 'numeric', required: true },
      {
        paramName: 'notes', type: 'text', lengthRange: { min: 0, max: 500 }, required: false,
      },
      { paramName: 'experimentId', type: 'numeric', required: true },
      { paramName: 'experimentId', type: 'refData', entity: dbRead.experiments },
      { paramName: 'inAllBlocks', type: 'boolean' },
    ]
  }

  static get PUT_ADDITIONAL_SCHEMA_ELEMENTS() {
    return [
      { paramName: 'id', type: 'numeric', required: true },
      { paramName: 'id', type: 'refData', entity: dbRead.treatment },
    ]
  }

  getEntityName = () => 'Treatment'

  @setErrorCode('3F1000')
  getSchema = (operationName) => {
    switch (operationName) {
      case 'POST':
        return TreatmentValidator.POST_VALIDATION_SCHEMA
      case 'PUT':
        return TreatmentValidator.POST_VALIDATION_SCHEMA.concat(
          TreatmentValidator.PUT_ADDITIONAL_SCHEMA_ELEMENTS,
        )
      default:
        throw AppError.badRequest('Invalid Operation', undefined, getFullErrorCode('3F1001'))
    }
  }

  getBusinessKeyPropertyNames = () => ['experimentId', 'treatmentNumber']

  getDuplicateBusinessKeyError = () => ({ message: 'Duplicate treatment number in request payload with same experiment id', errorCode: getFullErrorCode('3FA001') })

  @setErrorCode('3F4000')
  getLevelsForExperiments = experimentIds => Promise.all(
    _.map(experimentIds,
      experimentId => dbRead.factorLevel.findByExperimentId(experimentId)))

  @setErrorCode('3F5000')
  getAssociationsForExperiments = experimentIds => Promise.all(
    _.map(experimentIds,
      experimentId => dbRead.factorLevelAssociation.findByExperimentId(experimentId)))

  @setErrorCode('3F6000')
  getDistinctExperimentIdsFromDTOs = treatmentDTOs =>
    _.uniq(_.map(treatmentDTOs, dto => Number(dto.experimentId)))

  @setErrorCode('3F7000')
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

  @setErrorCode('3F8000')
  validateNestedFactorsInTreatmentDTOs = (treatmentDTOsFromRequest) => {
    const distinctExperimentIds =
      this.getDistinctExperimentIdsFromDTOs(treatmentDTOsFromRequest)
    return this.getDataForEachExperiment(distinctExperimentIds, treatmentDTOsFromRequest)
      .then(dataGroupedByExperiment => _.flatMap(dataGroupedByExperiment,
        ([levels, associations, treatmentDTOsForExperiment]) => {
          const {
            levelIdToFactorIdMap, associatedLevelIdToAssociationsMap,
            factorIdToNestedFactorIdMap,
          } = createLookupMaps(levels, associations)
          return findInvalidNestedRelationshipsInTreatments(
            treatmentDTOsForExperiment,
            levelIdToFactorIdMap,
            associatedLevelIdToAssociationsMap,
            factorIdToNestedFactorIdMap)
        }))
      .then((invalidRelationships) => {
        if (!_.isEmpty(invalidRelationships)) {
          _.forEach(formatInvalidRelationshipsErrorMessage(invalidRelationships),
            errorMessage => this.messages.push({ message: errorMessage, errorCode: getFullErrorCode('3F8001') }))
        }
        return Promise.resolve()
      })
  }

  @setErrorCode('3F2000')
  preValidate = (treatmentDTOs) => {
    if (!_.isArray(treatmentDTOs) || treatmentDTOs.length === 0) {
      return Promise.reject(
        AppError.badRequest('Treatment request object needs to be an array', undefined, getFullErrorCode('3F2001')))
    }
    return Promise.resolve()
  }

  @setErrorCode('3F9000')
  checkForDuplicateBusinessKeys = (treatmentDTOs) => {
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
  }

  @setErrorCode('3F3000')
  postValidate = (treatmentDTOs) => {
    if (this.hasErrors()) {
      return Promise.resolve()
    }
    this.checkForDuplicateBusinessKeys(treatmentDTOs)
    return this.validateNestedFactorsInTreatmentDTOs(treatmentDTOs)
  }

  @setErrorCode('3F4000')
  validateBlockValue = (treatmentDTOs) => {
    const allKeysFromTreatments = _.uniq(_.flatMap(treatmentDTOs, _.keys))
    const hasOldSchema = _.intersection(allKeysFromTreatments, ['block', 'inAllBlocks']).length > 0
    const hasNewSchema = _.intersection(allKeysFromTreatments, ['blocks']).length > 0

    if (hasOldSchema && hasNewSchema) {
      return Promise.reject(AppError.badRequest('Do not mix usage of "block" and "blocks" in treatments submitted in the same request', undefined, getFullErrorCode('3F4004')))
    }

    if (hasOldSchema) {
      if (this.conflictBlocksExists(treatmentDTOs)) {
        return Promise.reject(AppError.badRequest('Treatment request object contains conflicting blocking information',
          undefined, getFullErrorCode('3F4001')))
      }

      if (this.blockForNotAllTreatments(treatmentDTOs)) {
        return Promise.reject(AppError.badRequest('Only some of the treatments in the treatment request object contains the block information',
          undefined, getFullErrorCode('3F4002')))
      }

      if (this.allTreatmentsInAllBlocks(treatmentDTOs)) {
        return Promise.reject(AppError.badRequest('All treatments apply to all blocks is not allowed',
          undefined, getFullErrorCode('3F4003')))
      }
    }

    if (hasNewSchema) {
      if (!this.allTreatmentsHaveBlocks(treatmentDTOs)) {
        return Promise.reject(AppError.badRequest('All treatments must have at least one block in the blocks array',
          undefined, getFullErrorCode('3F4005')))
      }

      if (!this.allBlocksHaveNumPerRep(treatmentDTOs)) {
        return Promise.reject(AppError.badRequest('All block objects must have a numPerRep value which is an integer',
          undefined, getFullErrorCode('3F4006')))
      }

      if (this.anyTreatmentRepeatsBlockName(treatmentDTOs)) {
        return Promise.reject(AppError.badRequest('Treatments cannot be added to the same block twice',
          undefined, getFullErrorCode('3F4007')))
      }
    }

    return Promise.resolve()
  }

  @setErrorCode('3F5000')
  conflictBlocksExists = treatmentDTOs =>
    _.find(treatmentDTOs, t => !_.isNil(t.block) && t.inAllBlocks === true) !== undefined

  @setErrorCode('3F6000')
  blockForNotAllTreatments = treatmentDTOs =>
    this.noBlockTreamentExists(treatmentDTOs) && this.blockedTreatmentExists(treatmentDTOs)

  @setErrorCode('3F7000')
  noBlockTreamentExists = treatmentDTOs =>
    _.find(treatmentDTOs,
      t => _.isNil(t.block) && (_.isNil(t.inAllBlocks) || t.inAllBlocks === false)) !== undefined

  @setErrorCode('3F8000')
  blockedTreatmentExists = treatmentDTOs =>
    _.find(treatmentDTOs, t => !_.isNil(t.block)) !== undefined
    || _.find(treatmentDTOs, t => t.inAllBlocks === true) !== undefined

  @setErrorCode('3F9000')
  allTreatmentsInAllBlocks = treatmentDTOs =>
    treatmentDTOs.length > 0 &&
    _.find(treatmentDTOs, t => _.isNil(t.inAllBlocks) || t.inAllBlocks === false) === undefined

  @setErrorCode('3FA000')
  allTreatmentsHaveBlocks = treatmentDTOs =>
    _.every(treatmentDTOs, 'blocks') && _.every(treatmentDTOs, t => t.blocks.length > 0)

  @setErrorCode('3FB000')
  allBlocksHaveNumPerRep = treatmentDTOs =>
    _.every(_.flatMap(treatmentDTOs, 'blocks'), b => b.numPerRep && parseInt(b.numPerRep.toString(), 10))

  @setErrorCode('3FC000')
  anyTreatmentRepeatsBlockName = treatmentDTOs =>
    _.find(treatmentDTOs, t => t.blocks.length !== _.uniq(_.map(t.blocks, 'name')).length)
}

module.exports = TreatmentValidator
