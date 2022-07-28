const { setErrorCode } = require('@monsantoit/error-decorator')()

const dropTablesScript = `
DROP TABLE IF EXISTS experiment_to_create;
DROP TABLE IF EXISTS owners_to_create;
DROP TABLE IF EXISTS dependent_variables_to_create;
DROP TABLE IF EXISTS factors_to_create;
DROP TABLE IF EXISTS factor_levels_to_create;
DROP TABLE IF EXISTS factor_properties_for_levels_to_create;
DROP TABLE IF EXISTS factor_level_details_to_create;
DROP TABLE IF EXISTS factor_level_associations_to_create;
DROP TABLE IF EXISTS treatments_to_create;
DROP TABLE IF EXISTS combination_elements_to_create;
DROP TABLE IF EXISTS analysis_models_to_create;
DROP TABLE IF EXISTS unit_spec_details_to_create;
DROP TABLE IF EXISTS design_spec_details_to_create;
DROP TABLE IF EXISTS blocks_to_create;
DROP TABLE IF EXISTS treatment_blocks_to_create;
DROP TABLE IF EXISTS units_to_create;

DROP TABLE IF EXISTS mapped_factor_ids;
DROP TABLE IF EXISTS mapped_factor_level_ids;
DROP TABLE IF EXISTS mapped_factor_properties_for_level_ids;
DROP TABLE IF EXISTS mapped_factor_level_details_ids;
DROP TABLE IF EXISTS mapped_treatment_ids;
DROP TABLE IF EXISTS mapped_block_ids;
DROP TABLE IF EXISTS mapped_treatment_block_ids;`

