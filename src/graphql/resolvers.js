import { property } from 'lodash'

export default {
  Query: {
    getExperimentById: (entity, args, context) =>
      context.loaders.experiment.load(args.id),
    getExperimentsByName: (entity, args, context) =>
      context.loaders.experimentsByName.load(args.name),
    getTemplateById: (entity, args, context) =>
      context.loaders.template.load(args.id),
    // -1 is passed here because these loaders load all experiments/templates,
    // so the ID is irrelevant.
    // It is specified because data loader requires an ID to associate with cached results.
    getAllExperiments: (entity, args, context) =>
      context.loaders.experiments.load(-1),
    getAllTemplates: (entity, args, context) =>
      context.loaders.templates.load(-1),
    getFactorsByExperimentId: (entity, args, context) =>
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
    getSetEntriesBySetId: (entity, args, context) =>
      context.loaders.unitsBySetId.load(args.setId),
    getTreatmentsBySetId: (entity, args, context) =>
      context.loaders.treatmentBySetIds.load(args.setId),
  },
  CombinationElement: {
    factorLevelId: property('factor_level_id'),
    treatmentId: property('treatment_id'),
    auditInfo: (entity, args, context) =>
      context.getAuditInfo(entity),
    factorLevel: (entity, args, context) =>
      context.loaders.factorLevel.load(entity.factor_level_id),
  },
  DependentVariable: {
    questionCode: property('question_code'),
    experimentId: property('experiment_id'),
    auditInfo: (entity, args, context) =>
      context.getAuditInfo(entity),
  },
  DesignSpecificationDetail: {
    refDesignSpecId: property('ref_design_spec_id'),
    experimentId: property('experiment_id'),
    auditInfo: (entity, args, context) =>
      context.getAuditInfo(entity),
    designSpecification: (entity, args, context) =>
      (entity.ref_design_spec_id
        ? context.loaders.refDesignSpec.load(entity.ref_design_spec_id)
        : Promise.resolve(null)),
  },
  Experiment: {
    capacityRequestSyncDate: property('capacity_request_sync_date'),
    auditInfo: (entity, args, context) =>
      context.getAuditInfo(entity),
    dependentVariables: (entity, args, context) =>
      context.loaders.dependentVariableByExperimentIds.load(entity.id),
    designSpecifications: (entity, args, context) =>
      context.loaders.designSpecDetailByExperimentIds.load(entity.id),
    factors: (entity, args, context) =>
      context.loaders.factorByExperimentIds.load(entity.id),
    groups: (entity, args, context) =>
      context.loaders.groupsByExperimentIds.load(entity.id),
    owners: (entity, args, context) =>
      context.loaders.ownersByExperimentIds.load(entity.id),
    treatments: (entity, args, context) =>
      context.loaders.treatmentByExperimentIds.load(entity.id),
    unitSpecificationDetails: (entity, args, context) =>
      context.loaders.unitSpecDetailByExperimentIds.load(entity.id),
    units: (entity, args, context) =>
      context.loaders.unitByExperimentIds.load(entity.id),
  },
  ExperimentalSet: {
    groupId: property('group_id'),
    experimentId: property('experiment_id'),
    refRandomizationStrategyId: property('ref_randomization_strategy_id'),
    refGroupTypeId: property('ref_group_type_id'),
    setId: property('set_id'),
    groupType: (entity, args, context) =>
      (entity.ref_group_type_id
        ? context.loaders.refGroupType.load(entity.ref_group_type_id)
        : Promise.resolve(null)),
    groupValues: (entity, args, context) =>
      context.loaders.groupValue.load(entity.id),
    setEntries: (entity, args, context) =>
      (entity.set_id
        ? context.loaders.unitsBySetId.load(entity.set_id)
        : Promise.resolve(null)),
  },
  ExperimentalUnit: {
    groupId: property('group_id'),
    treatmentId: property('treatment_id'),
    setEntryId: property('set_entry_id'),
  },
  ExperimentInfo: {
    capacityRequestSyncDate: property('capacity_request_sync_date'),
    auditInfo: (entity, args, context) =>
      context.getAuditInfo(entity),
    owners: (entity, args, context) =>
      context.loaders.ownersByExperimentIds.load(entity.id),
  },
  Factor: {
    experimentId: property('experiment_id'),
    refFactorTypeId: property('ref_factor_type_id'),
    auditInfo: (entity, args, context) =>
      context.getAuditInfo(entity),
    factorType: (entity, args, context) =>
      (entity.ref_factor_type_id
        ? context.loaders.refFactorType.load(entity.ref_factor_type_id)
        : Promise.resolve(null)),
    factorLevels: (entity, args, context) =>
      context.loaders.factorLevelByFactorIds.load(entity.id),
  },
  FactorLevel: {
    valueJSON: property('value'),
    factorId: property('factor_id'),
    auditInfo: (entity, args, context) =>
      context.getAuditInfo(entity),
    factor: (entity, args, context) =>
      (entity.factor_id
        ? context.loaders.factor.load(entity.factor_id)
        : Promise.resolve(null)),
    nestedLevels: (entity, args, context) =>
      context.loaders.nestedFactorLevel.load(entity.id),
    associatedLevels: (entity, args, context) =>
      context.loaders.associatedFactorLevel.load(entity.id),
  },
  Group: {
    experimentId: property('experiment_id'),
    parentId: property('parent_id'),
    refRandomizationStrategyId: property('ref_randomization_strategy_id'),
    refGroupTypeId: property('ref_group_type_id'),
    setId: property('set_id'),
    groupType: (entity, args, context) =>
      (entity.ref_group_type_id
        ? context.loaders.refGroupType.load(entity.ref_group_type_id)
        : Promise.resolve(null)),
    groupValues: (entity, args, context) =>
      context.loaders.groupValue.load(entity.id),
    units: (entity, args, context) =>
      context.loaders.unit.load(entity.id),
  },
  GroupValue: {
    factorLevelId: property('factor_level_id'),
    groupId: property('group_id'),
    auditInfo: (entity, args, context) =>
      context.getAuditInfo(entity),
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
    isControl: property('is_control'),
    treatmentNumber: property('treatment_number'),
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
    uomId: property('uom_id'),
    refUnitSpecId: property('ref_unit_spec_id'),
    experimentId: property('experiment_id'),
    auditInfo: (entity, args, context) =>
      context.getAuditInfo(entity),
    unitSpecification: (entity, args, context) =>
      (entity.ref_unit_spec_id
        ? context.loaders.refUnitSpec.load(entity.ref_unit_spec_id)
        : Promise.resolve(null)),
  },
}
