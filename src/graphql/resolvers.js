function associatedFactorLevelForFactorLevelResolver(entity, args, context) {
  return context.loaders.associatedFactorLevel.load(entity.id)
}

function combinationElementBatchResolver(entity, args, context) {
  return context.loaders.combinationElement.load(entity.id)
}

function combinationElementForTreatmentBatchResolver(entity, args, context) {
  return context.loaders.combinationElementByTreatmentIds.load(entity.id)
}

function dependentVariableBatchResolver(entity, args, context) {
  return context.loaders.dependentVariable.load(entity.id)
}

function dependentVariableForExperimentBatchResolver(entity, args, context) {
  return context.loaders.dependentVariableByExperimentIds.load(entity.id)
}

function designSpecDetailBatchResolver(entity, args, context) {
  return context.loaders.designSpecDetail.load(entity.id)
}

function designSpecDetailByExperimentIdParameterBatchResolver(entity, args, context) {
  return context.loaders.designSpecDetailByExperimentIds.load(args.experimentId)
}

function designSpecDetailForExperimentBatchResolver(entity, args, context) {
  return context.loaders.designSpecDetailByExperimentIds.load(entity.id)
}

function experimentBatchResolver(entity, args, context) {
  return context.loaders.experiment.load(args.id)
}

function experimentsBatchResolver(entity, args, context) {
  // -1 is passed here because this loader loads all experiments, so the ID is irrelevant.
  // It is specified because data loader requires an ID to associate with cached results.
  return context.loaders.experiments.load(-1)
}

function experimentsByNameBatchResolver(entity, args, context) {
  return context.loaders.experimentsByName.load(args.name)
}

function factorBatchResolver(entity, args, context) {
  if (entity.factor_id) {
    return context.loaders.factor.load(entity.factor_id)
  }
  return Promise.resolve(null)
}

function factorByExperimentIdsBatchResolver(entity, args, context) {
  return context.loaders.factorByExperimentIds.load(entity.id)
}

function factorByExperimentIdParameterBatchResolver(entity, args, context) {
  return context.loaders.factorByExperimentIds.load(args.experimentId)
}

function factorLevelBatchResolver(entity, args, context) {
  return context.loaders.factorLevel.load(entity.id)
}

function factorLevelForGroupValueBatchResolver(entity, args, context) {
  if (entity.factor_level_id) {
    return context.loaders.factorLevel.load(entity.factor_level_id)
  }
  return Promise.resolve(null)
}

function factorLevelForCombinationElementBatchResolver(entity, args, context) {
  if (entity.factor_level_id) {
    return context.loaders.factorLevel.load(entity.factor_level_id)
  }
  return Promise.resolve(null)
}

function factorLevelByFactorIdsBatchResolver(entity, args, context) {
  return context.loaders.factorLevelByFactorIds.load(entity.id)
}

function factorLevelAssociationBatchResolver(entity, args, context) {
  return context.loaders.factorLevelAssociation.load(entity.id)
}

function groupBatchResolver(entity, args, context) {
  return context.loaders.group.load(entity.id)
}

function groupByExperimentIdParameterBatchResolver(entity, args, context) {
  return context.loaders.groupsByExperimentIds.load(args.experimentId)
}

function groupsForExperimentBatchResolver(entity, args, context) {
  return context.loaders.groupsByExperimentIds.load(entity.id)
}

function groupForGroupValueBatchResolver(entity, args, context) {
  if (entity.group_id) {
    return context.loaders.group.load(entity.group_id)
  }
  return Promise.resolve(null)
}

function groupForExperimentalUnitBatchResolver(entity, args, context) {
  if (entity.group_id) {
    return context.loaders.group.load(entity.group_id)
  }
  return Promise.resolve(null)
}

function parentGroupBatchResolver(entity, args, context) {
  if (entity.parent_id) {
    return context.loaders.group.load(entity.parent_id)
  }
  return Promise.resolve(null)
}

