-- Bind email-change OTP to the requested new email so the same OTP cannot confirm a different address.
-- NULL = initial verification OTP; non-NULL = SHA-256 of normalized target email for email-change OTP.
ALTER TABLE email_verification_otp
    ADD COLUMN IF NOT EXISTS target_email_hash VARCHAR(64) NULL;

COMMENT ON COLUMN email_verification_otp.target_email_hash IS 'For email-change OTPs: SHA-256 of normalized target email. NULL for initial verification OTPs.';
