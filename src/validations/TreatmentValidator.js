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

  preValidate = (treatmentObj) => {
    if (!_.isArray(treatmentObj) || treatmentObj.length === 0) {
      return Promise.reject(
        AppError.badRequest('Treatment request object needs to be an array'))
    }

    const treatmentsGroupedByExperimentId = _.groupBy(treatmentObj, 'experimentId')
    const experimentIds = _.map(_.keys(treatmentsGroupedByExperimentId), Number)
    const levelsForEachExperimentPromise =
      Promise.all(
        _.map(experimentIds, experimentId =>
          db.factorLevel.findByExperimentId(experimentId)))
    const associationsForEachExperimentPromise =
      Promise.all(
        _.map(experimentIds, experimentId =>
          db.factorLevelAssociation.findByExperimentId(experimentId)))
    return Promise.all([
      levelsForEachExperimentPromise,
      associationsForEachExperimentPromise,
    ]).then(([levelsGroupedByExperiment, associationsGroupedByExperiment]) => {
      const nestedFactorValidityArrayForAllCombinationsInAllExperiments =
        _.flatMap(levelsGroupedByExperiment, (levelsInCurExperiment, experimentIndex) => {
          const curExperimentId = experimentIds[experimentIndex]
          const treatmentDTOsForCurrentExperiment =
            _.filter(treatmentObj, treatment => treatment.experimentId === curExperimentId)
          const factorLevelHashById =
            FactorLevelEntityUtil.assembleFactorLevelHashById(levelsInCurExperiment)
          const associationsInCurExperiment = associationsGroupedByExperiment[experimentIndex]
          const associationsGroupedByAssociatedLevelId =
            FactorLevelAssociationEntityUtil
              .assembleAssociationsGroupByAssociatedLevelId(associationsInCurExperiment)
          const levelsInCurExperimentGroupedByFactorId = _.groupBy(levelsInCurExperiment, 'factor_id')
          const nestedFactorIdsInCurExperimentGroupedByFactorId =
            _.mapValues(levelsInCurExperimentGroupedByFactorId,
                levels => FactorLevelAssociationEntityUtil.getNestedFactorIds(
                  levels, associationsGroupedByAssociatedLevelId, factorLevelHashById))
          const levelIdsToFactorIDMap = _.zipObject(
            _.map(levelsInCurExperiment, 'id'),
            _.map(levelsInCurExperiment, 'factor_id'))
          const nestedFactorValidityArrayForAllCombinationsInAllTreatments =
            _.flatMap(treatmentDTOsForCurrentExperiment, (treatmentDTO) => {
              const factorIdToCombinationElementLevelIdMap =
                _.zipObject(
                  _.map(treatmentDTO.combinationElements,
                      combinationElement =>
                        levelIdsToFactorIDMap[combinationElement.factorLevelId]),
                  _.map(treatmentDTO.combinationElements, 'factorLevelId'))
              const nestedFactorValidityArrayForAllCombinationsInTreatment =
                _.flatMap(factorIdToCombinationElementLevelIdMap,
                  (associatedFactorLevelId, factorId) => {
                    const nestedLevelIdsForAssociatedFactorLevelId =
                      _.map(associationsGroupedByAssociatedLevelId[associatedFactorLevelId],
                        'nested_level_id')
                    const nestedFactorIds =
                      nestedFactorIdsInCurExperimentGroupedByFactorId[factorId]
                    const nestedFactorValidityArrayForCombination =
                      _.map(nestedFactorIds, (nestedFactorId) => {
                        const nestedFactorLevelId =
                          factorIdToCombinationElementLevelIdMap[nestedFactorId]
                        return _.includes(
                          nestedLevelIdsForAssociatedFactorLevelId,
                          nestedFactorLevelId)
                      })
                    return nestedFactorValidityArrayForCombination
                  })
              return nestedFactorValidityArrayForAllCombinationsInTreatment
            })
          return nestedFactorValidityArrayForAllCombinationsInAllTreatments
        })

      return _.every(nestedFactorValidityArrayForAllCombinationsInAllExperiments, Boolean)
        ? Promise.resolve()
        : Promise.reject('Not all nestings are valid.')
    })
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
