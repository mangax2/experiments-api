CREATE TABLE "public"."factor_level_details" (
	"id" serial,
    "factor_level_id" int4 NOT NULL,
	"factor_properties_for_level_id" int4 NOT NULL,
	"row_number" int4 NOT NULL,
	"value_type" varchar NOT NULL,
	"text" varchar,
	"value" varchar,
	"question_code" varchar,
	"uom_code" varchar,
	"created_user_id" character varying NOT NULL,
  	"created_date" timestamp with time zone NOT NULL,
  	"modified_user_id" character varying NOT NULL,
  	"modified_date" timestamp with time zone NOT NULL,
	PRIMARY KEY ("id")
);

CREATE TABLE "public"."factor_properties_for_level" (
	"id" serial,
	"factor_id" int4 NOT NULL,
	"column_number" int4 NOT NULL,
	"object_type" varchar NOT NULL,
    "label" varchar NOT NULL,
	"question_code" varchar,
	"multi_question_tag" varchar,
	"catalog_type" varchar,
	"created_user_id" character varying NOT NULL,
  	"created_date" timestamp with time zone NOT NULL,
  	"modified_user_id" character varying NOT NULL,
  	"modified_date" timestamp with time zone NOT NULL,
	PRIMARY KEY ("id")
);

ALTER TABLE "public"."factor_level_details"
	ADD FOREIGN KEY ("factor_level_id")
	REFERENCES "public"."factor_level" ("id")
	ON DELETE CASCADE;

ALTER TABLE "public"."factor_level_details"
	ADD FOREIGN KEY ("factor_properties_for_level_id")
	REFERENCES "public"."factor_properties_for_level" ("id")
	ON DELETE CASCADE;

ALTER TABLE "public"."factor_properties_for_level"
	ADD FOREIGN KEY ("factor_id")
	REFERENCES "public"."factor" ("id")
	ON DELETE CASCADE;

CREATE INDEX "factor_level_details_factor_level"
	ON "public"."factor_level_details"("factor_level_id");
CREATE INDEX "factor_level_details_factor_properties_for_level"
	ON "public"."factor_level_details"("factor_properties_for_level_id");

CREATE INDEX "factor_properties_for_level_factor"
	ON "public"."factor_properties_for_level"("factor_id");
