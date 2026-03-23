-- Sprint 2: User subscription plans (FREE / PREMIUM / SUPER_PRO)
CREATE TABLE user_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_code VARCHAR(20) NOT NULL DEFAULT 'FREE',
    billing_period VARCHAR(20) NOT NULL DEFAULT 'MONTHLY',
    price_cents INTEGER NOT NULL DEFAULT 0,
    stripe_subscription_id VARCHAR(255),
    stripe_customer_id VARCHAR(255),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_user_subscriptions_user ON user_subscriptions(user_id, status);
