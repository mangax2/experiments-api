ALTER TABLE public.factor
   ADD tier numeric CHECK(tier > 0);

CREATE TABLE ref_group_type (
id serial NOT NULL,
type varchar NOT NULL,
created_user_id character varying NOT NULL,
created_date timestamp with time zone NOT NULL,
modified_user_id character varying NOT NULL,
modified_date timestamp with time zone NOT NULL,
CONSTRAINT ref_group_type_pk PRIMARY KEY (id),
CONSTRAINT ref_group_type_ak_1 UNIQUE(type)
);

ALTER TABLE public.group ADD COLUMN ref_group_type_id integer;

ALTER TABLE public.group ADD CONSTRAINT "Group_Ref_Group_Type"
 FOREIGN KEY (ref_group_type_id) REFERENCES public.ref_group_type (id) MATCH SIMPLE
ON UPDATE NO ACTION ON DELETE NO ACTION;

INSERT INTO public.ref_group_type (type, created_user_id, created_date, modified_user_id, modified_date) VALUES ('Location', 'KMCCL', CURRENT_TIMESTAMP, 'KMCCL', CURRENT_TIMESTAMP);
INSERT INTO public.ref_group_type (type, created_user_id, created_date, modified_user_id, modified_date) VALUES ('Block', 'KMCCL', CURRENT_TIMESTAMP, 'KMCCL', CURRENT_TIMESTAMP);
INSERT INTO public.ref_group_type (type, created_user_id, created_date, modified_user_id, modified_date) VALUES ('Rep', 'KMCCL', CURRENT_TIMESTAMP, 'KMCCL', CURRENT_TIMESTAMP);
INSERT INTO public.ref_group_type (type, created_user_id, created_date, modified_user_id, modified_date) VALUES ('Split Plot', 'KMCCL', CURRENT_TIMESTAMP, 'KMCCL', CURRENT_TIMESTAMP);
