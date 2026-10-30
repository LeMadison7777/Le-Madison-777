BEGIN;

CREATE TYPE marketplace_role AS ENUM ('member', 'moderator', 'admin');
CREATE TYPE account_status AS ENUM ('active', 'suspended', 'closed');
CREATE TYPE listing_condition AS ENUM ('new_with_tags', 'new_without_tags', 'very_good', 'good', 'fair');
CREATE TYPE listing_status AS ENUM ('draft', 'published', 'reserved', 'sold', 'suspended', 'withdrawn');
CREATE TYPE order_status AS ENUM ('pending_payment', 'paid', 'processing', 'shipped', 'completed', 'cancelled', 'disputed', 'refunded');
CREATE TYPE payment_status AS ENUM ('pending', 'succeeded', 'failed', 'cancelled', 'refunded');
CREATE TYPE delivery_method AS ENUM ('delivery', 'pickup');
CREATE TYPE delivery_status AS ENUM ('pending', 'arranged', 'in_transit', 'delivered', 'cancelled');
CREATE TYPE moderation_status AS ENUM ('open', 'reviewing', 'resolved', 'dismissed');

-- Authentication identity and email belong to the chosen auth provider.
CREATE TABLE profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_subject text NOT NULL UNIQUE,
  display_name text NOT NULL CHECK (length(trim(display_name)) BETWEEN 2 AND 80),
  username text NOT NULL CHECK (length(trim(username)) BETWEEN 2 AND 40),
  phone text,
  city text,
  country_code char(2) NOT NULL DEFAULT 'CG',
  biography text CHECK (biography IS NULL OR length(biography) <= 500),
  avatar_object_key text,
  role marketplace_role NOT NULL DEFAULT 'member',
  status account_status NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX profiles_username_ci_uq ON profiles (lower(username));

CREATE TABLE categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id uuid REFERENCES categories(id) ON DELETE RESTRICT,
  name text NOT NULL CHECK (length(trim(name)) BETWEEN 1 AND 80),
  slug text NOT NULL UNIQUE,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (parent_id IS NULL OR parent_id <> id)
);

CREATE TABLE listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  category_id uuid NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  title text NOT NULL CHECK (length(trim(title)) BETWEEN 3 AND 140),
  description text NOT NULL CHECK (length(trim(description)) BETWEEN 1 AND 5000),
  brand text,
  size_label text,
  condition listing_condition NOT NULL,
  price_xaf bigint NOT NULL CHECK (price_xaf > 0),
  currency char(3) NOT NULL DEFAULT 'XAF' CHECK (currency = 'XAF'),
  city text NOT NULL,
  country_code char(2) NOT NULL DEFAULT 'CG',
  status listing_status NOT NULL DEFAULT 'draft',
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX listings_public_catalog_idx ON listings (status, published_at DESC, id)
  WHERE status IN ('published', 'reserved');
CREATE INDEX listings_category_city_idx ON listings (category_id, city, price_xaf)
  WHERE status = 'published';
CREATE INDEX listings_seller_idx ON listings (seller_id, created_at DESC);

-- Store R2 object keys and metadata, not credentials or presigned URLs.
CREATE TABLE listing_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  object_key text NOT NULL UNIQUE,
  alt_text text,
  content_type text NOT NULL CHECK (content_type IN ('image/jpeg', 'image/png', 'image/webp', 'image/avif')),
  byte_size integer NOT NULL CHECK (byte_size BETWEEN 1 AND 15728640),
  position smallint NOT NULL CHECK (position BETWEEN 0 AND 9),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (listing_id, position)
);

CREATE TABLE favorites (
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  listing_id uuid NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (profile_id, listing_id)
);
CREATE INDEX favorites_listing_idx ON favorites (listing_id);

CREATE TABLE conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES listings(id) ON DELETE RESTRICT,
  buyer_id uuid NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  seller_id uuid NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_message_at timestamptz NOT NULL DEFAULT now(),
  CHECK (buyer_id <> seller_id),
  UNIQUE (listing_id, buyer_id)
);
CREATE INDEX conversations_buyer_idx ON conversations (buyer_id, last_message_at DESC);
CREATE INDEX conversations_seller_idx ON conversations (seller_id, last_message_at DESC);

CREATE TABLE messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  body text NOT NULL CHECK (length(trim(body)) BETWEEN 1 AND 5000),
  created_at timestamptz NOT NULL DEFAULT now(),
  read_at timestamptz
);
CREATE INDEX messages_conversation_idx ON messages (conversation_id, created_at);

