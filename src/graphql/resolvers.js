import {
  has, property, compact, uniq,
} from 'lodash'
import configurator from '../configs/configurator'

const settings = configurator.get('settings')
const MAX_LOCATION_BLOCKS = 100

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
    // eslint-disable-next-line no-confusing-arrow
    getExperimentsByName: (_, { name, partial = false }, context) =>
      partial ?
        context.loaders.experimentsByPartialName.load({ name, isTemplate: false }, false) :
        context.loaders.experimentsByName.load(name),
    getExperimentsInfo: async (entity, args, context) => {
      const {
        values, criteriaValue, criteria, acceptType, limit = 1000, offset = 0,
      } = args
      const endRecordIndex = limit ? limit + offset : undefined
      let experiments = []
      let pageResults = []

      if (!acceptType || acceptType.length === 0) {
        throw new Error('An accept type [experiments/templates] must be supplied')
      }

      if (criteria === 'setId') {
        if (!values || values.length === 0) {
          experiments = await context.loaders.experimentBySetId.load('null')
        } else {
          experiments = await Promise.all(
            uniq(values).map(value => {
              if (value !== null && value < 1) {
                throw new Error('Set Id should be greater than 0')
              }
              return context.loaders.experimentBySetId.load(value || 'null')
            }))
        }
      } else if (criteria === 'experimentId') {
        experiments = await Promise.all(
          uniq(values).map(value => {
            if (acceptType.length === 2) {
              return context.loaders.experiment.load({ id: value, allowTemplate: true })
            }
            return acceptType[0] === 'experiments' ? context.loaders.experiment.load({ id: value, allowTemplate: false }) : context.loaders.template.load(value)
          },
        ))
      } else if (criteria === 'name') {
        if (!criteriaValue) {
          throw new Error('A criteriaValue is required when querying by name/owner.')
        }

        experiments = await Promise.all(acceptType.map((type) =>
          context.loaders.experimentsByPartialName.load({ name: criteriaValue, isTemplate: type === 'templates' }),
        ))
      } else if (criteria === 'owner') {
        if (!criteriaValue) {
          throw new Error('A criteriaValue is required when querying by name/owner.')
        }

        experiments = await Promise.all(acceptType.map((type) =>
          context.loaders.experimentsByCriteria.load({ criteria: 'owner', value: [criteriaValue], isTemplate: type === 'templates' }),
        ))
      } else { // no criteria supplied. go grab all everything subject to acceptType
        experiments = await Promise.all(acceptType.map((type) =>
          context.loaders[type].load(-1),
        ))
      }

      experiments = compact([].concat(...experiments))
      pageResults = experiments.slice(offset, endRecordIndex)
      return {
        pageResults,
        totalResultsLength: experiments.length,
        pageResultsLength: pageResults.length,
      }
    },
    getTemplateById: (entity, args, context) =>
      context.loaders.template.load(args.id),
    getTemplatesByCriteria: (entity, args, context) =>
      context.loaders.experimentsByCriteria.load(
        { criteria: args.criteria, value: args.value, isTemplate: true }),
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
    getUnitsBySetEntryIds: (entity, args, context) =>
      context.loaders.unitsBySetEntryIds.load(args.setEntryIds),
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
    getLocationBlocksByIds: (entity, args, context) => {
      emptyInputIdCheck(args.ids)
      maxIdCountCheck(args.ids, MAX_LOCATION_BLOCKS)
      return context.loaders.locationBlocksByLocationBlockIds.load(args.ids)
    },
  },
  AssociatedSet: {
    blockId: property('block_id'),
    blockName: property('block'),
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
    analysisType: property('analysis_type'),
    isTemplate: property('is_template'),
    auditInfo: (entity, args, context) =>
      context.getAuditInfo(entity),
    responseVariables: (entity, args, context) =>
      context.loaders.dependentVariableByExperimentIds.load(entity.id),
    designSpecifications: (entity, args, context) =>
      context.loaders.designSpecDetailByExperimentIds.load(entity.id),
    treatmentVariables: (entity, args, context) =>
      context.loaders.factorByExperimentIds.load(entity.id),
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
    setEntries: (entity, args, context) =>
      context.loaders.unitsBySetId.load([entity.setId]),
    treatments: (entity, args, context) =>
      context.loaders.treatmentBySetIds.load([entity.setId]),
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
    isTemplate: property('is_template'),
  },
  TreatmentVariable: {
    experimentId: property('experiment_id'),
    auditInfo: (entity, args, context) =>
      context.getAuditInfo(entity),
    treatmentVariableLevels: (entity, args, context) =>
      context.loaders.factorLevelByFactorIds.load(entity.id),
    isBlockingFactorOnly: property('is_blocking_factor_only'),
    associatedVariable: (entity, _, context) =>
      context.loaders.associatedVariable.load(entity.id),
    nestedVariables: (entity, _, context) =>
      context.loaders.nestedVariables.load(entity.id),
  },
  TreatmentVariableLevel: {
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
    treatmentVariableLevelFlatDetails: (entity, _, context) =>
      context.loaders.treatmentVariableLevelFlatDetails.load(entity.id),
  },
  Group: {
    childGroups: entity => entity.childGroups,
  },
  Owner: {
    experimentId: property('experiment_id'),
    userIds: property('user_ids'),
    groupIds: property('group_ids'),
    reviewerUserIds: property('reviewer_user_ids'),
    reviewerGroupIds: property('reviewer_group_ids'),
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
  LocationBlock: {
    experimentId: property('experiment_id'),
    blockId: property('block_id'),
    setId: property('set_id'),
    auditInfo: (entity, args, context) =>
      context.getAuditInfo(entity),
    units: (entity, args, context) =>
      context.loaders.unitsByLocationBlockIds.load(entity.id),
  },
}
