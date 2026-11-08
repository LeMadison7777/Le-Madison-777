BEGIN;

CREATE TABLE push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  profile_id uuid NOT NULL
    REFERENCES profiles(id) ON DELETE CASCADE,

  endpoint text NOT NULL
    CHECK (length(endpoint) BETWEEN 1 AND 2048),

  p256dh text NOT NULL
    CHECK (length(p256dh) BETWEEN 1 AND 128),

  auth text NOT NULL
    CHECK (length(auth) BETWEEN 1 AND 128),

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT push_subscriptions_profile_endpoint_unique
    UNIQUE (profile_id, endpoint)
);

CREATE TRIGGER push_subscriptions_set_updated_at
  BEFORE UPDATE ON push_subscriptions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMENT ON TABLE push_subscriptions IS
  'Stores browser Push subscriptions. Subscription keys must never be exposed in API responses or logs.';

COMMIT;
