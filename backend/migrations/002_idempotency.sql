CREATE TABLE idempotency_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  snack_id UUID NOT NULL REFERENCES snacks (id) ON DELETE CASCADE,
  idempotency_key TEXT NOT NULL,
  amount INTEGER NOT NULL CHECK (amount > 0),
  response JSONB NOT NULL,
  status_code INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, snack_id, idempotency_key)
);
