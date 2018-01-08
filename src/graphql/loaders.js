const DataLoader = require('dataloader')
const db = require('../db/DbManager')

function associatedFactorLevelBatchResolver(ids, tx) {
  return db.factorLevelAssociation.batchFindAssociatedLevels(ids, tx)
}

function combinationElementBatchResolver(ids, tx) {
  return db.combinationElement.batchFind(ids, tx)
}

function combinationElementByTreatmentIdsBatchResolver(ids, tx) {
  return db.combinationElement.batchFindAllByTreatmentIds(ids, tx)
}

function dependentVariableBatchResolver(ids, tx) {
  return db.dependentVariable.batchFind(ids, tx)
}

function dependentVariableByExperimentIdsBatchResolver(ids, tx) {
  return db.dependentVariable.batchFindByExperimentId(ids, tx)
}

function designSpecDetailBatchResolver(ids, tx) {
  return db.designSpecificationDetail.batchFind(ids, tx)
}

function designSpecDetailByExperimentIdsBatchResolver(ids, tx) {
  return db.designSpecificationDetail.batchFindAllByExperimentId(ids, tx)
}

function experimentBatchResolver(ids, tx) {
  return db.experiments.batchFindExperimentOrTemplate(ids, false, tx)
}

function experimentsBatchResolver(tx) {
  return db.experiments.all(false, tx)
}

function factorBatchResolver(ids, tx) {
  return db.factor.batchFind(ids, tx)
}

function factorByExperimentIdsBatchResolver(ids, tx) {
  return db.factor.batchFindByExperimentId(ids, tx)
}

function factorLevelBatchResolver(ids, tx) {
  return db.factorLevel.batchFind(ids, tx)
}

function factorLevelByFactorIdsBatchResolver(ids, tx) {
  return db.factorLevel.batchFindByFactorId(ids, tx)
}

function factorLevelAssociationBatchResolver(ids, tx) {
  return db.factorLevelAssociation.batchFind(ids, tx)
}

function groupBatchResolver(ids, tx) {
  return db.group.batchFind(ids, tx)
}

function groupByExperimentIdsBatchResolver(ids, tx) {
  return db.group.batchFindAllByExperimentId(ids, tx)
}

function groupByParentIdsBatchResolver(ids, tx) {
  return db.group.batchFindAllByParentId(ids, tx)
}

function groupValueBatchResolver(ids, tx) {
  return db.groupValue.batchFindAllByGroupId(ids, tx)
}

function nestedFactorLevelBatchResolver(ids, tx) {
  return db.factorLevelAssociation.batchFindNestedLevels(ids, tx)
}

function ownerBatchResolver(ids, tx) {
  return db.owner.batchFind(ids, tx)
}

function refDataSourceBatchResolver(ids, tx) {
  return db.refDataSource.batchFind(ids, tx)
}

function refDataSourceTypeBatchResolver(ids, tx) {
  return db.refDataSourceType.batchFind(ids, tx)
}

function refDesignSpecBatchResolver(ids, tx) {
  return db.refDesignSpecification.batchFind(ids, tx)
}

function refExperimentDesignBatchResolver(ids, tx) {
  return db.experimentDesign.batchFind(ids, tx)
}

function refFactorTypeBatchResolver(ids, tx) {
  return db.factorType.batchFind(ids, tx)
}

function refGroupTypeBatchResolver(ids, tx) {
  return db.groupType.batchFind(ids, tx)
}

function refUnitSpecBatchResolver(ids, tx) {
  return db.unitSpecification.batchFind(ids, tx)
}

function refUnitTypeBatchResolver(ids, tx) {
  return db.unitType.batchFind(ids, tx)
}

function setBySetIdsBatchResolver(ids, tx) {
  return db.group.batchFindAllBySetIds(ids, tx)
}

function treatmentBatchResolver(ids, tx) {
  return db.treatment.batchFind(ids, tx)
}

function treatmentByExperimentIdsBatchResolver(ids, tx) {
  return db.treatment.batchFindAllByExperimentId(ids, tx)
}

