const { setErrorCode } = require('@monsantoit/error-decorator')()
const duplicateExperimentInfoScript =
  "DROP TABLE IF EXISTS experiment_parent; " +
  "DROP TABLE IF EXISTS owner_ids; " +
  "DROP TABLE IF EXISTS dependent_variable_ids; " +
  "DROP TABLE IF EXISTS new_factors; " +
  "DROP TABLE IF EXISTS mapped_factor_ids; " +
  "DROP TABLE IF EXISTS new_factor_levels; " +
  "DROP TABLE IF EXISTS mapped_factor_level_ids; " +
  "DROP TABLE IF EXISTS new_treatments; " +
  "DROP TABLE IF EXISTS mapped_treatment_ids; " +
  "DROP TABLE IF EXISTS combination_element_ids; " +
  "DROP TABLE IF EXISTS unit_spec_detail_ids; " +
  "DROP TABLE IF EXISTS design_spec_detail_ids; " +
  "DROP TABLE IF EXISTS unit_ids; " +
  "DROP TABLE IF EXISTS analysis_model_ids; " +
  "DROP TABLE IF EXISTS new_blocks; " +
  "DROP TABLE IF EXISTS mapped_block_ids; " +
  "DROP TABLE IF EXISTS new_treatment_blocks; " +
  "DROP TABLE IF EXISTS mapped_treatment_block_ids; " +
  "WITH temp_experiment_parent AS (" +
    "INSERT INTO experiment " +
    "SELECT (e1).* FROM (" +
      "SELECT e " +
        "#= hstore('id', nextval(pg_get_serial_sequence('experiment', 'id'))::text) " +
        "#= hstore('created_date', CURRENT_TIMESTAMP::text) " +
        "#= hstore('modified_date', CURRENT_TIMESTAMP::text) " +
        "#= hstore('created_user_id', $2) " +
        "#= hstore('modified_user_id', $2) " +
        "#= hstore('name', COALESCE($4, CAST(('COPY OF ' || e.name) AS varchar(100)))) " +
        "#= hstore('is_template', $3) " +
      "AS e1 FROM experiment e " +
    "WHERE id = $1) sub " +
    "RETURNING id" +
  ")" +
  "SELECT * " +
  "INTO TEMP experiment_parent " +
  "FROM temp_experiment_parent;"

const duplicateOwnersScript =
  "WITH temp_owner_ids AS (" +
    "INSERT INTO owner " +
    "SELECT (c).* FROM  (" +
      "SELECT o " +
        "#= hstore('id', nextval(pg_get_serial_sequence('owner', 'id'))::text) " +
        "#= hstore('user_ids', " +
        "CASE WHEN o.user_ids @> ARRAY[$2]::varchar[] THEN " +
        "o.user_ids::text " +
        "ELSE " +
        "array_cat(o.user_ids, ARRAY[$2]::varchar[])::text " +
        "END) " +
        "#= hstore('created_date', CURRENT_TIMESTAMP::text) " +
        "#= hstore('modified_date', CURRENT_TIMESTAMP::text) " +
        "#= hstore('created_user_id', $2) " +
        "#= hstore('modified_user_id', $2) " +
        "#= hstore('experiment_id', (SELECT id::text FROM experiment_parent)) " +
      "AS c FROM owner o " +
    "WHERE experiment_id = $1 ) sub " +
    "RETURNING id" +
  ")" +
  "SELECT * " +
  "INTO TEMP owner_ids " +
  "FROM temp_owner_ids;"

const duplicateDependentVariableScript =
  "WITH temp_dependent_variable_ids AS (" +
    "INSERT INTO dependent_variable " +
    "SELECT (c).* FROM  (" +
      "SELECT dv " +
        "#= hstore('id', nextval(pg_get_serial_sequence('dependent_variable', 'id'))::text) " +
        "#= hstore('created_date', CURRENT_TIMESTAMP::text) " +
        "#= hstore('modified_date', CURRENT_TIMESTAMP::text) " +
        "#= hstore('created_user_id', $2) " +
        "#= hstore('modified_user_id', $2) " +
        "#= hstore('experiment_id', (SELECT id::text FROM experiment_parent)) " +
      "AS c FROM dependent_variable dv " +
    "WHERE experiment_id = $1 ) sub " +
    "RETURNING id" +
  ")" +
  "SELECT * " +
  "INTO TEMP dependent_variable_ids " +
  "FROM temp_dependent_variable_ids;"

