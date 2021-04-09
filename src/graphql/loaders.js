import _ from 'lodash'
import DataLoader from 'dataloader'
import db from '../db/DbManager'
import DesignSpecificationDetailService from '../services/DesignSpecificationDetailService'
import ExperimentsService from '../services/ExperimentsService'
import GroupExperimentalUnitService from '../services/GroupExperimentalUnitService'
import TagService from '../services/TagService'
import TreatmentWithBlockService from '../services/TreatmentWithBlockService'
import ExperimentalUnitService from '../services/ExperimentalUnitService'

function experimentBatchLoaderCallback(args, tx) {
  const ids = _.map(args, arg => arg.id)
  return db.experiments.batchFind(ids, tx).then(data => _.map(data, (individualData) => {
    if (!_.get(individualData, 'is_template')) {
      return individualData
    }
    if (_.find(args, { id: individualData.id, allowTemplate: true })) {
      return individualData
    }
    return null
  }))
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

  // This function is to be used for one-to-one relationships
  // (e.g. Each Experiment has one and only one Analysis Model)
  const createDataLoader = batchLoaderCallback =>
    new DataLoader(transactionalWrapper(batchLoaderCallback))

  const experimentsByCriteriaLoader =
    new DataLoader(args =>
      tx.batch(_.map(args, arg => new ExperimentsService().getExperimentsByCriteria(arg, tx))))

  const treatmentBySetIdLoader =
      new DataLoader(args =>
        tx.batch(_.map(args, arg =>
          new TreatmentWithBlockService().getTreatmentsByBySetIds(arg, tx))))

  const unitsBySetIdLoader =
      new DataLoader(args =>
        tx.batch(_.map(args, arg =>
          new ExperimentalUnitService().getExperimentalUnitsBySetIds(arg, tx))))

  const groupByIdLoader =
    new DataLoader(args =>
      tx.batch(_.map(args, arg =>
        new GroupExperimentalUnitService().getGroupsAndUnits(arg, tx))))

  const groupJsonBySetIdLoader =
    new DataLoader(args =>
      tx.batch(_.map(args, arg =>
        new GroupExperimentalUnitService().getGroupsAndUnitsForSet(arg, tx))))

  const groupBySetIdLoader =
    new DataLoader(args =>
      tx.batch(_.map(args, arg =>
        new GroupExperimentalUnitService().getSetInformationBySetId(arg, tx))))

  const setsBySetIdsLoader =
    new DataLoader(args =>
      tx.batch(_.map(args, arg =>
        new GroupExperimentalUnitService().getSetInformationBySetIds(arg, tx))))

  const designSpecDetailByExperimentIdLoader =
    new DataLoader(args =>
      tx.batch(_.map(args, arg =>
        new DesignSpecificationDetailService().getAdvancedParameters(arg, tx)
          .then(result => [result]))))

  const treatmentByExperimentIdLoader =
    new DataLoader(args =>
      tx.batch(_.map(args, arg =>
        new TreatmentWithBlockService().getTreatmentsByExperimentId(arg, tx))))

  const unitsByExperimentIdLoader =
    new DataLoader(args =>
      tx.batch(_.map(args, arg =>
        new ExperimentalUnitService().getExperimentalUnitsByExperimentIdNoValidate(arg, tx))))

  const blocksByBlockIdsLoader =
    new DataLoader(args =>
      tx.batch(_.map(args, arg => db.block.batchFind(arg, tx))))

  const locationAssociationByExperimentIdsLoader =
    new DataLoader(args =>
      tx.batch(_.map(args, arg => db.locationAssociation.findByExperimentId(arg, tx))))

  const tagsByExperimentIdLoader =
    new DataLoader(args =>
      tx.batch(_.map(args, arg =>
        new TagService().getTagsByExperimentId(arg, false, tx))))

  // Loaders that load by ID
  const combinationElementByIdLoader = createDataLoader(db.combinationElement.batchFind)
  const dependentVariableByIdLoader = createDataLoader(db.dependentVariable.batchFind)
  const experimentByIdLoader = createDataLoader(experimentBatchLoaderCallback)
  const experimentBySetIdLoader =
    createDataLoader(db.locationAssociation.batchFindExperimentBySetId)
  const factorLevelByIdLoader = createDataLoader(db.factorLevel.batchFind)
  const factorLevelAssociationByIdLoader = createDataLoader(db.factorLevelAssociation.batchFind)
  const factorByIdLoader = createDataLoader(db.factor.batchFind)
  const ownerByIdLoader = createDataLoader(db.owner.batchFind)
  const refDataSourceByIdLoader = createDataLoader(db.refDataSource.batchFind)
  const refDataSourceTypeByIdLoader = createDataLoader(db.refDataSourceType.batchFind)
  const refDesignSpecByIdLoader = createDataLoader(db.refDesignSpecification.batchFind)
  const refFactorTypeByIdLoader = createDataLoader(db.factorType.batchFind)
  const refUnitSpecByIdLoader = createDataLoader(db.unitSpecification.batchFind)
  const refUnitTypeByIdLoader = createDataLoader(db.unitType.batchFind)
  const templateByIdLoader = createDataLoader(templateBatchLoaderCallback)
  const treatmentByTreatmentIdLoader = createDataLoader(db.treatment.batchFind)
  const unitSpecDetailByIdLoader = createDataLoader(db.unitSpecificationDetail.batchFind)
  const analysisModelByIdLoader = createDataLoader(db.analysisModel.batchFindByExperimentIds)
  const unitsByBlockIdsLoader = createDataLoader(db.unit.batchFindByBlockIds)

  // Loaders that load by parent ID.  These prime the caches of loaders that load by entity ID.
  function createLoaderToPrimeCacheOfChildren(dbCallback, loaderPrimeTarget) {
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

  const associatedFactorLevelsByNestedFactorLevelIds = createLoaderToPrimeCacheOfChildren(
    db.factorLevelAssociation.batchFindAssociatedLevels, factorLevelByIdLoader)

  const combinationElementsByTreatmentIdLoader = createLoaderToPrimeCacheOfChildren(
    db.combinationElement.batchFindAllByTreatmentIds, combinationElementByIdLoader)

  const factorByExperimentIdLoader = createLoaderToPrimeCacheOfChildren(
    db.factor.batchFindByExperimentId, factorByIdLoader)

  const dependentVariableByExperimentIdLoader = createLoaderToPrimeCacheOfChildren(
    db.dependentVariable.batchFindByExperimentId, dependentVariableByIdLoader)

  const factorLevelByFactorIdLoader = createLoaderToPrimeCacheOfChildren(
    db.factorLevel.batchFindByFactorId, factorLevelByIdLoader)

  const groupByExperimentIdLoader = createLoaderToPrimeCacheOfChildren(
    new GroupExperimentalUnitService().getGroupsAndUnitsByExperimentIds, groupByIdLoader)

  const groupJsonsBySetIdLoader = createLoaderToPrimeCacheOfChildren(
    new GroupExperimentalUnitService().getGroupsAndUnitsBySetIds, groupJsonBySetIdLoader)

  const nestedFactorLevelByAssociatedFactorLevelIds = createLoaderToPrimeCacheOfChildren(
    db.factorLevelAssociation.batchFindNestedLevels, factorLevelByIdLoader)

  const ownerByExperimentIdLoader = createLoaderToPrimeCacheOfChildren(
    db.owner.batchFindByExperimentIds, ownerByIdLoader)

  const unitSpecDetailByExperimentIdLoader = createLoaderToPrimeCacheOfChildren(
    db.unitSpecificationDetail.batchFindAllByExperimentId, unitSpecDetailByIdLoader)

  return {
    associatedFactorLevel: associatedFactorLevelsByNestedFactorLevelIds,
    blocksByBlockIds: blocksByBlockIdsLoader,
    combinationElement: combinationElementByIdLoader,
    combinationElementByTreatmentIds: combinationElementsByTreatmentIdLoader,
    dependentVariable: dependentVariableByIdLoader,
    dependentVariableByExperimentIds: dependentVariableByExperimentIdLoader,
    designSpecDetailByExperimentIds: designSpecDetailByExperimentIdLoader,
    experiment: experimentByIdLoader,
    experimentBySetId: experimentBySetIdLoader,
    experiments: createDataLoader(experimentsBatchLoaderCallback),
    experimentsByCriteria: experimentsByCriteriaLoader,
    experimentsByName: createDataLoader(db.experiments.batchFindExperimentsByName),
    factor: factorByIdLoader,
    factorByExperimentIds: factorByExperimentIdLoader,
    factorLevel: factorLevelByIdLoader,
    factorLevelByFactorIds: factorLevelByFactorIdLoader,
    factorLevelAssociation: factorLevelAssociationByIdLoader,
    group: groupByIdLoader,
    groupsByExperimentIds: groupByExperimentIdLoader,
    groupsJsonsBySetIds: groupJsonsBySetIdLoader,
    nestedFactorLevel: nestedFactorLevelByAssociatedFactorLevelIds,
    owner: ownerByIdLoader,
    ownersByExperimentIds: ownerByExperimentIdLoader,
    refDataSource: refDataSourceByIdLoader,
    refDataSourceType: refDataSourceTypeByIdLoader,
    refDesignSpec: refDesignSpecByIdLoader,
    refFactorType: refFactorTypeByIdLoader,
    refUnitSpec: refUnitSpecByIdLoader,
    refUnitType: refUnitTypeByIdLoader,
    setBySetIds: groupBySetIdLoader,
    setsBySetIds: setsBySetIdsLoader,
    tagsByExperimentId: tagsByExperimentIdLoader,
    template: templateByIdLoader,
    templates: createDataLoader(templatesBatchLoaderCallback),
    treatmentByExperimentIds: treatmentByExperimentIdLoader,
    treatmentByTreatmentId: treatmentByTreatmentIdLoader,
    treatmentBySetIds: treatmentBySetIdLoader,
    unitByExperimentIds: unitsByExperimentIdLoader,
    unitsByBlockIds: unitsByBlockIdsLoader,
    unitsBySetId: unitsBySetIdLoader,
    unitSpecDetail: unitSpecDetailByIdLoader,
    unitSpecDetailByExperimentIds: unitSpecDetailByExperimentIdLoader,
    analysisModel: analysisModelByIdLoader,
    locationAssociationByExperimentId: locationAssociationByExperimentIdsLoader,
  }
}

module.exports = { createLoaders, experimentBatchLoaderCallback }