CREATE TABLE message_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  object_key text NOT NULL UNIQUE,
  content_type text NOT NULL CHECK (content_type IN ('image/jpeg', 'image/png', 'image/webp', 'image/avif')),
  byte_size integer NOT NULL CHECK (byte_size BETWEEN 1 AND 15728640),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES listings(id) ON DELETE RESTRICT,
  buyer_id uuid NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  seller_id uuid NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  status order_status NOT NULL DEFAULT 'pending_payment',
  item_price_xaf bigint NOT NULL CHECK (item_price_xaf > 0),
  commission_xaf bigint NOT NULL DEFAULT 0 CHECK (commission_xaf >= 0 AND commission_xaf <= item_price_xaf),
  delivery_fee_xaf bigint NOT NULL DEFAULT 0 CHECK (delivery_fee_xaf >= 0),
  total_xaf bigint GENERATED ALWAYS AS (item_price_xaf + delivery_fee_xaf) STORED,
  seller_payout_xaf bigint GENERATED ALWAYS AS (item_price_xaf - commission_xaf) STORED,
  currency char(3) NOT NULL DEFAULT 'XAF' CHECK (currency = 'XAF'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (buyer_id <> seller_id)
);
-- A unique second-hand listing can have only one active sale at a time.
CREATE UNIQUE INDEX orders_one_active_sale_per_listing_idx ON orders (listing_id)
  WHERE status NOT IN ('cancelled', 'refunded');
CREATE INDEX orders_buyer_idx ON orders (buyer_id, created_at DESC);
CREATE INDEX orders_seller_idx ON orders (seller_id, created_at DESC);

CREATE TABLE payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
  provider text NOT NULL CHECK (provider IN ('mobile_money', 'rtl_money', 'manual')),
  provider_reference text UNIQUE,
  idempotency_key text NOT NULL UNIQUE,
  status payment_status NOT NULL DEFAULT 'pending',
  amount_xaf bigint NOT NULL CHECK (amount_xaf > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX payments_order_idx ON payments (order_id, created_at DESC);

CREATE TABLE fulfillments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL UNIQUE REFERENCES orders(id) ON DELETE RESTRICT,
  method delivery_method NOT NULL,
  status delivery_status NOT NULL DEFAULT 'pending',
  city text NOT NULL,
  pickup_or_delivery_details text,
  tracking_reference text,
  confirmed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
  reviewer_id uuid NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  reviewee_id uuid NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  rating smallint NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text CHECK (comment IS NULL OR length(comment) <= 1200),
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (reviewer_id <> reviewee_id),
  UNIQUE (order_id, reviewer_id)
);
CREATE INDEX reviews_reviewee_idx ON reviews (reviewee_id, created_at DESC);

CREATE TABLE notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  kind text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX notifications_unread_idx ON notifications (profile_id, created_at DESC)
  WHERE read_at IS NULL;

CREATE TABLE moderation_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  target_type text NOT NULL CHECK (target_type IN ('listing', 'message', 'review', 'profile')),
  target_id uuid NOT NULL,
  reason text NOT NULL CHECK (length(trim(reason)) BETWEEN 3 AND 1000),
  status moderation_status NOT NULL DEFAULT 'open',
  reviewer_id uuid REFERENCES profiles(id) ON DELETE RESTRICT,
  resolution_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);
CREATE INDEX moderation_reports_queue_idx ON moderation_reports (status, created_at);

CREATE TABLE platform_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE audit_logs (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  actor_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX audit_logs_entity_idx ON audit_logs (entity_type, entity_id, created_at DESC);

CREATE FUNCTION set_updated_at() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_set_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER categories_set_updated_at BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER listings_set_updated_at BEFORE UPDATE ON listings
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER orders_set_updated_at BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER payments_set_updated_at BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER fulfillments_set_updated_at BEFORE UPDATE ON fulfillments
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMENT ON COLUMN profiles.role IS 'Server-managed authorization role; never accept role changes from a browser request.';
COMMENT ON COLUMN listing_images.object_key IS 'R2 object key. Construct delivery URLs from a configured public base URL or signed URL service.';
COMMENT ON TABLE audit_logs IS 'Record minimal operational metadata; never write credentials, payment secrets, or message bodies here.';

COMMIT;