const duplicateFactorScript =
  "WITH temp_new_factors AS (" +
    "INSERT INTO factor " +
      "SELECT (c).* FROM  (" +
        "SELECT f " +
          "#= hstore('id', nextval(pg_get_serial_sequence('factor', 'id'))::text) " +
          "#= hstore('created_date', CURRENT_TIMESTAMP::text) " +
          "#= hstore('modified_date', CURRENT_TIMESTAMP::text) " +
          "#= hstore('created_user_id', $2) " +
          "#= hstore('modified_user_id', $2) " +
          "#= hstore('experiment_id', (SELECT id::text FROM experiment_parent)) " +
        "AS c FROM factor f " +
      "WHERE experiment_id = $1 ) sub " +
    "RETURNING id, name" +
  ")" +
  "SELECT * " +
  "INTO TEMP new_factors " +
  "FROM temp_new_factors;"

const duplicateFactorLevelScript =
  "SELECT " +
  " f.id AS old_id, " +
  " n.id AS new_id " +
  "INTO TEMP mapped_factor_ids " +
  "FROM " +
    "factor f " +
    "INNER JOIN new_factors n ON f.name = n.name " +
  "WHERE f.experiment_id = $1" +
  "; WITH temp_ordered_old_factor_level_ids AS (" +
    "SELECT fl.id AS old_factor_level_id, ROW_NUMBER() OVER (ORDER BY fl.id) AS row_number " +
    "FROM factor_level fl " +
      "INNER JOIN mapped_factor_ids mfi ON fl.factor_id = mfi.old_id" +
  "), temp_new_factor_level_ids AS (" +
    "SELECT nextval(pg_get_serial_sequence('factor_level', 'id'))::text as new_factor_level_id " +
    "FROM temp_ordered_old_factor_level_ids" +
  "), temp_ordered_new_factor_level_ids AS (" +
    "SELECT new_factor_level_id, ROW_NUMBER() OVER (ORDER BY new_factor_level_id) AS row_number " +
    "FROM temp_new_factor_level_ids" +
  ")" + 
  "SELECT old_factor_level_id, new_factor_level_id " +
  "INTO TEMP mapped_factor_level_ids " +
  "FROM temp_ordered_old_factor_level_ids ofl " +
    "INNER JOIN temp_ordered_new_factor_level_ids nfl ON ofl.row_number = nfl.row_number;" +
  "WITH temp_factor_levels AS ( " +
      "INSERT INTO factor_level " +
      "SELECT (c1).* FROM (" +
        "SELECT fl " +
           "#= hstore ('id', mfli.new_factor_level_id) " +
           "#= hstore ('created_date', CURRENT_TIMESTAMP::TEXT) " +
           "#= hstore ('modified_date', CURRENT_TIMESTAMP::TEXT) " +
           "#= hstore ('created_user_id', $2) " +
           "#= hstore ('modified_user_id', $2) " +
           "#= hstore ('factor_id', mfi.new_id::TEXT) AS c1 " +
    "FROM factor_level fl " +
      "INNER JOIN mapped_factor_ids mfi ON fl.factor_id = mfi.old_id " +
      "INNER JOIN mapped_factor_level_ids mfli ON fl.id = mfli.old_factor_level_id ) sub " +
  "RETURNING id, factor_id, value " +
  ") " +
  "SELECT * " +
  "INTO TEMP new_factor_levels " +
  "FROM temp_factor_levels;"

const duplicateFactorLevelAssociationScript =
  "INSERT INTO factor_level_association " +
  "SELECT (c).* FROM (" +
    "SELECT fla " +
      "#= hstore('id', nextval(pg_get_serial_sequence('factor_level_association', 'id'))::text) " +
      "#= hstore('created_date', CURRENT_TIMESTAMP::text) " +
      "#= hstore('modified_date', CURRENT_TIMESTAMP::text) " +
      "#= hstore('created_user_id', $2) " +
      "#= hstore('modified_user_id', $2) " +
      "#= hstore('associated_level_id', mflia.new_factor_level_id::text) " +
      "#= hstore('nested_level_id', mflin.new_factor_level_id::text) AS c " +
    "FROM factor_level_association fla " +
      "INNER JOIN mapped_factor_level_ids mflia ON fla.associated_level_id = mflia.old_factor_level_id " +
      "INNER JOIN mapped_factor_level_ids mflin ON fla.nested_level_id = mflin.old_factor_level_id) sub;"

const duplicateTreatmentScript =
  "WITH temp_new_treatments AS (" +
      "INSERT INTO treatment " +
      "SELECT (c).* FROM (" +
        "SELECT t " +
          "#= hstore('id', nextval(pg_get_serial_sequence('treatment', 'id'))::text) " +
          "#= hstore('created_date', CURRENT_TIMESTAMP::text) " +
          "#= hstore('modified_date', CURRENT_TIMESTAMP::text) " +
          "#= hstore('created_user_id', $2) " +
          "#= hstore('modified_user_id', $2) " +
          "#= hstore('experiment_id', (SELECT id::text FROM experiment_parent)) " +
        "AS c FROM treatment t " +
      "WHERE experiment_id = $1 ) sub " +
      "RETURNING id, treatment_number" +
  ")" +
  "SELECT * " +
  "INTO TEMP new_treatments " +
  "FROM temp_new_treatments;"

