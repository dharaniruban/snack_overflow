CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'member')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Emails are unique case-insensitively without forcing a canonical case.
CREATE UNIQUE INDEX users_email_lower_key ON users (lower(email));

CREATE TABLE snacks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('sweet', 'savoury', 'drink', 'healthy-ish')),
  quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  low_stock_threshold INTEGER NOT NULL DEFAULT 5 CHECK (low_stock_threshold >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX snacks_name_lower_key ON snacks (lower(name));
CREATE INDEX snacks_category_idx ON snacks (category);

CREATE TABLE votes (
  user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  snack_id UUID NOT NULL REFERENCES snacks (id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, snack_id)
);

-- snack_id gets its own index because the PK leads with user_id.
CREATE INDEX votes_snack_id_idx ON votes (snack_id);

CREATE TABLE activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  snack_id UUID REFERENCES snacks (id) ON DELETE SET NULL,
  snack_name TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('consumed', 'restocked')),
  amount INTEGER NOT NULL CHECK (amount > 0),
  quantity_before INTEGER NOT NULL,
  quantity_after INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX activity_created_at_idx ON activity (created_at DESC);
CREATE INDEX activity_snack_id_idx ON activity (snack_id);
