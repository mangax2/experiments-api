import _ from 'lodash'
import DataLoader from 'dataloader'
import { dbRead } from '../db/DbManager'
import DesignSpecificationDetailService from '../services/DesignSpecificationDetailService'
import ExperimentsService from '../services/ExperimentsService'
import GroupExperimentalUnitService from '../services/GroupExperimentalUnitService'
import TagService from '../services/TagService'
import TreatmentWithBlockService from '../services/TreatmentWithBlockService'
import ExperimentalUnitService from '../services/ExperimentalUnitService'

function experimentBatchLoaderCallback(args) {
  const ids = _.map(args, arg => arg.id)
  return dbRead.experiments.batchFind(ids).then(data => _.map(data, (individualData) => {
    if (!_.get(individualData, 'is_template')) {
      return individualData
    }
    if (_.find(args, { id: individualData.id, allowTemplate: true })) {
      return individualData
    }
    return null
  }))
}

function experimentsBatchLoaderCallback() {
  return dbRead.experiments.all(false).then(data => [data])
}

function templateBatchLoaderCallback(ids) {
  return dbRead.experiments.batchFindExperimentOrTemplate(ids, true)
}

function templatesBatchLoaderCallback() {
  return dbRead.experiments.all(true).then(data => [data])
}
// This function is to be used for one-to-one relationships
// (e.g. Each Experiment has one and only one Analysis Model)
const createDataLoader = batchLoaderCallback =>
  new DataLoader(ids => batchLoaderCallback(ids))

const createMultiDataLoader = batchLoaderCallback =>
  new DataLoader(args => Promise.all(_.map(args, arg => batchLoaderCallback(arg))))

