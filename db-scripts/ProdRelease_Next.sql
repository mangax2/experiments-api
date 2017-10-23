CREATE TABLE factor_level_association(
  id SERIAL NOT NULL,
  associated_level_id integer NOT NULL,
  nested_level_id integer NOT NULL,
  created_user_id varchar not null,
  created_date timestamp with time zone not null,
  modified_user_id varchar not null,
  modified_date timestamp with time zone not null,
  CONSTRAINT factor_level_association_pk PRIMARY KEY(id),
  CONSTRAINT factor_level_association_associated_level_id
  FOREIGN KEY(associated_level_id)
  REFERENCES factor_level(id)
  ON DELETE CASCADE,
  CONSTRAINT factor_level_association_nested_level_id
  FOREIGN KEY(nested_level_id)
  REFERENCES factor_level(id)
  ON DELETE CASCADE,
  CONSTRAINT factor_level_association_ak UNIQUE(associated_level_id,nested_level_id)
);