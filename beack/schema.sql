CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS characters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  system text NOT NULL DEFAULT 'D&D 5.5e',
  class_name text NOT NULL,
  level integer NOT NULL DEFAULT 1,
  race text NOT NULL,
  background text,
  alignment text,
  sheet_data jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS characters_name_idx ON characters (name);
CREATE INDEX IF NOT EXISTS characters_sheet_data_gin_idx ON characters USING gin (sheet_data);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'characters_name_unique'
  ) THEN
    ALTER TABLE characters
    ADD CONSTRAINT characters_name_unique UNIQUE (name);
  END IF;
END
$$;