function unitBatchResolver(ids, tx) {
  return db.unit.batchFindAllByGroupIdsAndGroupByGroupId(ids, tx)
}

function unitByExperimentIdBatchResolver(ids, tx) {
  return db.unit.batchfindAllByExperimentIds(ids, tx)
}

// function unitsBySetIdBatchResolver(ids, tx) {
//   return db.unit.batchFindAllBySetIdRaw(ids, tx)
// }

function unitSpecDetailBatchResolver(ids, tx) {
  return db.unitSpecificationDetail.batchFind(ids, tx)
}

function unitSpecDetailByExperimentIdsBatchResolver(ids, tx) {
  return db.unitSpecificationDetail.batchFindAllByExperimentId(ids, tx)
}

const transactionalBatchResolverWrapper =
    tx => (batchResolverFunction => (ids => batchResolverFunction(ids, tx)))

function createLoaders(tx) {
  const transactionalWrapper = transactionalBatchResolverWrapper(tx)
  const createDataLoader = batchResolver => new DataLoader(transactionalWrapper(batchResolver))
  return {
    associatedFactorLevel: createDataLoader(associatedFactorLevelBatchResolver),
    combinationElement: createDataLoader(combinationElementBatchResolver),
    combinationElementByTreatmentIds:
      createDataLoader(combinationElementByTreatmentIdsBatchResolver),
    dependentVariable: createDataLoader(dependentVariableBatchResolver),
    dependentVariableByExperimentIds: createDataLoader(
      dependentVariableByExperimentIdsBatchResolver),
    designSpecDetail: createDataLoader(designSpecDetailBatchResolver),
    designSpecDetailByExperimentIds: createDataLoader(designSpecDetailByExperimentIdsBatchResolver),
    experiment: createDataLoader(experimentBatchResolver),
    experiments: createDataLoader(experimentsBatchResolver),
    factor: createDataLoader(factorBatchResolver),
    factorByExperimentIds: createDataLoader(factorByExperimentIdsBatchResolver),
    factorLevel: createDataLoader(factorLevelBatchResolver),
    factorLevelByFactorIds: createDataLoader(factorLevelByFactorIdsBatchResolver),
    factorLevelAssociation: createDataLoader(factorLevelAssociationBatchResolver),
    group: createDataLoader(groupBatchResolver),
    groupsByExperimentIds: createDataLoader(groupByExperimentIdsBatchResolver),
    groupByParentIds: createDataLoader(groupByParentIdsBatchResolver),
    groupValue: createDataLoader(groupValueBatchResolver),
    nestedFactorLevel: createDataLoader(nestedFactorLevelBatchResolver),
    owner: createDataLoader(ownerBatchResolver),
    refDataSource: createDataLoader(refDataSourceBatchResolver),
    refDataSourceType: createDataLoader(refDataSourceTypeBatchResolver),
    refDesignSpec: createDataLoader(refDesignSpecBatchResolver),
    refExperimentDesign: createDataLoader(refExperimentDesignBatchResolver),
    refFactorType: createDataLoader(refFactorTypeBatchResolver),
    refGroupType: createDataLoader(refGroupTypeBatchResolver),
    refUnitSpec: createDataLoader(refUnitSpecBatchResolver),
    refUnitType: createDataLoader(refUnitTypeBatchResolver),
    setBySetIds: createDataLoader(setBySetIdsBatchResolver),
    treatment: createDataLoader(treatmentBatchResolver),
    treatmentByExperimentIds: createDataLoader(treatmentByExperimentIdsBatchResolver),
    unit: createDataLoader(unitBatchResolver),
    unitByExperimentIds: createDataLoader(unitByExperimentIdBatchResolver),
    // unitsBySetId: createDataLoader(unitsBySetIdBatchResolver),
    unitSpecDetail: createDataLoader(unitSpecDetailBatchResolver),
    unitSpecDetailByExperimentIds: createDataLoader(unitSpecDetailByExperimentIdsBatchResolver),
  }
}

module.exports = { createLoaders }
