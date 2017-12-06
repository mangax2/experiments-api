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
  "DROP TABLE IF EXISTS mapped_group_ids; " +
  "DROP TABLE IF EXISTS group_value_ids; " +
  "DROP TABLE IF EXISTS unit_ids; " +
  "WITH temp_experiment_parent AS (" +
    "INSERT INTO experiment " +
    "SELECT (e1).* FROM (" +
      "SELECT e " +
        "#= hstore('id', nextval(pg_get_serial_sequence('experiment', 'id'))::text) " +
        "#= hstore('created_date', CURRENT_TIMESTAMP::text) " +
        "#= hstore('modified_date', CURRENT_TIMESTAMP::text) " +
        "#= hstore('created_user_id', $2) " +
        "#= hstore('modified_user_id', $2) " +
        "#= hstore('name', CAST(('COPY OF ' || e.name) AS varchar(100))) " +
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
  "SELECT f.id AS old_id, n.id AS new_id " +
  "INTO TEMP mapped_factor_ids " +
  "FROM factor f " +
    "INNER JOIN new_factors n ON f.name = n.name " +
  "WHERE f.experiment_id = $1" +
  "; WITH temp_factor_levels AS (" +
    "INSERT INTO factor_level " +
    "SELECT (c).* FROM  (" +
      "SELECT fl " +
        "#= hstore('id', nextval(pg_get_serial_sequence('factor_level', 'id'))::text) " +
        "#= hstore('created_date', CURRENT_TIMESTAMP::text) " +
        "#= hstore('modified_date', CURRENT_TIMESTAMP::text) " +
        "#= hstore('created_user_id', $2) " +
        "#= hstore('modified_user_id', $2) " +
        "#= hstore('factor_id', mfi.new_id::text) AS c " +
      "FROM factor_level fl " +
        "INNER JOIN mapped_factor_ids mfi ON fl.factor_id = mfi.old_id ) sub " +
    "RETURNING id, factor_id, value" +
  ")" +
  "SELECT * " +
  "INTO TEMP new_factor_levels " +
  "FROM temp_factor_levels;";

const duplicateFactorLevelAssociationScript =
  "SELECT fl.id as old_id, n.id as new_id " +
  "INTO TEMP mapped_factor_level_ids " +
  "FROM factor_level fl " +
    "INNER JOIN mapped_factor_ids mfi ON fl.factor_id = mfi.old_id " +
    "INNER JOIN new_factor_levels n ON n.factor_id = mfi.new_id AND fl.value = n.value; " +
  "INSERT INTO factor_level_association " +
  "SELECT (c).* FROM (" +
    "SELECT fla " +
      "#= hstore('id', nextval(pg_get_serial_sequence('factor_level_association', 'id'))::text) " +
      "#= hstore('created_date', CURRENT_TIMESTAMP::text) " +
      "#= hstore('modified_date', CURRENT_TIMESTAMP::text) " +
      "#= hstore('created_user_id', $2) " +
      "#= hstore('modified_user_id', $2) " +
      "#= hstore('associated_level_id', mflia.new_id::text) " +
      "#= hstore('nested_level_id', mflin.new_id::text) AS c " +
    "FROM factor_level_association fla " +
      "INNER JOIN mapped_factor_level_ids mflia ON fla.associated_level_id = mflia.old_id " +
      "INNER JOIN mapped_factor_level_ids mflin ON fla.nested_level_id = mflin.old_id) sub;"

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

const duplicateGroupScript =
  "WITH temp_mapped_group_ids AS (" +
    "INSERT INTO public.group " +
    "SELECT (c).* FROM (" +
      "SELECT g " +
        "#= hstore('id', nextval(pg_get_serial_sequence('group', 'id'))::text) " +
        "#= hstore('created_date', CURRENT_TIMESTAMP::text) " +
        "#= hstore('modified_date', CURRENT_TIMESTAMP::text) " +
        "#= hstore('created_user_id', $2) " +
        "#= hstore('modified_user_id', $2) " +
        "#= hstore('parent_id', g.id::text) " +
        "#= hstore('experiment_id', (SELECT id::text FROM experiment_parent)) " +
      "AS c FROM public.group g " +
    "WHERE experiment_id = $1) sub " +
    "RETURNING id AS new_id, parent_id AS old_id" +
  ")" +
  "SELECT * " +
  "INTO TEMP mapped_group_ids " +
  "FROM temp_mapped_group_ids;" +
  "UPDATE public.group " +
  "SET parent_id = mgi.new_id " +
  "FROM public.group gtc " +
    "LEFT OUTER JOIN mapped_group_ids mgi ON gtc.parent_id = mgi.old_id " +
  "WHERE public.group.id IN (SELECT new_id FROM mapped_group_ids) " +
    "AND public.group.parent_id = gtc.id;"

const duplicateGroupValueScript =
  "WITH temp_group_value_ids AS (" +
    "INSERT INTO group_value " +
    "SELECT (c).* FROM (" +
      "SELECT gv " +
        "#= hstore('id', nextval(pg_get_serial_sequence('group_value', 'id'))::text) " +
        "#= hstore('created_date', CURRENT_TIMESTAMP::text) " +
        "#= hstore('modified_date', CURRENT_TIMESTAMP::text) " +
        "#= hstore('created_user_id', $2) " +
        "#= hstore('modified_user_id', $2) " +
        "#= hstore('group_id', mgi.new_id::text) " +
        "#= hstore('factor_level_id', mfli.new_id::text) " +
      "AS c FROM group_value gv " +
        "INNER JOIN mapped_group_ids mgi ON gv.group_id = mgi.old_id " +
        "LEFT OUTER JOIN mapped_factor_level_ids mfli ON gv.factor_level_id = mfli.old_id " +
        ") sub " +
    "RETURNING id" +
  ")" +
  "SELECT * " +
  "INTO TEMP group_value_ids " +
  "FROM temp_group_value_ids;"

const duplicateUnitScript =
  "WITH temp_unit_ids AS (" +
    "INSERT INTO unit " +
    "SELECT (c).* FROM (" +
      "SELECT u " +
        "#= hstore('id', nextval(pg_get_serial_sequence('unit', 'id'))::text) " +
        "#= hstore('created_date', CURRENT_TIMESTAMP::text) " +
        "#= hstore('modified_date', CURRENT_TIMESTAMP::text) " +
        "#= hstore('created_user_id', $2) " +
        "#= hstore('modified_user_id', $2) " +
        "#= hstore('group_id', mgi.new_id::text) " +
        "#= hstore('treatment_id', mti.new_id::text) " +
        "#= hstore('set_entry_id', null) " +
      "AS c FROM unit u " +
        "INNER JOIN mapped_treatment_ids mti ON u.treatment_id = mti.old_id " +
        "INNER JOIN mapped_group_ids mgi ON u.group_id = mgi.old_id) sub " +
    "RETURNING id" +
  ")" +
  "SELECT * " +
  "INTO TEMP unit_ids " +
  "FROM temp_unit_ids;"


module.exports = (rep, pgp) => ({
  repository: () => rep,

  duplicateExperiment: function(experimentId,isTemplate ,context, tx = rep){ return tx.oneOrNone(
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
        duplicateGroupScript +
        duplicateGroupValueScript +
        duplicateUnitScript +
      " SELECT * FROM experiment_parent;",
    [experimentId, context.userId,isTemplate.toString()],
  )
  },
})
