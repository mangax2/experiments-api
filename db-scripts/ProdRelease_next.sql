CREATE INDEX group_value_group_id
    ON public.group_value USING btree
    (group_id)
    TABLESPACE pg_default;

DROP TRIGGER audit_trigger_row ON public.group_value;
DROP TRIGGER audit_trigger_stm ON public.group_value;
DROP TRIGGER audit_trigger_row ON public.group;
DROP TRIGGER audit_trigger_stm ON public.group;