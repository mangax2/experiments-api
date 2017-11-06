import _ from 'lodash'
import FactorLevelAssociationEntityUtil from '../repos/util/FactorLevelAssociationEntityUtil'
import FactorLevelEntityUtil from '../repos/util/FactorLevelEntityUtil'
import SchemaValidator from './SchemaValidator'
import AppError from '../services/utility/AppError'
import db from '../db/DbManager'

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

  getDuplicateBusinessKeyError = () => 'Duplicate treatment name in request payload with same experiment id'

  createLevelIdToFactorIdMap =
    levelDbEntities => _.zipObject(
      _.map(levelDbEntities, 'id'),
      _.map(levelDbEntities, 'factor_id'))

  createFactorIdToNestedFactorIdMap = (
    levelsInCurExperiment,
    associationsGroupedByAssociatedLevelId,
  ) => {
    const factorLevelHashById =
      FactorLevelEntityUtil.assembleFactorLevelHashById(levelsInCurExperiment)
    const levelsInCurExperimentGroupedByFactorId = _.groupBy(levelsInCurExperiment, 'factor_id')
    return _.mapValues(levelsInCurExperimentGroupedByFactorId,
        levels => FactorLevelAssociationEntityUtil.getNestedFactorIds(
          levels, associationsGroupedByAssociatedLevelId, factorLevelHashById))
  }

  validateAllNestedRelationshipsInExperimentTreatments = (
    treatmentDTOsForCurrentExperiment,
    levelsInCurExperiment,
    associationsInCurExperiment,
  ) => {
    const associationsGroupedByAssociatedLevelId =
      FactorLevelAssociationEntityUtil
        .assembleAssociationsGroupByAssociatedLevelId(associationsInCurExperiment)
    return this.validateAllNestedRelationshipsInTreatments(
      treatmentDTOsForCurrentExperiment,
      this.createLevelIdToFactorIdMap(levelsInCurExperiment),
      associationsGroupedByAssociatedLevelId,
      this.createFactorIdToNestedFactorIdMap(
        levelsInCurExperiment,
        associationsGroupedByAssociatedLevelId))
  }

  validateAllNestedRelationshipsInTreatments = (
    treatmentDTOs,
    levelIdToFactorIDMap,
    associationsGroupedByAssociatedLevelId,
    nestedFactorIdsGroupedByAssociatedFactorId,
  ) => _.flatMap(treatmentDTOs, (treatmentDTO) => {
    const factorIdToCombinationElementLevelIdMap =
      _.zipObject(
        _.map(treatmentDTO.combinationElements,
          combinationElement =>
            levelIdToFactorIDMap[combinationElement.factorLevelId]),
        _.map(treatmentDTO.combinationElements, 'factorLevelId'))
    return this.validateAllNestedRelationshipsInTreatmentCombination(
      factorIdToCombinationElementLevelIdMap,
      associationsGroupedByAssociatedLevelId,
      nestedFactorIdsGroupedByAssociatedFactorId)
  })

  validateAllNestedRelationshipsInTreatmentCombination = (
    factorIdToLevelIdMap,
    associationsGroupedByAssociatedLevelId,
    nestedFactorIdsInCurExperimentGroupedByFactorId) =>
    _.flatMap(factorIdToLevelIdMap,
      (associatedFactorLevelId, associatedFactorId) =>
        this.validateNestedRelationshipsForSingleAssociatedFactor(
          nestedFactorIdsInCurExperimentGroupedByFactorId[associatedFactorId],
          _.map(associationsGroupedByAssociatedLevelId[associatedFactorLevelId], 'nested_level_id'),
          factorIdToLevelIdMap))

  validateNestedRelationshipsForSingleAssociatedFactor = (
    nestedFactorIds,
    validNestedLevelIds,
    factorIdToLevelIdMap) =>
      _.map(nestedFactorIds, nestedFactorId =>
        _.includes(validNestedLevelIds, factorIdToLevelIdMap[nestedFactorId]))

  getLevelsForExperiments = experimentIds => Promise.all(
    _.map(experimentIds,
        experimentId => db.factorLevel.findByExperimentId(experimentId)))

  getAssociationsForExperiments = experimentIds => Promise.all(
    _.map(experimentIds,
        experimentId => db.factorLevelAssociation.findByExperimentId(experimentId)))

  getDistinctExperimentIdsFromDTOs = treatmentDTOs =>
    _.uniq(_.map(treatmentDTOs, dto => Number(dto.experimentId)))

  validateNestedRelationshipsInExperiments = (
    distinctExperimentIds,
    treatmentDTOs,
    levelsGroupedByExperiment,
    associationsGroupedByExperiment) =>
    _.flatMap(levelsGroupedByExperiment, (levelsInCurExperiment, experimentIndex) => {
      const curExperimentId = distinctExperimentIds[experimentIndex]
      const treatmentDTOsForCurrentExperiment =
        _.filter(treatmentDTOs, treatment => treatment.experimentId === curExperimentId)
      const associationsInCurExperiment = associationsGroupedByExperiment[experimentIndex]
      return this.validateAllNestedRelationshipsInExperimentTreatments(
        treatmentDTOsForCurrentExperiment, levelsInCurExperiment, associationsInCurExperiment)
    })

  validateNestedFactorsInTreatmentDTOs = (treatmentDTOs) => {
    const distinctExperimentIds =
      this.getDistinctExperimentIdsFromDTOs(treatmentDTOs)
    return Promise.all([
      this.getLevelsForExperiments(distinctExperimentIds),
      this.getAssociationsForExperiments(distinctExperimentIds),
    ]).then(([levelsForEachExperiment, associationsForEachExperiment]) =>
      this.validateNestedRelationshipsInExperiments(
        distinctExperimentIds,
        treatmentDTOs,
        levelsForEachExperiment,
        associationsForEachExperiment),
    ).then(validityArray => (_.every(validityArray, Boolean)
        ? Promise.resolve()
        : Promise.reject('Not all nestings are valid.')))
  }

  preValidate = (treatmentDTOs) => {
    if (!_.isArray(treatmentDTOs) || treatmentDTOs.length === 0) {
      return Promise.reject(
        AppError.badRequest('Treatment request object needs to be an array'))
    }
    return this.validateNestedFactorsInTreatmentDTOs(treatmentDTOs)
  }

  postValidate = (targetObject) => {
    if (!this.hasErrors()) {
      const businessKeyPropertyNames = this.getBusinessKeyPropertyNames()
      const businessKeyArray = _.map(targetObject, obj => _.pick(obj, businessKeyPropertyNames))
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
    return Promise.resolve()
  }
}

module.exports = TreatmentValidator
