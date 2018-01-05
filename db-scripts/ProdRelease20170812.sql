CREATE INDEX group_value_group_id
    ON public.group_value USING btree
    (group_id)
    TABLESPACE pg_default;

DROP TRIGGER audit_trigger_row ON public.group_value;
DROP TRIGGER audit_trigger_stm ON public.group_value;
DROP TRIGGER audit_trigger_row ON public.group;
DROP TRIGGER audit_trigger_stm ON public.group;

ALTER TABLE public.experiment ADD is_template BOOLEAN;
UPDATE experiment SET is_template ='f';
ALTER TABLE experiment ALTER COLUMN is_template SET NOT NULL;
ALTER TABLE experiment ALTER COLUMN is_template SET DEFAULT FALSE;
CREATE INDEX experiment_is_template ON public.experiment using btree(is_template) TABLESPACE
pg_default;

ALTER TABLE experiment ALTER COLUMN status SET DEFAULT 'DRAFT';

