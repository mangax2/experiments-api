DROP FUNCTION IF EXISTS public.group_value_factor_level_id(text, text, integer);
ALTER TABLE public.unit DROP COLUMN "group_id";
DROP TABLE IF EXISTS  group_value;
DROP TABLE IF EXISTS  public.group;
DROP TABLE IF EXISTS  ref_group_type;
