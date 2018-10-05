ALTER TABLE experiment
    ADD COLUMN randomization_strategy_code VARCHAR;

WITH strategy_mapper AS (
    SELECT * FROM ( VALUES 
        ('1', 'shuffle', 'rcb'),
        ('2', 'latin-square', 'crd'),
        ('3', 'rcb', 'rcb-firstrep-entryorder'),
        ('4', 'rcb-firstrep-entryorder', 'latin-square'),
        ('5', 'group-block', 'group-block'),
        ('6', 'pryt', 'pryt'),
        ('7', 'pryt-firstrep', 'pryt-firstrep'),
        ('8', 'split-plot', 'split-plot'),
        ('9', 'split-split-plot', 'split-split-plot'),
        ('10', 'tech-pack-strip-plot', 'tech-pack-strip-plot'),
        ('11', 'rcbXbyY', 'rcbXbyY'),
        ('12', 'strip-plot', 'strip-plot'),
        ('13', 'restricted-shuffle', 'restricted-shuffle'),
        ('14', 'crd', 'pseudo-sudoku'),
        ('15', 'pseudo-sudoku', 'shuffle'),
        ('16', null, 'strip-split-plot'),
        ('17', null, 'split-planter'),
        ('18', null, ''), -- Prod custom
        ('19', 'strip-split-plot', 'no-randomization'),
        ('20', 'split-planter', null),
        ('21', '', null), -- NP custom
        ('22', 'no-randomization', null)
    ) s (randId, np_name, prod_name)
)
UPDATE experiment
SET randomization_strategy_code = CASE WHEN current_database() = 'experiments_prod' THEN sm.prod_name ELSE sm.np_name END
FROM design_spec_detail dsd
    INNER JOIN ref_design_spec rds ON dsd.ref_design_spec_id = rds.id
    INNER JOIN strategy_mapper sm ON sm.randId = dsd.value
WHERE experiment.id = dsd.experiment_id AND rds.name = 'Randomization Strategy ID'