ALTER TABLE public.owner ADD COLUMN group_ids character varying ARRAY;
drop table tag;

UPDATE public.owner
SET group_ids = Array[]::varchar[]
WHERE group_ids IS NULL;

UPDATE public.owner
SET user_ids = Array[]::varchar[]
WHERE user_ids IS NULL;

ALTER TABLE public.owner
  ALTER COLUMN user_ids SET NOT NULL,
  ALTER COLUMN group_ids SET NOT NULL,
  ALTER COLUMN user_ids SET DEFAULT Array[]::varchar[],
  ALTER COLUMN group_ids SET DEFAULT Array[]::varchar[];
  