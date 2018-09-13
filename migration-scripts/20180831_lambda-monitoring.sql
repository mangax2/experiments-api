CREATE TABLE audit.lambda_performance(
    date_time timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    body_size BIGINT,
    response_size BIGINT,
    response_time BIGINT
)