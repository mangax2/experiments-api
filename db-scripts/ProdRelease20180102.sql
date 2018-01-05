UPDATE public.group
SET ref_randomization_strategy_id = 18 -- 21 for dev, np
WHERE ref_randomization_strategy_id IS NULL
