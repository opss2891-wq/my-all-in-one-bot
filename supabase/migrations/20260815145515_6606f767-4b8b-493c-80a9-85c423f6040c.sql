-- Allow PIN-based guest access (single shared guest user id)
ALTER TABLE public.conversations DROP CONSTRAINT IF EXISTS conversations_user_id_fkey;
ALTER TABLE public.messages DROP CONSTRAINT IF EXISTS messages_user_id_fkey;
ALTER TABLE public.tasks DROP CONSTRAINT IF EXISTS tasks_user_id_fkey;
ALTER TABLE public.credentials DROP CONSTRAINT IF EXISTS credentials_user_id_fkey;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.conversations TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.messages TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tasks TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.credentials TO anon;

DROP POLICY IF EXISTS "Guest pin access conversations" ON public.conversations;
CREATE POLICY "Guest pin access conversations" ON public.conversations
  FOR ALL TO anon
  USING (user_id = '00000000-0000-0000-0000-000000000000'::uuid)
  WITH CHECK (user_id = '00000000-0000-0000-0000-000000000000'::uuid);

DROP POLICY IF EXISTS "Guest pin access messages" ON public.messages;
CREATE POLICY "Guest pin access messages" ON public.messages
  FOR ALL TO anon
  USING (user_id = '00000000-0000-0000-0000-000000000000'::uuid)
  WITH CHECK (user_id = '00000000-0000-0000-0000-000000000000'::uuid);

DROP POLICY IF EXISTS "Guest pin access tasks" ON public.tasks;
CREATE POLICY "Guest pin access tasks" ON public.tasks
  FOR ALL TO anon
  USING (user_id = '00000000-0000-0000-0000-000000000000'::uuid)
  WITH CHECK (user_id = '00000000-0000-0000-0000-000000000000'::uuid);

DROP POLICY IF EXISTS "Guest pin access credentials" ON public.credentials;
CREATE POLICY "Guest pin access credentials" ON public.credentials
  FOR ALL TO anon
  USING (user_id = '00000000-0000-0000-0000-000000000000'::uuid)
  WITH CHECK (user_id = '00000000-0000-0000-0000-000000000000'::uuid);