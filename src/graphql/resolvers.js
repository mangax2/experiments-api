import {
  has, property, compact, uniq,
} from 'lodash'
import settings from '../config/settings'

const maxIdCountCheck = (ids, maxLength) => {
  if (ids.length > maxLength) {
    throw new Error(`Request input ids exceeded the maximum length of ${maxLength}`)
  }
}

const emptyInputIdCheck = (ids) => {
  if (Array.isArray(ids) && ids.length === 0) {
    throw new Error('Should have at least one input id')
  }
}

export default {
  Query: {
    getExperimentById: (entity, args, context) =>
      context.loaders.experiment.load({ id: args.id, allowTemplate: args.allowTemplate }),
    getExperimentsByIds: (entity, args, context) => {
      maxIdCountCheck(args.ids, settings.maxExperimentsToRetrieve)
      return Promise.all(
        uniq(args.ids).map(id =>
          context.loaders.experiment.load({ id, allowTemplate: args.allowTemplate }),
        ))
        .then(experiments => compact(experiments))
    },
    getExperimentsByCriteria: (entity, args, context) =>
      context.loaders.experimentsByCriteria.load(
        { criteria: args.criteria, value: args.value, isTemplate: false }),
    getExperimentsByName: (entity, args, context) =>
      context.loaders.experimentsByName.load(args.name),
    // 'null' is passed here because the load function won't take null
    // and a string is an invalid type for this call, so it's guaranteed to act the way we need
    getExperimentBySetId: (entity, args, context) =>
      context.loaders.experimentBySetId.load(args.setId || 'null'),
    getTemplateById: (entity, args, context) =>
      context.loaders.template.load(args.id),
    getTemplatesByCriteria: (entity, args, context) =>
      context.loaders.experimentsByCriteria.load(
        { criteria: args.criteria, value: args.value, isTemplate: true }),
    // -1 is passed here because these loaders load all experiments/templates,
    // so the ID is irrelevant.
    // It is specified because data loader requires an ID to associate with cached results.
    getAllExperiments: (entity, args, context) =>
      context.loaders.experiments.load(-1),
    getAllTemplates: (entity, args, context) =>
      context.loaders.templates.load(-1),
    getTreatmentVariablesByExperimentId: (entity, args, context) =>
      context.loaders.factorByExperimentIds.load(args.experimentId),
    getTreatmentsByExperimentId: (entity, args, context) =>
      context.loaders.treatmentByExperimentIds.load(args.experimentId),
    getUnitSpecificationDetailsByExperimentId: (entity, args, context) =>
      context.loaders.unitSpecDetailByExperimentIds.load(args.experimentId),
    getDesignSpecificationDetailsByExperimentId: (entity, args, context) =>
      context.loaders.designSpecDetailByExperimentIds.load(args.experimentId),
    getGroupsByExperimentId: (entity, args, context) =>
      context.loaders.groupsByExperimentIds.load(args.experimentId),
    getUnitsByExperimentId: (entity, args, context) =>
      context.loaders.unitByExperimentIds.load(args.experimentId),
    getSetBySetId: (entity, args, context) =>
      context.loaders.setBySetIds.load(args.setId),
    getSetsBySetId: (entity, args, context) =>
      context.loaders.setsBySetIds.load(args.setIds),
    getSetEntriesBySetId: (entity, args, context) => {
      emptyInputIdCheck(args.setId)
      return context.loaders.unitsBySetId.load(args.setId)
    },
    getTreatmentsBySetId: (entity, args, context) => {
      emptyInputIdCheck(args.setId)
      return context.loaders.treatmentBySetIds.load(args.setId)
    },
    getBlocksByBlockIds: (entity, args, context) => {
      emptyInputIdCheck(args.blockId)
      maxIdCountCheck(args.blockId, settings.maxBlocksToRetrieve)
      return context.loaders.blocksByBlockIds.load(args.blockId)
    },
  },
  AssociatedSet: {
    blockId: property('block_id'),
    blockName: property('block_name'),
    setId: property('set_id'),
  },
  Block: {
    experimentId: property('experiment_id'),
    auditInfo: (entity, args, context) =>
      context.getAuditInfo(entity),
    units: (entity, args, context) =>
      context.loaders.unitsByBlockIds.load(entity.id),
  },
  CombinationElement: {
    treatmentVariableLevelId: property('factor_level_id'),
    treatmentId: property('treatment_id'),
    auditInfo: (entity, args, context) =>
      context.getAuditInfo(entity),
    treatmentVariableLevel: (entity, args, context) =>
      context.loaders.factorLevel.load(entity.factor_level_id),
  },
  ResponseVariable: {
    questionCode: property('question_code'),
    experimentId: property('experiment_id'),
    auditInfo: (entity, args, context) =>
      context.getAuditInfo(entity),
  },
  Experiment: {
    capacityRequestSyncDate: property('capacity_request_sync_date'),
    randomizationStrategyCode: property('randomization_strategy_code'),
    isTemplate: property('is_template'),
    auditInfo: (entity, args, context) =>
      context.getAuditInfo(entity),
    responseVariables: (entity, args, context) =>
      context.loaders.dependentVariableByExperimentIds.load(entity.id),
    designSpecifications: (entity, args, context) =>
      context.loaders.designSpecDetailByExperimentIds.load(entity.id),
    treatmentVariables: (entity, args, context) =>
      context.loaders.factorByExperimentIds.load(entity.id),
    groups: (entity, args, context) =>
      context.loaders.groupsByExperimentIds.load(entity.id),
    groupsJSON: (entity, args, context) =>
      context.loaders.groupsByExperimentIds.load(entity.id),
    owners: (entity, args, context) =>
      context.loaders.ownersByExperimentIds.load(entity.id),
    treatments: (entity, args, context) =>
      context.loaders.treatmentByExperimentIds.load(entity.id),
    unitSpecificationDetails: (entity, args, context) =>
      context.loaders.unitSpecDetailByExperimentIds.load(entity.id),
    units: (entity, args, context) =>
      context.loaders.unitByExperimentIds.load(entity.id),
    analysisModel: (entity, args, context) =>
      context.loaders.analysisModel.load(entity.id),
    associatedSets: (entity, args, context) =>
      context.loaders.locationAssociationByExperimentId.load(entity.id),
    tags: (entity, args, context) =>
      context.loaders.tagsByExperimentId.load({ id: entity.id, isTemplate: entity.is_template }),
  },
  ExperimentalSet: {
    groupsJSON: (entity, args, context) =>
      context.loaders.groupsJsonsBySetIds.load(entity.setId),
    setEntries: (entity, args, context) =>
      context.loaders.unitsBySetId.load([entity.setId]),
  },
  ExperimentalUnit: {
    treatmentId: entity => (has(entity, 'treatment_id') ? entity.treatment_id : entity.treatmentId),
    treatment: (entity, args, context) =>
      context.loaders.treatmentByTreatmentId.load(entity.treatment_id),
    setEntryId: entity => (has(entity, 'set_entry_id') ? entity.set_entry_id : entity.setEntryId),
    deactivationReason: entity => (has(entity, 'deactivation_reason') ? entity.deactivation_reason : entity.deactivationReason),
    blockId: entity => (has(entity, 'block_id') ? entity.block_id : entity.blockId),
  },
  ExperimentInfo: {
    capacityRequestSyncDate: property('capacity_request_sync_date'),
    randomizationStrategyCode: property('randomization_strategy_code'),
    auditInfo: (entity, args, context) =>
      context.getAuditInfo(entity),
    owners: (entity, args, context) =>
      context.loaders.ownersByExperimentIds.load(entity.id),
    analysisModel: (entity, args, context) =>
      context.loaders.analysisModel.load(entity.id),
  },
  TreatmentVariable: {
    experimentId: property('experiment_id'),
    auditInfo: (entity, args, context) =>
      context.getAuditInfo(entity),
    treatmentVariableLevels: (entity, args, context) =>
      context.loaders.factorLevelByFactorIds.load(entity.id),
    isBlockingFactorOnly: property('is_blocking_factor_only'),
  },
  TreatmentVariableLevel: {
    valueJSON: property('value'),
    treatmentVariableId: property('factor_id'),
    auditInfo: (entity, args, context) =>
      context.getAuditInfo(entity),
    treatmentVariable: (entity, args, context) =>
      (entity.factor_id
        ? context.loaders.factor.load(entity.factor_id)
        : Promise.resolve(null)),
    nestedLevels: (entity, args, context) =>
      context.loaders.nestedFactorLevel.load(entity.id),
    associatedLevels: (entity, args, context) =>
      context.loaders.associatedFactorLevel.load(entity.id),
  },
  Group: {
    childGroups: entity => entity.childGroups,
  },
  Owner: {
    experimentId: property('experiment_id'),
    userIds: property('user_ids'),
    groupIds: property('group_ids'),
    auditInfo: (entity, args, context) =>
      context.getAuditInfo(entity),
  },
  Treatment: {
    experimentId: property('experiment_id'),
    isControl: entity => (entity.control_types || []).length > 0,
    controlTypes: property('control_types'),
    treatmentNumber: property('treatment_number'),
    inAllBlocks: property('in_all_blocks'),
    blockId: property('block_id'),
    auditInfo: (entity, args, context) =>
      context.getAuditInfo(entity),
    combinationElements: (entity, args, context) =>
      context.loaders.combinationElementByTreatmentIds.load(entity.id),
  },
  UnitSpecification: {
    uomType: property('uom_type'),
    refUnitTypeId: property('ref_unit_type_id'),
    unitType: (entity, args, context) =>
      (entity.ref_unit_type_id
        ? context.loaders.refUnitType.load(entity.ref_unit_type_id)
        : Promise.resolve(null)),
  },
  UnitSpecificationDetail: {
    uomCode: property('uom_code'),
    refUnitSpecId: property('ref_unit_spec_id'),
    experimentId: property('experiment_id'),
    auditInfo: (entity, args, context) =>
      context.getAuditInfo(entity),
    unitSpecification: (entity, args, context) =>
      (entity.ref_unit_spec_id
        ? context.loaders.refUnitSpec.load(entity.ref_unit_spec_id)
        : Promise.resolve(null)),
  },
  AnalysisModel: {
    experimentId: property('experiment_id'),
    auditInfo: (entity, args, context) =>
      context.getAuditInfo(entity),
    analysisModelType: property('analysis_model_type'),
    analysisModelSubType: property('analysis_model_sub_type'),
  },
}
