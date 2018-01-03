insert into ref_design_spec(name, created_user_id, created_date, modified_user_id, modified_date)
values('Locations', 'PNWATT', current_timestamp, 'PNWATT', current_timestamp);

insert into ref_design_spec(name, created_user_id, created_date, modified_user_id, modified_date)
values('Reps', 'PNWATT', current_timestamp, 'PNWATT', current_timestamp);

insert into ref_design_spec(name, created_user_id, created_date, modified_user_id, modified_date)
values('Block By Rep', 'PNWATT', current_timestamp, 'PNWATT', current_timestamp);

insert into ref_design_spec(name, created_user_id, created_date, modified_user_id, modified_date)
values('Randomization Strategy ID', 'PNWATT', current_timestamp, 'PNWATT', current_timestamp);


WITH location_design_spec AS (
    SELECT id FROM ref_design_spec
    WHERE name = 'Locations'
),
number_of_locations AS (
    SELECT experiment_id, COUNT(*) AS count
    FROM public.group g 
        INNER JOIN ref_group_type rgt ON g.ref_group_type_id = rgt.id
    WHERE type='Location'
    GROUP BY experiment_id
)
INSERT INTO design_spec_detail (value, ref_design_spec_id, experiment_id, created_user_id, modified_user_id, created_date, modified_date)
SELECT nol.count, lds.id, nol.experiment_id, 'JGORD1', 'JGORD1', current_timestamp, current_timestamp
FROM location_design_spec lds, number_of_locations nol;


WITH reps_design_spec AS (
    SELECT id FROM ref_design_spec
    WHERE name = 'Reps'
),
reps AS (
    SELECT DISTINCT experiment_id, rep
    FROM treatment t
        INNER JOIN unit u ON t.id = u.treatment_id
),
number_of_reps AS (
    SELECT experiment_id, COUNT(*) AS count
    FROM reps
    GROUP BY experiment_id
)
INSERT INTO design_spec_detail (value, ref_design_spec_id, experiment_id, created_user_id, modified_user_id, created_date, modified_date)
SELECT nor.count, rds.id, nor.experiment_id, 'JGORD1', 'JGORD1', current_timestamp, current_timestamp
FROM reps_design_spec rds, number_of_reps nor;


WITH block_by_rep_design_spec AS (
    SELECT id FROM ref_design_spec
    WHERE name = 'Block By Rep'
),
rep_groups AS (
    SELECT experiment_id, COUNT(*) AS count
    FROM public.group g 
        INNER JOIN ref_group_type rgt ON g.ref_group_type_id = rgt.id
    WHERE type='Rep'
    GROUP BY experiment_id
),
is_block_by_rep AS (
    SELECT DISTINCT g.experiment_id AS experiment_id, CASE WHEN rg.experiment_id IS NULL THEN 'false' ELSE 'true' END AS block_by_rep
    FROM public.group g
        LEFT OUTER JOIN rep_groups rg ON g.experiment_id = rg.experiment_id
)
INSERT INTO design_spec_detail (value, ref_design_spec_id, experiment_id, created_user_id, modified_user_id, created_date, modified_date)
SELECT ibbr.block_by_rep, bbrds.id, ibbr.experiment_id, 'JGORD1', 'JGORD1', current_timestamp, current_timestamp
FROM block_by_rep_design_spec bbrds, is_block_by_rep ibbr;


WITH randomization_spec AS (
    SELECT id FROM ref_design_spec
    WHERE name = 'Randomization Strategy ID'
),
ref_randomization_strategy AS (
    SELECT experiment_id, MIN(ref_randomization_strategy_id) AS ref_randomization_strategy_id
    FROM public.group
    GROUP BY experiment_id
)
INSERT INTO design_spec_detail (value, ref_design_spec_id, experiment_id, created_user_id, modified_user_id, created_date, modified_date)
SELECT rrs.ref_randomization_strategy_id, rs.id, rrs.experiment_id, 'JGORD1', 'JGORD1', current_timestamp, current_timestamp
FROM randomization_spec rs, ref_randomization_strategy rrs;


WITH reps_design_spec AS (
    SELECT id FROM ref_design_spec
    WHERE name = 'Reps'
),
min_reps_design_spec AS (
    SELECT id FROM ref_design_spec
    WHERE name = 'Min Rep'
),
experiments_with_min_reps AS (
    SELECT experiment_id
    FROM design_spec_detail dsd
        INNER JOIN min_reps_design_spec mrds ON dsd.ref_design_spec_id = mrds.id
)
DELETE FROM design_spec_detail
WHERE experiment_id IN (SELECT experiment_id FROM experiments_with_min_reps)
    AND ref_design_spec_id IN (SELECT id FROM reps_design_spec)