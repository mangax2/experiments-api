ALTER TABLE experiment
    ADD COLUMN analysis_type VARCHAR;

UPDATE experiment

-- SET analysis_type = (CASE 
--                       WHEN analysis_model_type != 'External'
--                         THEN 'Internal'
--                     END);

SET analysis_type = 'Internal'
WHERE analysis_model_type != 'External';

SET analysis_type = 'External'
WHERE analysis_model_type = 'External';