import _ from 'lodash'

const DataLoader = require('dataloader')
const db = require('../db/DbManager')

function experimentBatchLoaderCallback(ids, tx) {
  return db.experiments.batchFindExperimentOrTemplate(ids, false, tx)
}

function experimentsBatchLoaderCallback(tx) {
  return db.experiments.all(false, tx).then(data => [data])
}

function templateBatchLoaderCallback(ids, tx) {
  return db.experiments.batchFindExperimentOrTemplate(ids, true, tx)
}

function templatesBatchLoaderCallback(tx) {
  return db.experiments.all(true, tx).then(data => [data])
}

const transactionalBatchResolverWrapper =
    tx => (batchResolverFunction => (ids => batchResolverFunction(ids, tx)))

function createLoaders(tx) {
  const transactionalWrapper = transactionalBatchResolverWrapper(tx)
  const createDataLoader = batchLoaderCallback =>
    new DataLoader(transactionalWrapper(batchLoaderCallback))

  // Loaders that load by ID
  const combinationElementByIdLoader = createDataLoader(db.combinationElement.batchFind)
  const dependentVariableByIdLoader = createDataLoader(db.dependentVariable.batchFind)
  const designSpecDetailByIdLoader = createDataLoader(db.designSpecificationDetail.batchFind)
  const experimentByIdLoader = createDataLoader(experimentBatchLoaderCallback)
  const factorLevelByIdLoader = createDataLoader(db.factorLevel.batchFind)
  const factorLevelAssociationByIdLoader = createDataLoader(db.factorLevelAssociation.batchFind)
  const factorByIdLoader = createDataLoader(db.factor.batchFind)
  const groupByIdLoader = createDataLoader(db.group.batchFind)
  const ownerByIdLoader = createDataLoader(db.owner.batchFind)
  const refDataSourceByIdLoader = createDataLoader(db.refDataSource.batchFind)
  const refDataSourceTypeByIdLoader = createDataLoader(db.refDataSourceType.batchFind)
  const refDesignSpecByIdLoader = createDataLoader(db.refDesignSpecification.batchFind)
  const refExperimentDesignByIdLoader = createDataLoader(db.experimentDesign.batchFind)
  const refFactorTypeByIdLoader = createDataLoader(db.factorType.batchFind)
  const refGroupTypeByIdLoader = createDataLoader(db.groupType.batchFind)
  const refUnitSpecByIdLoader = createDataLoader(db.unitSpecification.batchFind)
  const refUnitTypeByIdLoader = createDataLoader(db.unitType.batchFind)
  const templateByIdLoader = createDataLoader(templateBatchLoaderCallback)
  const treatmentByIdLoader = createDataLoader(db.treatment.batchFind)
  const unitSpecDetailByIdLoader = createDataLoader(db.unitSpecificationDetail.batchFind)

  // Loaders that load by parent ID.  These prime the caches of loaders that load by entity ID.
  function primeCacheForOneToManyPulledFromOneSide(dbCallback, loaderPrimeTarget) {
    return createDataLoader((ids, dbTransaction) => dbCallback(ids, dbTransaction)
      .then((childrenByParent) => {
        _.forEach(childrenByParent, (childrenForParent) => {
          _.forEach(childrenForParent, (child) => {
            loaderPrimeTarget.prime(child.id, child)
          })
        })
        return childrenByParent
      }))
  }

  const associatedFactorLevelsByNestedFactorLevelIds = primeCacheForOneToManyPulledFromOneSide(
    db.factorLevelAssociation.batchFindAssociatedLevels, factorLevelByIdLoader)

  const combinationElementsByTreatmentIdLoader = primeCacheForOneToManyPulledFromOneSide(
    db.combinationElement.batchFindAllByTreatmentIds, factorLevelByIdLoader)

  const factorByExperimentIdLoader = primeCacheForOneToManyPulledFromOneSide(
    db.factor.batchFindByExperimentId, factorByIdLoader)

  const dependentVariableByExperimentIdLoader = primeCacheForOneToManyPulledFromOneSide(
    db.dependentVariable.batchFindByExperimentId, dependentVariableByIdLoader)

  const designSpecDetailByExperimentIdLoader = primeCacheForOneToManyPulledFromOneSide(
    db.designSpecificationDetail.batchFindAllByExperimentId, designSpecDetailByIdLoader)

  const factorLevelByFactorIdLoader = primeCacheForOneToManyPulledFromOneSide(
    db.factorLevel.batchFindByFactorId, factorLevelByIdLoader)

  const groupByExperimentIdLoader = primeCacheForOneToManyPulledFromOneSide(
    db.group.batchFindAllByExperimentId, groupByIdLoader)

  const groupByParentIdLoader = primeCacheForOneToManyPulledFromOneSide(
    db.group.batchFindAllByParentId, groupByIdLoader)

  const nestedFactorLevelByAssociatedFactorLevelIds = primeCacheForOneToManyPulledFromOneSide(
    db.factorLevelAssociation.batchFindNestedLevels, factorLevelByIdLoader)

  const ownerByExperimentIdLoader = primeCacheForOneToManyPulledFromOneSide(
    db.owner.batchFindByExperimentIds, ownerByIdLoader)

  const treatmentByExperimentIdLoader = primeCacheForOneToManyPulledFromOneSide(
    db.treatment.batchFindAllByExperimentId, treatmentByIdLoader)

  const unitSpecDetailByExperimentIdLoader = primeCacheForOneToManyPulledFromOneSide(
    db.unitSpecificationDetail.batchFindAllByExperimentId, unitSpecDetailByIdLoader)

  return {
    associatedFactorLevel: associatedFactorLevelsByNestedFactorLevelIds,
    combinationElement: combinationElementByIdLoader,
    combinationElementByTreatmentIds: combinationElementsByTreatmentIdLoader,
    dependentVariable: dependentVariableByIdLoader,
    dependentVariableByExperimentIds: dependentVariableByExperimentIdLoader,
    designSpecDetail: designSpecDetailByIdLoader,
    designSpecDetailByExperimentIds: designSpecDetailByExperimentIdLoader,
    experiment: experimentByIdLoader,
    experiments: createDataLoader(experimentsBatchLoaderCallback),
    factor: factorByIdLoader,
    factorByExperimentIds: factorByExperimentIdLoader,
    factorLevel: factorLevelByIdLoader,
    factorLevelByFactorIds: factorLevelByFactorIdLoader,
    factorLevelAssociation: factorLevelAssociationByIdLoader,
    group: groupByIdLoader,
    groupsByExperimentIds: groupByExperimentIdLoader,
    groupByParentIds: groupByParentIdLoader,
    groupValue: createDataLoader(db.groupValue.batchFindAllByGroupId),
    nestedFactorLevel: nestedFactorLevelByAssociatedFactorLevelIds,
    owner: ownerByIdLoader,
    ownersByExperimentIds: ownerByExperimentIdLoader,
    refDataSource: refDataSourceByIdLoader,
    refDataSourceType: refDataSourceTypeByIdLoader,
    refDesignSpec: refDesignSpecByIdLoader,
    refExperimentDesign: refExperimentDesignByIdLoader,
    refFactorType: refFactorTypeByIdLoader,
    refGroupType: refGroupTypeByIdLoader,
    refUnitSpec: refUnitSpecByIdLoader,
    refUnitType: refUnitTypeByIdLoader,
    setBySetIds: createDataLoader(db.group.batchFindAllBySetIds),
    template: templateByIdLoader,
    templates: createDataLoader(templatesBatchLoaderCallback),
    treatment: treatmentByIdLoader,
    treatmentByExperimentIds: treatmentByExperimentIdLoader,
    unit: createDataLoader(db.unit.batchFindAllByGroupIdsAndGroupByGroupId),
    unitByExperimentIds: createDataLoader(db.unit.batchfindAllByExperimentIds),
    unitsBySetId: createDataLoader(db.unit.batchFindAllBySetIds),
    unitSpecDetail: unitSpecDetailByIdLoader,
    unitSpecDetailByExperimentIds: unitSpecDetailByExperimentIdLoader,
  }
}

module.exports = { createLoaders }