function childGroupsBatchResolver(entity, args, context) {
  return context.loaders.groupByParentIds.load(entity.id)
}

function groupValueBatchResolver(entity, args, context) {
  return context.loaders.groupValue.load(entity.id)
}

function nestedFactorLevelForFactorLevelResolver(entity, args, context) {
  return context.loaders.nestedFactorLevel.load(entity.id)
}

function ownerBatchResolver(entity, args, context) {
  return context.loaders.owner.load(entity.id)
}

function ownersForExperimentBatchResolver(entity, args, context) {
  return context.loaders.ownersByExperimentIds.load(entity.id)
}

function refDataSourceBatchResolver(entity, args, context) {
  if (entity.ref_data_source_id) {
    return context.loaders.refDataSource.load(entity.ref_data_source_id)
  }
  return Promise.resolve(null)
}

function refDataSourceTypeBatchResolver(entity, args, context) {
  if (entity.ref_data_source_type_id) {
    return context.loaders.refDataSourceType.load(entity.ref_data_source_type_id)
  }
  return Promise.resolve(null)
}

function refDesignSpecBatchResolver(entity, args, context) {
  return context.loaders.refDesignSpec.load(entity.id)
}

function refDesignSpecForDesignSpecDetailBatchResolver(entity, args, context) {
  if (entity.ref_design_spec_id) {
    return context.loaders.refDesignSpec.load(entity.ref_design_spec_id)
  }
  return Promise.resolve(null)
}

function refExperimentDesignBatchResolver(entity, args, context) {
  return context.loaders.refExperimentDesign.load(entity.id)
}

function refFactorTypeBatchResolver(entity, args, context) {
  if (entity.ref_factor_type_id) {
    return context.loaders.refFactorType.load(entity.ref_factor_type_id)
  }
  return Promise.resolve(null)
}

function refGroupTypeBatchResolver(entity, args, context) {
  if (entity.ref_group_type_id) {
    return context.loaders.refGroupType.load(entity.ref_group_type_id)
  }
  return Promise.resolve(null)
}

function refUnitSpecBatchResolver(entity, args, context) {
  return context.loaders.refUnitSpec.load(entity.id)
}

function refUnitSpecForUnitSpecificationDetailBatchResolver(entity, args, context) {
  if (entity.ref_unit_spec_id) {
    return context.loaders.refUnitSpec.load(entity.ref_unit_spec_id)
  }
  return Promise.resolve(null)
}

function refUnitTypeForUnitSpecificationBatchResolver(entity, args, context) {
  if (entity.ref_unit_type_id) {
    return context.loaders.refUnitType.load(entity.ref_unit_type_id)
  }
  return Promise.resolve(null)
}

function setBySetIdParameterBatchResolver(entity, args, context) {
  return context.loaders.setBySetIds.load(args.setId)
}

function templateBatchResolver(entity, args, context) {
  return context.loaders.template.load(args.id)
}

function templatesBatchResolver(entity, args, context) {
  return context.loaders.templates.load(-1)
}

function treatmentBatchResolver(entity, args, context) {
  return context.loaders.treatment.load(entity.id)
}

function treatmentByExperimentIdParameterBatchResolver(entity, args, context) {
  return context.loaders.treatmentByExperimentIds.load(args.experimentId)
}

function treatmentBySetIdParameterBatchResolver(entity, args, context) {
  return context.loaders.treatmentBySetIds.load(args.setId)
}

function treatmentForCombinationElementBatchResolver(entity, args, context) {
  if (entity.treatment_id) {
    return context.loaders.treatment.load(entity.treatment_id)
  }
  return Promise.resolve(null)
}

function treatmentsForExperimentBatchResolver(entity, args, context) {
  return context.loaders.treatmentByExperimentIds.load(entity.id)
}

