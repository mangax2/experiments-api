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
  const createDataLoader = batchResolver => new DataLoader(transactionalWrapper(batchResolver))
  return {
    associatedFactorLevel:
      createDataLoader(db.factorLevelAssociation.batchFindAssociatedLevels),
    combinationElement: createDataLoader(db.combinationElement.batchFind),
    combinationElementByTreatmentIds:
      createDataLoader(db.combinationElement.batchFindAllByTreatmentIds),
    dependentVariable: createDataLoader(db.dependentVariable.batchFind),
    dependentVariableByExperimentIds: createDataLoader(
      db.dependentVariable.batchFindByExperimentId),
    designSpecDetail: createDataLoader(db.designSpecificationDetail.batchFind),
    designSpecDetailByExperimentIds:
      createDataLoader(db.designSpecificationDetail.batchFindAllByExperimentId),
    experiment: createDataLoader(experimentBatchLoaderCallback),
    experiments: createDataLoader(experimentsBatchLoaderCallback),
    factor: createDataLoader(db.factor.batchFind),
    factorByExperimentIds: createDataLoader(db.factor.batchFindByExperimentId),
    factorLevel: createDataLoader(db.factorLevel.batchFind),
    factorLevelByFactorIds: createDataLoader(db.factorLevel.batchFindByFactorId),
    factorLevelAssociation: createDataLoader(db.factorLevelAssociation.batchFind),
    group: createDataLoader(db.group.batchFind),
    groupsByExperimentIds: createDataLoader(db.group.batchFindAllByExperimentId),
    groupByParentIds: createDataLoader(db.group.batchFindAllByParentId),
    groupValue: createDataLoader(db.groupValue.batchFindAllByGroupId),
    nestedFactorLevel: createDataLoader(db.factorLevelAssociation.batchFindNestedLevels),
    owner: createDataLoader(db.owner.batchFind),
    ownersByExperimentIds: createDataLoader(db.owner.batchFindByExperimentIds),
    refDataSource: createDataLoader(db.refDataSource.batchFind),
    refDataSourceType: createDataLoader(db.refDataSourceType.batchFind),
    refDesignSpec: createDataLoader(db.refDesignSpecification.batchFind),
    refExperimentDesign: createDataLoader(db.experimentDesign.batchFind),
    refFactorType: createDataLoader(db.factorType.batchFind),
    refGroupType: createDataLoader(db.groupType.batchFind),
    refUnitSpec: createDataLoader(db.unitSpecification.batchFind),
    refUnitType: createDataLoader(db.unitType.batchFind),
    setBySetIds: createDataLoader(db.group.batchFindAllBySetIds),
    template: createDataLoader(templateBatchLoaderCallback),
    templates: createDataLoader(templatesBatchLoaderCallback),
    treatment: createDataLoader(db.treatment.batchFind),
    treatmentByExperimentIds: createDataLoader(db.treatment.batchFindAllByExperimentId),
    unit: createDataLoader(db.unit.batchFindAllByGroupIdsAndGroupByGroupId),
    unitByExperimentIds: createDataLoader(db.unit.batchfindAllByExperimentIds),
    unitsBySetId: createDataLoader(db.unit.batchFindAllBySetIds),
    unitSpecDetail: createDataLoader(db.unitSpecificationDetail.batchFind),
    unitSpecDetailByExperimentIds:
      createDataLoader(db.unitSpecificationDetail.batchFindAllByExperimentId),
  }
}

module.exports = { createLoaders }
