ALTER TABLE public.treatment DROP CONSTRAINT treatment_ak_1, ADD CONSTRAINT treatment_number_experiment UNIQUE(experiment_id, treatment_number) DEFERRABLE;
