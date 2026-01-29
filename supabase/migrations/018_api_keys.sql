-- Migration 018: API Keys and Webhooks
-- Adds public API authentication and webhook subscription support

-- Create api_keys table for API authentication
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  -- Store hashed key, never plain text
  key_hash TEXT NOT NULL UNIQUE,
  -- Key prefix for identification (first 8 chars of key)
  key_prefix TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  -- Rate limit tier for different access levels
  rate_limit_tier TEXT DEFAULT 'standard' CHECK (rate_limit_tier IN ('standard', 'premium', 'unlimited')),
  -- Permissions scope
  scopes TEXT[] DEFAULT ARRAY['read:checkins', 'write:checkins', 'read:stats']
);

-- Create webhook_subscriptions table
CREATE TABLE IF NOT EXISTS webhook_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  -- Events to subscribe to
  events TEXT[] NOT NULL DEFAULT ARRAY['checkin.completed'],
  -- Secret for signing webhook payloads (HMAC-SHA256)
  signing_secret TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  -- Track delivery health
  last_delivery_at TIMESTAMPTZ,
  last_delivery_status TEXT CHECK (last_delivery_status IN ('success', 'failed', 'pending')),
  consecutive_failures INTEGER DEFAULT 0,
  -- Auto-disable after 10 consecutive failures
  CONSTRAINT max_consecutive_failures CHECK (consecutive_failures <= 10)
);

-- Create webhook_deliveries table for delivery logging
CREATE TABLE IF NOT EXISTS webhook_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id UUID NOT NULL REFERENCES webhook_subscriptions(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  response_status INTEGER,
  response_body TEXT,
  delivered_at TIMESTAMPTZ DEFAULT NOW(),
  delivery_duration_ms INTEGER,
  success BOOLEAN DEFAULT false
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash ON api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_api_keys_prefix ON api_keys(key_prefix);
CREATE INDEX IF NOT EXISTS idx_api_keys_active ON api_keys(is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_webhooks_user_id ON webhook_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_webhooks_active ON webhook_subscriptions(is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_webhook ON webhook_deliveries(webhook_id);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_time ON webhook_deliveries(delivered_at DESC);

-- Enable RLS
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_deliveries ENABLE ROW LEVEL SECURITY;

-- API Keys policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'api_keys' AND policyname = 'Users can view own API keys'
  ) THEN
    CREATE POLICY "Users can view own API keys"
      ON api_keys FOR SELECT
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'api_keys' AND policyname = 'Users can create own API keys'
  ) THEN
    CREATE POLICY "Users can create own API keys"
      ON api_keys FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'api_keys' AND policyname = 'Users can update own API keys'
  ) THEN
    CREATE POLICY "Users can update own API keys"
      ON api_keys FOR UPDATE
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'api_keys' AND policyname = 'Users can delete own API keys'
  ) THEN
    CREATE POLICY "Users can delete own API keys"
      ON api_keys FOR DELETE
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Webhook subscription policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'webhook_subscriptions' AND policyname = 'Users can view own webhooks'
  ) THEN
    CREATE POLICY "Users can view own webhooks"
      ON webhook_subscriptions FOR SELECT
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'webhook_subscriptions' AND policyname = 'Users can create own webhooks'
  ) THEN
    CREATE POLICY "Users can create own webhooks"
      ON webhook_subscriptions FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'webhook_subscriptions' AND policyname = 'Users can update own webhooks'
  ) THEN
    CREATE POLICY "Users can update own webhooks"
      ON webhook_subscriptions FOR UPDATE
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'webhook_subscriptions' AND policyname = 'Users can delete own webhooks'
  ) THEN
    CREATE POLICY "Users can delete own webhooks"
      ON webhook_subscriptions FOR DELETE
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Webhook deliveries policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'webhook_deliveries' AND policyname = 'Users can view own webhook deliveries'
  ) THEN
    CREATE POLICY "Users can view own webhook deliveries"
      ON webhook_deliveries FOR SELECT
      USING (
        webhook_id IN (
          SELECT id FROM webhook_subscriptions WHERE user_id = auth.uid()
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'webhook_deliveries' AND policyname = 'System can insert webhook deliveries'
  ) THEN
    CREATE POLICY "System can insert webhook deliveries"
      ON webhook_deliveries FOR INSERT
      WITH CHECK (true);
  END IF;
END $$;

-- Add comments
COMMENT ON TABLE api_keys IS 'API keys for public API authentication';
COMMENT ON COLUMN api_keys.key_hash IS 'SHA-256 hash of the API key (never store plain text)';
COMMENT ON COLUMN api_keys.key_prefix IS 'First 8 characters of key for identification in UI';
COMMENT ON TABLE webhook_subscriptions IS 'User webhook subscriptions for event notifications';
COMMENT ON COLUMN webhook_subscriptions.signing_secret IS 'Secret used to sign webhook payloads with HMAC-SHA256';
COMMENT ON TABLE webhook_deliveries IS 'Log of webhook delivery attempts';