const duplicateCombinationElementScript =
  "SELECT t.id AS old_id, n.id AS new_id " +
  "INTO TEMP mapped_treatment_ids " +
  "FROM treatment t " +
    "INNER JOIN new_treatments n ON t.treatment_number = n.treatment_number " +
  "WHERE t.experiment_id = $1;" +
  "WITH temp_combination_element_ids AS (" +
    "INSERT INTO combination_element " +
    "SELECT (c).* FROM (" +
      "SELECT ce " +
        "#= hstore('id', nextval(pg_get_serial_sequence('combination_element', 'id'))::text) " +
        "#= hstore('created_date', CURRENT_TIMESTAMP::text) " +
        "#= hstore('modified_date', CURRENT_TIMESTAMP::text) " +
        "#= hstore('created_user_id', $2) " +
        "#= hstore('modified_user_id', $2) " +
        "#= hstore('factor_level_id', mfli.new_id::text) " +
        "#= hstore('treatment_id', mti.new_id::text) AS c " +
      "FROM combination_element ce " +
        "INNER JOIN mapped_treatment_ids mti ON ce.treatment_id = mti.old_id " +
        "INNER JOIN mapped_factor_level_ids mfli ON ce.factor_level_id = mfli.old_id ) " +
        " sub " +
    "RETURNING id" +
  ")" +
  "SELECT * " +
  "INTO TEMP combination_element_ids " +
  "FROM temp_combination_element_ids;"

const duplicateUnitSpecificationScript =
  "WITH temp_unit_spec_detail_ids AS (" +
    "INSERT INTO unit_spec_detail " +
    "SELECT (c).* FROM  (" +
      "SELECT usd " +
        "#= hstore('id', nextval(pg_get_serial_sequence('unit_spec_detail', 'id'))::text) " +
        "#= hstore('created_date', CURRENT_TIMESTAMP::text) " +
        "#= hstore('modified_date', CURRENT_TIMESTAMP::text) " +
        "#= hstore('created_user_id', $2) " +
        "#= hstore('modified_user_id', $2) " +
        "#= hstore('experiment_id', (SELECT id::text FROM experiment_parent)) " +
      "AS c FROM unit_spec_detail usd " +
    "WHERE experiment_id = $1 ) sub " +
    "RETURNING id" +
  ")" +
  "SELECT * " +
  "INTO TEMP unit_spec_detail_ids " +
  "FROM temp_unit_spec_detail_ids;"

const duplicateDesignSpecificationScript =
  "WITH temp_design_spec_detail_ids AS (" +
    "INSERT INTO design_spec_detail " +
    "SELECT (c).* FROM  (" +
      "SELECT dsd " +
        "#= hstore('id', nextval(pg_get_serial_sequence('design_spec_detail', 'id'))::text) " +
        "#= hstore('created_date', CURRENT_TIMESTAMP::text) " +
        "#= hstore('modified_date', CURRENT_TIMESTAMP::text) " +
        "#= hstore('created_user_id', $2) " +
        "#= hstore('modified_user_id', $2) " +
        "#= hstore('experiment_id', (SELECT id::text FROM experiment_parent)) " +
      "AS c FROM design_spec_detail dsd " +
    "WHERE experiment_id = $1 ) sub " +
    "RETURNING id" +
  ")" +
  "SELECT * " +
  "INTO TEMP design_spec_detail_ids " +
  "FROM temp_design_spec_detail_ids;"

const duplicateBlockScript =
  "WITH temp_blocks AS (" +
  "INSERT INTO block " +
  "SELECT (c).* FROM (" +
  "SELECT b " +
  "#= hstore('id', nextval(pg_get_serial_sequence('block', 'id'))::text) " +
  "#= hstore('created_date', CURRENT_TIMESTAMP::text) " +
  "#= hstore('modified_date', CURRENT_TIMESTAMP::text) " +
  "#= hstore('created_user_id', $2) " +
  "#= hstore('modified_user_id', $2) " +
  "#= hstore('experiment_id', (SELECT id::text FROM experiment_parent)) " +
  "AS c FROM block b " +
  "WHERE experiment_id = $1 ) sub " +
  "RETURNING id, name" +
  ")" +
  "SELECT * " +
  "INTO TEMP new_blocks " +
  "FROM temp_blocks;"

