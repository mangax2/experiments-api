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
