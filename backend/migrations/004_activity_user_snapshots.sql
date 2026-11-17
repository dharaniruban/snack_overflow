-- Preserve audit history when a user is deleted: snapshot the actor's
-- name/email on each activity row and null out user_id (ON DELETE SET NULL)
-- instead of cascading the audit row away.

ALTER TABLE activity ADD COLUMN IF NOT EXISTS user_name TEXT;
ALTER TABLE activity ADD COLUMN IF NOT EXISTS user_email TEXT;

UPDATE activity a
SET user_name = u.name,
    user_email = u.email
FROM users u
WHERE a.user_id = u.id;

ALTER TABLE activity ALTER COLUMN user_name SET NOT NULL;
ALTER TABLE activity ALTER COLUMN user_email SET NOT NULL;

ALTER TABLE activity DROP CONSTRAINT activity_user_id_fkey;
ALTER TABLE activity ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE activity
  ADD CONSTRAINT activity_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL;