function createLoaders() {
  const experimentsByCriteriaLoader = createMultiDataLoader(
    new ExperimentsService().getExperimentsByCriteria)

  const treatmentBySetIdLoader = createMultiDataLoader(
    new TreatmentWithBlockService().getTreatmentsByBySetIds)

  const unitsBySetIdLoader = createMultiDataLoader(
    new ExperimentalUnitService().getExperimentalUnitsBySetIds)

  const groupByIdLoader = createMultiDataLoader(
    new GroupExperimentalUnitService().getGroupsAndUnits)

  const groupJsonBySetIdLoader = createMultiDataLoader(
    new GroupExperimentalUnitService().getGroupsAndUnitsForSet)

  const groupBySetIdLoader = createMultiDataLoader(
    new GroupExperimentalUnitService().getSetInformationBySetId)

  const setsBySetIdsLoader = createMultiDataLoader(
    new GroupExperimentalUnitService().getSetInformationBySetIds)

  const designSpecDetailByExperimentIdLoader = createMultiDataLoader(
    arg => new DesignSpecificationDetailService().getAdvancedParameters(arg)
      .then(result => [result]))

  const treatmentByExperimentIdLoader = createMultiDataLoader(
    new TreatmentWithBlockService().getTreatmentsByExperimentId)

  const unitsByExperimentIdLoader = createMultiDataLoader(
    new ExperimentalUnitService().getExperimentalUnitsByExperimentIdNoValidate)

  const blocksByBlockIdsLoader = createMultiDataLoader(dbRead.block.batchFind)
  const locationAssociationByExperimentIdsLoader = createMultiDataLoader(
    dbRead.locationAssociation.findByExperimentId)

  const tagsByExperimentIdLoader = createMultiDataLoader(
    arg => new TagService().getTagsByExperimentId(arg.id, arg.isTemplate))

  // Loaders that load by ID
  const combinationElementByIdLoader = createDataLoader(dbRead.combinationElement.batchFind)
  const dependentVariableByIdLoader = createDataLoader(dbRead.dependentVariable.batchFind)
  const experimentByIdLoader = createDataLoader(experimentBatchLoaderCallback)
  const experimentBySetIdLoader =
    createDataLoader(dbRead.locationAssociation.batchFindExperimentBySetId)
  const factorLevelByIdLoader = createDataLoader(dbRead.factorLevel.batchFind)
  const factorLevelAssociationByIdLoader = createDataLoader(dbRead.factorLevelAssociation.batchFind)
  const factorByIdLoader = createDataLoader(dbRead.factor.batchFind)
  const ownerByIdLoader = createDataLoader(dbRead.owner.batchFind)
  const refDataSourceByIdLoader = createDataLoader(dbRead.refDataSource.batchFind)
  const refDataSourceTypeByIdLoader = createDataLoader(dbRead.refDataSourceType.batchFind)
  const refDesignSpecByIdLoader = createDataLoader(dbRead.refDesignSpecification.batchFind)
  const refFactorTypeByIdLoader = createDataLoader(dbRead.factorType.batchFind)
  const refUnitSpecByIdLoader = createDataLoader(dbRead.unitSpecification.batchFind)
  const refUnitTypeByIdLoader = createDataLoader(dbRead.unitType.batchFind)
  const templateByIdLoader = createDataLoader(templateBatchLoaderCallback)
  const treatmentByTreatmentIdLoader = createDataLoader(dbRead.treatment.batchFind)
  const unitSpecDetailByIdLoader = createDataLoader(dbRead.unitSpecificationDetail.batchFind)
  const analysisModelByIdLoader = createDataLoader(dbRead.analysisModel.batchFindByExperimentIds)
  const unitsByBlockIdsLoader = createDataLoader(dbRead.unit.batchFindByBlockIds)
  const treatmentVariableLevelDetailsLoader =
    createDataLoader(dbRead.treatmentVariableLevelDetails.batchFind)

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
    dbRead.factorLevelAssociation.batchFindAssociatedLevels, factorLevelByIdLoader)

  const combinationElementsByTreatmentIdLoader = createLoaderToPrimeCacheOfChildren(
    dbRead.combinationElement.batchFindAllByTreatmentIds, combinationElementByIdLoader)

  const factorByExperimentIdLoader = createLoaderToPrimeCacheOfChildren(
    dbRead.factor.batchFindByExperimentId, factorByIdLoader)

  const dependentVariableByExperimentIdLoader = createLoaderToPrimeCacheOfChildren(
    dbRead.dependentVariable.batchFindByExperimentId, dependentVariableByIdLoader)

  const factorLevelByFactorIdLoader = createLoaderToPrimeCacheOfChildren(
    dbRead.factorLevel.batchFindByFactorId, factorLevelByIdLoader)

  const groupByExperimentIdLoader = createLoaderToPrimeCacheOfChildren(
    new GroupExperimentalUnitService().getGroupsAndUnitsByExperimentIds, groupByIdLoader)

  const groupJsonsBySetIdLoader = createLoaderToPrimeCacheOfChildren(
    new GroupExperimentalUnitService().getGroupsAndUnitsBySetIds, groupJsonBySetIdLoader)

  const nestedFactorLevelByAssociatedFactorLevelIds = createLoaderToPrimeCacheOfChildren(
    dbRead.factorLevelAssociation.batchFindNestedLevels, factorLevelByIdLoader)

  const ownerByExperimentIdLoader = createLoaderToPrimeCacheOfChildren(
    dbRead.owner.batchFindByExperimentIds, ownerByIdLoader)

  const unitSpecDetailByExperimentIdLoader = createLoaderToPrimeCacheOfChildren(
    dbRead.unitSpecificationDetail.batchFindAllByExperimentId, unitSpecDetailByIdLoader)

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
    experimentsByName: createMultiDataLoader(dbRead.experiments.batchFindExperimentsByName),
    experimentsByPartialName:
      createMultiDataLoader(dbRead.experiments.batchFindExperimentsByPartialName),
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
    treatmentVariableLevelDetails: treatmentVariableLevelDetailsLoader,
  }
}

module.exports = { createLoaders, experimentBatchLoaderCallback }
