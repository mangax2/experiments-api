INSERT INTO ref_data_source_type (type, created_user_id, modified_user_id, created_date, modified_date)
VALUES('QandAV3', 'JGORD1', 'JGORD1', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO ref_data_source (name, ref_data_source_type_id, created_user_id, modified_user_id, created_date, modified_date)
SELECT 'Questions (v3)', id, 'JGORD1', 'JGORD1', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM ref_data_source_type
WHERE type = 'QandAV3';
