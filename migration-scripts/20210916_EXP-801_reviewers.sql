
-- rename reviewer group columns
ALTER TABLE public.owner
    RENAME COLUMN reviewer_ids TO reviewer_group_ids;

-- add the reviewers column
ALTER TABLE public.owner
    ADD COLUMN reviewer_user_ids character varying[] NOT NULL DEFAULT ARRAY[]::character varying[];
