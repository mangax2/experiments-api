CREATE TABLE location_association (
    experiment_id integer NOT NULL,
    location integer NOT NULL,
    set_id integer NOT NULL UNIQUE,
    UNIQUE (experiment_id, location)
);

INSERT INTO location_association
  SELECT g.experiment_id, to_number(gv.value, '9999999999') as location, g.set_id
    FROM "group" g INNER JOIN group_value gv ON gv.group_id = g.id
    WHERE gv.name = 'locationNumber' AND g.set_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- Dev

-- GRANT INSERT, DELETE, UPDATE, SELECT ON TABLE public.comment TO experiments_dev_app_user;

-- GRANT SELECT ON TABLE public.comment TO experiments_ro_user;

-- NP

-- GRANT INSERT, DELETE, UPDATE, SELECT ON TABLE public.location_association TO experiments_app_user;

-- Prod

-- GRANT INSERT, DELETE, UPDATE, SELECT ON TABLE public.comment TO experiments_secure_app_user;

-- GRANT SELECT ON TABLE public.comment TO experiments_secure_ro_user;


