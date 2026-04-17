-- Add the missing UPDATE RLS policy on portal_clients.
-- Originally portal_clients only had a SELECT policy; the UPDATE
-- policy was applied manually in prod via SQL Editor and this
-- migration records it for parity across environments.
--
-- RUN MANUALLY IN SUPABASE SQL EDITOR. DO NOT run `supabase db push`.
-- Safe to re-run: uses IF NOT EXISTS pattern.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'portal_clients'
      AND policyname = 'Users update own data'
  ) THEN
    CREATE POLICY "Users update own data"
    ON portal_clients
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;