function treatmentForExperimentalUnitBatchResolver(entity, args, context) {
  if (entity.treatment_id) {
    return context.loaders.treatment.load(entity.treatment_id)
  }
  return Promise.resolve(null)
}

function unitBatchResolver(entity, args, context) {
  return context.loaders.unit.load(entity.id)
}

function unitByExperimentIdParameterBatchResolver(entity, args, context) {
  return context.loaders.unitByExperimentIds.load(args.experimentId)
}

function unitByExperimentIdBatchResolver(entity, args, context) {
  return context.loaders.unitByExperimentIds.load(entity.id)
}

function unitBySetIdParameterBatchResolver(entity, args, context) {
  return context.loaders.unitsBySetId.load(args.setId)
}

function unitBySetIdBatchResolver(entity, args, context) {
  if (entity.set_id) {
    return context.loaders.unitsBySetId.load(entity.set_id)
  }
  return Promise.resolve(null)
}

function unitSpecDetailBatchResolver(entity, args, context) {
  return context.loaders.unitSpecDetail.load(entity.id)
}

function unitSpecDetailByExperimentIdParameterBatchResolver(entity, args, context) {
  return context.loaders.unitSpecDetailByExperimentIds.load(args.experimentId)
}

function unitSpecDetailForExperimentBatchResolver(entity, args, context) {
  return context.loaders.unitSpecDetailByExperimentIds.load(entity.id)
}

module.exports = {
  associatedFactorLevelForFactorLevelResolver,
  combinationElementBatchResolver,
  combinationElementForTreatmentBatchResolver,
  dependentVariableBatchResolver,
  dependentVariableForExperimentBatchResolver,
  designSpecDetailBatchResolver,
  designSpecDetailByExperimentIdParameterBatchResolver,
  designSpecDetailForExperimentBatchResolver,
  experimentBatchResolver,
  experimentsBatchResolver,
  experimentsByNameBatchResolver,
  factorBatchResolver,
  factorByExperimentIdsBatchResolver,
  factorByExperimentIdParameterBatchResolver,
  factorLevelBatchResolver,
  factorLevelForCombinationElementBatchResolver,
  factorLevelForGroupValueBatchResolver,
  factorLevelByFactorIdsBatchResolver,
  factorLevelAssociationBatchResolver,
  groupBatchResolver,
  groupByExperimentIdParameterBatchResolver,
  groupsForExperimentBatchResolver,
  groupForGroupValueBatchResolver,
  groupForExperimentalUnitBatchResolver,
  parentGroupBatchResolver,
  childGroupsBatchResolver,
  groupValueBatchResolver,
  nestedFactorLevelForFactorLevelResolver,
  ownerBatchResolver,
  ownersForExperimentBatchResolver,
  refDataSourceBatchResolver,
  refDataSourceTypeBatchResolver,
  refDesignSpecBatchResolver,
  refDesignSpecForDesignSpecDetailBatchResolver,
  refExperimentDesignBatchResolver,
  refFactorTypeBatchResolver,
  refGroupTypeBatchResolver,
  refUnitSpecBatchResolver,
  refUnitSpecForUnitSpecificationDetailBatchResolver,
  setBySetIdParameterBatchResolver,
  refUnitTypeForUnitSpecificationBatchResolver,
  templateBatchResolver,
  templatesBatchResolver,
  treatmentBatchResolver,
  treatmentByExperimentIdParameterBatchResolver,
  treatmentBySetIdParameterBatchResolver,
  treatmentsForExperimentBatchResolver,
  treatmentForExperimentalUnitBatchResolver,
  treatmentForCombinationElementBatchResolver,
  unitBatchResolver,
  unitByExperimentIdParameterBatchResolver,
  unitByExperimentIdBatchResolver,
  unitBySetIdParameterBatchResolver,
  unitBySetIdBatchResolver,
  unitSpecDetailBatchResolver,
  unitSpecDetailByExperimentIdParameterBatchResolver,
  unitSpecDetailForExperimentBatchResolver,
}