const generateDataScript = `
SELECT *
INTO TEMP experiment_to_create
FROM experiment e
WHERE e.id = $1;

UPDATE experiment_to_create
SET id = nextval(pg_get_serial_sequence('experiment', 'id')),
    created_date = CURRENT_TIMESTAMP,
    modified_date = CURRENT_TIMESTAMP,
    created_user_id = $2,
    modified_user_id = $2,
    name = COALESCE($4, CAST(('COPY OF ' || name) AS varchar(100))),
    is_template = $3;

SELECT *
INTO TEMP owners_to_create
FROM owner o
WHERE o.experiment_id = $1;

UPDATE owners_to_create
SET id = nextval(pg_get_serial_sequence('owner', 'id')),
    created_date = CURRENT_TIMESTAMP,
    modified_date = CURRENT_TIMESTAMP,
    created_user_id = $2,
    modified_user_id = $2,
    experiment_id = (SELECT id FROM experiment_to_create),
    user_ids = CASE WHEN user_ids @> ARRAY[$2]::VARCHAR[] THEN user_ids ELSE array_cat(user_ids, ARRAY[$2]::VARCHAR[]) END;

SELECT *
INTO TEMP dependent_variables_to_create
FROM dependent_variable dv
WHERE dv.experiment_id = $1;

UPDATE dependent_variables_to_create
SET id = nextval(pg_get_serial_sequence('dependent_variable', 'id')),
    created_date = CURRENT_TIMESTAMP,
    modified_date = CURRENT_TIMESTAMP,
    created_user_id = $2,
    modified_user_id = $2,
    experiment_id = (SELECT id FROM experiment_to_create);

SELECT *
INTO TEMP factors_to_create
FROM factor f
WHERE f.experiment_id = $1;

UPDATE factors_to_create
SET id = nextval(pg_get_serial_sequence('factor', 'id')),
    created_date = CURRENT_TIMESTAMP,
    modified_date = CURRENT_TIMESTAMP,
    created_user_id = $2,
    modified_user_id = $2,
    experiment_id = (SELECT id FROM experiment_to_create);

SELECT f.id AS old_id, n.id AS new_id
INTO TEMP mapped_factor_ids
FROM factor f
    INNER JOIN factors_to_create n ON f.name = n.name
WHERE f.experiment_id = $1;

WITH temp_ordered_old_factor_level_ids AS (
    SELECT fl.id AS old_factor_level_id, ROW_NUMBER() OVER (ORDER BY fl.id) AS row_number 
    FROM factor_level fl 
        INNER JOIN mapped_factor_ids mfi ON fl.factor_id = mfi.old_id
), temp_new_factor_level_ids AS (
    SELECT nextval(pg_get_serial_sequence('factor_level', 'id')) as new_factor_level_id 
    FROM temp_ordered_old_factor_level_ids
), temp_ordered_new_factor_level_ids AS (
    SELECT new_factor_level_id, ROW_NUMBER() OVER (ORDER BY new_factor_level_id) AS row_number 
    FROM temp_new_factor_level_ids
) 
SELECT old_factor_level_id, new_factor_level_id 
INTO TEMP mapped_factor_level_ids 
FROM temp_ordered_old_factor_level_ids ofl 
    INNER JOIN temp_ordered_new_factor_level_ids nfl ON ofl.row_number = nfl.row_number;

SELECT *
INTO TEMP factor_levels_to_create
FROM factor_level fl
WHERE fl.factor_id in (SELECT old_id FROM mapped_factor_ids);

UPDATE factor_levels_to_create
SET id = mfli.new_factor_level_id,
    created_date = CURRENT_TIMESTAMP,
    modified_date = CURRENT_TIMESTAMP,
    created_user_id = $2,
    modified_user_id = $2,
    factor_id = mfi.new_id
FROM mapped_factor_ids mfi, mapped_factor_level_ids mfli
WHERE factor_levels_to_create.factor_id = mfi.old_id
    AND factor_levels_to_create.id = mfli.old_factor_level_id;

WITH temp_ordered_old_factor_properties_for_level_ids AS (
    SELECT fpfl.id AS old_factor_properties_for_level_id,
        ROW_NUMBER() OVER (ORDER BY fpfl.id) AS row_number
    FROM factor_properties_for_level fpfl
        INNER JOIN mapped_factor_ids mfi ON fpfl.factor_id = mfi.old_id
), temp_new_factor_properties_for_level_ids AS (
    SELECT nextval(pg_get_serial_sequence('factor_properties_for_level', 'id')) as new_factor_properties_for_level_id
    FROM temp_ordered_old_factor_properties_for_level_ids
), temp_ordered_new_factor_properties_for_level_ids AS (
    SELECT new_factor_properties_for_level_id, ROW_NUMBER() OVER (ORDER BY new_factor_properties_for_level_id) AS row_number
    FROM temp_new_factor_properties_for_level_ids
)
SELECT old_factor_properties_for_level_id, new_factor_properties_for_level_id
INTO TEMP mapped_factor_properties_for_level_ids
FROM temp_ordered_old_factor_properties_for_level_ids ofpfl
    INNER JOIN temp_ordered_new_factor_properties_for_level_ids nfpfl
        ON ofpfl.row_number = nfpfl.row_number;

SELECT *
INTO TEMP factor_properties_for_levels_to_create
FROM factor_properties_for_level fpfl
WHERE fpfl.factor_id in (SELECT old_id FROM mapped_factor_ids);

UPDATE factor_properties_for_levels_to_create
SET id = mfpfli.new_factor_properties_for_level_id,
    created_date = CURRENT_TIMESTAMP,
    modified_date = CURRENT_TIMESTAMP,
    created_user_id = $2,
    modified_user_id = $2,
    factor_id = mfi.new_id
FROM mapped_factor_ids mfi, mapped_factor_properties_for_level_ids mfpfli
WHERE factor_properties_for_levels_to_create.factor_id = mfi.old_id
    AND factor_properties_for_levels_to_create.id = mfpfli.old_factor_properties_for_level_id;

WITH temp_ordered_old_factor_level_details_ids AS (
    SELECT fld.id AS old_factor_level_details_id, ROW_NUMBER() OVER (ORDER BY fld.id) AS row_number
    FROM factor_level_details fld
        INNER JOIN mapped_factor_properties_for_level_ids mfpfli ON fld.factor_properties_for_level_id = mfpfli.old_factor_properties_for_level_id
), temp_new_factor_level_details_ids AS (
    SELECT nextval(pg_get_serial_sequence('factor_level_details', 'id')) as new_factor_level_details_id
    FROM temp_ordered_old_factor_level_details_ids
), temp_ordered_new_factor_level_details_ids AS (
    SELECT new_factor_level_details_id, ROW_NUMBER() OVER (ORDER BY new_factor_level_details_id) AS row_number
    FROM temp_new_factor_level_details_ids
)
SELECT old_factor_level_details_id, new_factor_level_details_id
INTO TEMP mapped_factor_level_details_ids
FROM temp_ordered_old_factor_level_details_ids ofld
    INNER JOIN temp_ordered_new_factor_level_details_ids nfld ON ofld.row_number = nfld.row_number;

SELECT *
INTO TEMP factor_level_details_to_create
FROM factor_level_details fld
WHERE fld.factor_level_id in (SELECT old_factor_level_id FROM mapped_factor_level_ids);

UPDATE factor_level_details_to_create
SET id = mfldi.new_factor_level_details_id,
    created_date = CURRENT_TIMESTAMP,
    modified_date = CURRENT_TIMESTAMP,
    created_user_id = $2,
    modified_user_id = $2,
    factor_properties_for_level_id = mfpfli.new_factor_properties_for_level_id,
    factor_level_id = mfli.new_factor_level_id
FROM mapped_factor_level_ids mfli, mapped_factor_properties_for_level_ids mfpfli, mapped_factor_level_details_ids mfldi
WHERE factor_level_details_to_create.factor_level_id = mfli.old_factor_level_id
    AND factor_level_details_to_create.factor_properties_for_level_id = mfpfli.old_factor_properties_for_level_id
    AND factor_level_details_to_create.id = mfldi.old_factor_level_details_id;

SELECT *
INTO TEMP factor_level_associations_to_create
FROM factor_level_association fla
WHERE fla.associated_level_id in (SELECT old_factor_level_id FROM mapped_factor_level_ids)
    AND fla.nested_level_id in (SELECT old_factor_level_id FROM mapped_factor_level_ids);

UPDATE factor_level_associations_to_create
SET id = nextval(pg_get_serial_sequence('factor_level_association', 'id')),
    created_date = CURRENT_TIMESTAMP,
    modified_date = CURRENT_TIMESTAMP,
    created_user_id = $2,
    modified_user_id = $2,
    associated_level_id = mflia.new_factor_level_id,
    nested_level_id = mflin.new_factor_level_id
FROM mapped_factor_level_ids mflia, mapped_factor_level_ids mflin
WHERE factor_level_associations_to_create.associated_level_id = mflia.old_factor_level_id
    AND factor_level_associations_to_create.nested_level_id = mflin.old_factor_level_id;

SELECT *
INTO TEMP treatments_to_create
FROM treatment t
WHERE t.experiment_id = $1;

UPDATE treatments_to_create
SET id = nextval(pg_get_serial_sequence('treatment', 'id')),
    created_date = CURRENT_TIMESTAMP,
    modified_date = CURRENT_TIMESTAMP,
    created_user_id = $2,
    modified_user_id = $2,
    experiment_id = (SELECT id FROM experiment_to_create);

SELECT t.id AS old_id, n.id AS new_id
INTO TEMP mapped_treatment_ids
FROM treatment t
    INNER JOIN treatments_to_create n ON t.treatment_number = n.treatment_number
WHERE t.experiment_id = $1;

SELECT *
INTO TEMP combination_elements_to_create
FROM combination_element ce
WHERE ce.treatment_id in (SELECT old_id FROM mapped_treatment_ids);

UPDATE combination_elements_to_create
SET id = nextval(pg_get_serial_sequence('combination_element', 'id')),
    created_date = CURRENT_TIMESTAMP,
    modified_date = CURRENT_TIMESTAMP,
    created_user_id = $2,
    modified_user_id = $2,
    factor_level_id = mfli.new_factor_level_id,
    treatment_id = mti.new_id
FROM mapped_treatment_ids mti, mapped_factor_level_ids mfli
WHERE combination_elements_to_create.treatment_id = mti.old_id
    AND combination_elements_to_create.factor_level_id = mfli.old_factor_level_id;

SELECT *
INTO TEMP analysis_models_to_create
FROM analysis_model am
WHERE am.experiment_id = $1;

UPDATE analysis_models_to_create
SET id = nextval(pg_get_serial_sequence('analysis_model', 'id')),
    created_date = CURRENT_TIMESTAMP,
    modified_date = CURRENT_TIMESTAMP,
    created_user_id = $2,
    modified_user_id = $2,
    experiment_id = (SELECT id FROM experiment_to_create);

SELECT *
INTO TEMP unit_spec_details_to_create
FROM unit_spec_detail usd
WHERE usd.experiment_id = $1;

UPDATE unit_spec_details_to_create
SET id = nextval(pg_get_serial_sequence('unit_spec_detail', 'id')),
    created_date = CURRENT_TIMESTAMP,
    modified_date = CURRENT_TIMESTAMP,
    created_user_id = $2,
    modified_user_id = $2,
    experiment_id = (SELECT id FROM experiment_to_create);

SELECT *
INTO TEMP design_spec_details_to_create
FROM design_spec_detail dsd
WHERE dsd.experiment_id = $1;

UPDATE design_spec_details_to_create
SET id = nextval(pg_get_serial_sequence('design_spec_detail', 'id')),
    created_date = CURRENT_TIMESTAMP,
    modified_date = CURRENT_TIMESTAMP,
    created_user_id = $2,
    modified_user_id = $2,
    experiment_id = (SELECT id FROM experiment_to_create);

SELECT *
INTO TEMP blocks_to_create
FROM block b
WHERE b.experiment_id = $1;

UPDATE blocks_to_create
SET id = nextval(pg_get_serial_sequence('block', 'id')),
    created_date = CURRENT_TIMESTAMP,
    modified_date = CURRENT_TIMESTAMP,
    created_user_id = $2,
    modified_user_id = $2,
    experiment_id = (SELECT id FROM experiment_to_create);

SELECT *
INTO TEMP treatment_blocks_to_create
FROM treatment_block tb
WHERE tb.treatment_id in (SELECT old_id FROM mapped_treatment_ids);

SELECT b.id AS old_id, n.id AS new_id
INTO TEMP mapped_block_ids
FROM block b
    INNER JOIN blocks_to_create n ON (b.name = n.name) OR (b.name is NULL AND n.name is NULL)
WHERE b.experiment_id = $1;

UPDATE treatment_blocks_to_create
SET id = nextval(pg_get_serial_sequence('treatment_block', 'id')),
    created_date = CURRENT_TIMESTAMP,
    modified_date = CURRENT_TIMESTAMP,
    created_user_id = $2,
    modified_user_id = $2,
    treatment_id = mti.new_id,
    block_id = mbi.new_id
FROM mapped_treatment_ids mti, mapped_block_ids mbi
WHERE treatment_blocks_to_create.treatment_id = mti.old_id
    AND treatment_blocks_to_create.block_id = mbi.old_id;

SELECT tb.id AS old_id, n.id AS new_id
INTO TEMP mapped_treatment_block_ids
FROM treatment_block tb
    INNER JOIN block b on tb.block_id = b.id
    INNER JOIN mapped_block_ids mbi ON mbi.old_id = tb.block_id 
    INNER JOIN mapped_treatment_ids mti ON mti.old_id = tb.treatment_id 
    INNER JOIN treatment_blocks_to_create n ON mti.new_id = n.treatment_id AND mbi.new_id = n.block_id
WHERE b.experiment_id = $1;

SELECT *
INTO TEMP units_to_create
FROM unit u
WHERE u.treatment_block_id in (SELECT old_id FROM mapped_treatment_block_ids);

UPDATE units_to_create
SET id = nextval(pg_get_serial_sequence('unit', 'id')),
    created_date = CURRENT_TIMESTAMP,
    modified_date = CURRENT_TIMESTAMP,
    created_user_id = $2,
    modified_user_id = $2,
    treatment_block_id = mtbi.new_id,
    set_entry_id = NULL,
    deactivation_reason = NULL
FROM mapped_treatment_block_ids mtbi
WHERE units_to_create.treatment_block_id = mtbi.old_id;`