const duplicateTreatmentBlockScript =
  "SELECT b.id AS old_id, n.id AS new_id " +
  "INTO TEMP mapped_block_ids " +
  "FROM block b " +
    "INNER JOIN new_blocks n ON (b.name = n.name) OR (b.name is NULL AND n.name is NULL) " +
  "WHERE b.experiment_id = $1;" +
  "WITH temp_new_treatment_blocks AS (" +
  "INSERT INTO treatment_block " +
  "SELECT (c).* FROM (" +
  "SELECT tb " +
  "#= hstore('id', nextval(pg_get_serial_sequence('treatment_block', 'id'))::text) " +
  "#= hstore('created_date', CURRENT_TIMESTAMP::text) " +
  "#= hstore('modified_date', CURRENT_TIMESTAMP::text) " +
  "#= hstore('created_user_id', $2) " +
  "#= hstore('modified_user_id', $2) " +
  "#= hstore('treatment_id', mti.new_id::text) " +
  "#= hstore('block_id', mbi.new_id::text) " +
  "AS c FROM treatment_block tb " +
  "INNER JOIN mapped_treatment_ids mti ON tb.treatment_id = mti.old_id " +
  "INNER JOIN mapped_block_ids mbi ON tb.block_id = mbi.old_id) sub " +
  "RETURNING id, treatment_id, block_id" +
  ")" +
  "SELECT * " +
  "INTO TEMP new_treatment_blocks " +
  "FROM temp_new_treatment_blocks;"

const duplicateUnitScript =
  "SELECT tb.id AS old_id, n.id AS new_id " +
  "INTO TEMP mapped_treatment_block_ids " +
  "FROM treatment_block tb " +
    "INNER JOIN mapped_block_ids mbi ON mbi.old_id = tb.block_id " +
    "INNER JOIN mapped_treatment_ids mti ON mti.old_id = tb.treatment_id " +
    "INNER JOIN new_treatment_blocks n ON mti.new_id = n.treatment_id AND mbi.new_id = n.block_id;" +
  "WITH temp_unit_ids AS (" +
    "INSERT INTO unit " +
    "SELECT (c).* FROM (" +
      "SELECT u " +
        "#= hstore('id', nextval(pg_get_serial_sequence('unit', 'id'))::text) " +
        "#= hstore('created_date', CURRENT_TIMESTAMP::text) " +
        "#= hstore('modified_date', CURRENT_TIMESTAMP::text) " +
        "#= hstore('created_user_id', $2) " +
        "#= hstore('modified_user_id', $2) " +
        "#= hstore('treatment_block_id', mtbi.new_id::text) " +
        "#= hstore('set_entry_id', null) " +
        "#= hstore('deactivation_reason', null) " +
      "AS c FROM unit u " +
        "INNER JOIN mapped_treatment_block_ids mtbi ON u.treatment_block_id = mtbi.old_id) sub " +
    "RETURNING id" +
  ")" +
  "SELECT * " +
  "INTO TEMP unit_ids " +
  "FROM temp_unit_ids;"

const duplicateAnalysisModelScript =
  "WITH temp_analysis_model_ids AS (" +
  "INSERT INTO analysis_model " +
  "SELECT (c).* FROM (" +
  "SELECT am " +
  "#= hstore('id', nextval(pg_get_serial_sequence('analysis_model', 'id'))::text) " +
  "#= hstore('analysis_model_type', am.analysis_model_type) " +
  "#= hstore('analysis_model_sub_type', am.analysis_model_sub_type) " +
  "#= hstore('experiment_id', (SELECT id::text FROM experiment_parent)) " +
  "AS c FROM analysis_model am " +
  "WHERE experiment_id = $1 ) sub " +
  "RETURNING id" +
  ")" +
  "SELECT * " +
  "INTO TEMP analysis_model_ids " +
  "FROM temp_analysis_model_ids;"

// Error Codes 53XXXX
class duplicationRepo {
  constructor(rep) {
    this.rep = rep
  }

  @setErrorCode('530000')
  repository = () => this.rep

  @setErrorCode('531000')
  duplicateExperiment= function(experimentId, name, isTemplate, context, tx = this.rep) {
    return tx.oneOrNone(
      duplicateExperimentInfoScript +
      duplicateOwnersScript +
      duplicateFactorScript +
      duplicateFactorLevelScript +
      duplicateFactorLevelAssociationScript +
      duplicateDependentVariableScript +
      duplicateTreatmentScript +
      duplicateCombinationElementScript +
      duplicateUnitSpecificationScript +
      duplicateDesignSpecificationScript +
      duplicateBlockScript +
      duplicateTreatmentBlockScript +
      duplicateUnitScript +
      duplicateAnalysisModelScript +
      " SELECT * FROM experiment_parent;",
      [experimentId, context.userId, isTemplate.toString(), name],
    )
  }
}

module.exports = (rep) => new duplicationRepo(rep)
