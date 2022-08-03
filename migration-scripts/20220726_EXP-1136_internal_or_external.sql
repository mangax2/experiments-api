ALTER TABLE experiment
    ADD COLUMN analysis_type VARCHAR;

UPDATE experiment

SET analysis_type = (CASE 
                      WHEN analysis_model_type != 'External'
                        THEN 'Internal'
                        ELSE 'External'
                    END)

FROM analysis_model am WHERE experiment.id = am.experiment_id;