const runQueryAndLogTime = async (description, query, tx, params) => {
  const start = new Date()
  await tx.none(query, params)
  const totalTime = new Date() - start
  console.debug(`${description || 'script'} took ${totalTime / 1000} seconds to complete`)
}

// Error Codes 53XXXX
class duplicationRepo {
  constructor(rep) {
    this.rep = rep
  }

  @setErrorCode('530000')
  repository = () => this.rep

  @setErrorCode('531000')
  duplicateExperiment= async (experimentId, name, isTemplate, context, tx = this.rep) => {
    const start = new Date()
    await runQueryAndLogTime('drop tables', dropTablesScript, tx)
    await runQueryAndLogTime('generate data', generateDataScript, tx,
      [experimentId, context.userId, isTemplate.toString(), name])
    await runQueryAndLogTime('create experiment', 'INSERT INTO experiment SELECT * FROM experiment_to_create;', tx)
    await runQueryAndLogTime('create owner', 'INSERT INTO owner SELECT * FROM owners_to_create;', tx)
    await runQueryAndLogTime('create dependent_variable', 'INSERT INTO dependent_variable SELECT * FROM dependent_variables_to_create;', tx)
    await runQueryAndLogTime('create factor', 'INSERT INTO factor SELECT * FROM factors_to_create;', tx)
    await runQueryAndLogTime('create factor_level', 'INSERT INTO factor_level SELECT * FROM factor_levels_to_create;', tx)
    await runQueryAndLogTime('create factor_properties_for_level', 'INSERT INTO factor_properties_for_level SELECT * FROM factor_properties_for_levels_to_create;', tx)
    await runQueryAndLogTime('create factor_level_detail', 'INSERT INTO factor_level_detail SELECT * FROM factor_level_details_to_create;', tx)
    await runQueryAndLogTime('create factor_level_association', 'INSERT INTO factor_level_association SELECT * FROM factor_level_associations_to_create;', tx)
    await runQueryAndLogTime('create treatment', 'INSERT INTO treatment SELECT * FROM treatments_to_create;', tx)
    await runQueryAndLogTime('create combination_element', 'INSERT INTO combination_element SELECT * FROM combination_elements_to_create;', tx)
    await runQueryAndLogTime('create analysis_model', 'INSERT INTO analysis_model SELECT * FROM analysis_models_to_create;', tx)
    await runQueryAndLogTime('create unit_spec_detail', 'INSERT INTO unit_spec_detail SELECT * FROM unit_spec_details_to_create;', tx)
    await runQueryAndLogTime('create design_spec_detail', 'INSERT INTO design_spec_detail SELECT * FROM design_spec_details_to_create;', tx)
    await runQueryAndLogTime('create block', 'INSERT INTO block SELECT * FROM blocks_to_create;', tx)
    await runQueryAndLogTime('create treatment_block', 'INSERT INTO treatment_block SELECT * FROM treatment_blocks_to_create;', tx)
    await runQueryAndLogTime('create unit', 'INSERT INTO unit SELECT * FROM units_to_create;', tx)
    const totalTime = new Date() - start
    console.debug(`complete duplication took ${totalTime / 1000} seconds to complete`)

    return tx.oneOrNone('SELECT * FROM experiment_to_create')
  }
}

module.exports = (rep) => new duplicationRepo(rep)
