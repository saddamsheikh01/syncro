-- Widen analytics_ingestion_errors text columns from varchar(255) to TEXT
-- to prevent "value too long" errors on long error messages or idempotency keys.

ALTER TABLE analytics_ingestion_errors
    ALTER COLUMN error_message TYPE TEXT,
    ALTER COLUMN error_code    TYPE TEXT,
    ALTER COLUMN idempotency_key TYPE TEXT;
