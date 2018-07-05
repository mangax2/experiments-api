ALTER TABLE public.owner
    ADD COLUMN reviewer_ids character varying[] NOT NULL DEFAULT ARRAY[]::character varying[];