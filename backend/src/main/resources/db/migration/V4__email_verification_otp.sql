-- Add is_email_verified to users (required for login)
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS is_email_verified BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN users.is_email_verified IS 'True when user has verified email via OTP; login allowed only when true';

-- OTP for email verification (6-digit code sent by email)
CREATE TABLE IF NOT EXISTS email_verification_otp (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    otp_hash VARCHAR(64) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_verification_otp_user_id ON email_verification_otp(user_id);
CREATE INDEX IF NOT EXISTS idx_email_verification_otp_expires_at ON email_verification_otp(expires_at);

COMMENT ON TABLE email_verification_otp IS '6-digit OTP for email verification; otp_hash is SHA-256 of the code';
