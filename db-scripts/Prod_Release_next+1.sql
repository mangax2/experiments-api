ALTER TABLE public.dependent_variable ADD question_code varchar NULL;
COMMENT ON COLUMN dependent_variable.question_code IS 'Referering Question Code from Q&A';