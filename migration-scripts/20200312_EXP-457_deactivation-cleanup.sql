UPDATE unit
SET deactivation_reason = 'ec96c59d-8e1b-431c-b792-ac6192788afb'
WHERE deactivation_reason = 'Environmental - Hail/wind';

UPDATE unit
SET deactivation_reason = '0aacac97-11e4-41c5-af75-fe0723d07600'
WHERE deactivation_reason = 'Environmental - Ponding';

UPDATE unit
SET deactivation_reason = null
WHERE length(deactivation_reason) <> 36;