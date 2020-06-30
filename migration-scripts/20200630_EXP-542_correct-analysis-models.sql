UPDATE analysis_model
SET analysis_model_sub_type = CASE WHEN analysis_model_type = 'External' THEN NULL ELSE 'BLUE' END
WHERE analysis_model_sub_type IS NULL;

UPDATE analysis_model
SET analysis_model_type = 'GUBD2'
WHERE analysis_model_type = 'GroupBlock';
