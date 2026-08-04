-- Step 1: Drop old policy if exists
DROP POLICY IF EXISTS "Allow anon update blog" ON blog;

-- Step 2: Create new policy for anon updates
CREATE POLICY "Allow anon update blog" ON blog
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);
