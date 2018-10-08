ALTER TABLE comment
DROP CONSTRAINT "Comments_Experiment",
ADD CONSTRAINT comments_experiment
    FOREIGN KEY (experiment_id)
    REFERENCES experiment(id)
    ON DELETE CASCADE;
