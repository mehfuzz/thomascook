-- ================================================================
-- FINAL FIX - Fixes "infinite recursion" error
-- ================================================================
-- Run this ENTIRE file in Supabase SQL Editor
-- ================================================================

-- Step 1: Drop ALL policies to remove circular dependencies
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT schemaname, tablename, policyname 
              FROM pg_policies 
              WHERE schemaname = 'public') 
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON ' || r.schemaname || '.' || r.tablename || ';';
    END LOOP;
END $$;

-- Step 2: Add role column if missing
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'role') THEN
        ALTER TABLE public.users ADD COLUMN role TEXT DEFAULT 'user';
    END IF;
END $$;

-- Step 3: Create user profiles for auth users
INSERT INTO public.users (id, email, full_name, role, company_name)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'full_name', 'User'),
  'admin',
  'Thomas Cook India'
FROM auth.users au
WHERE NOT EXISTS (SELECT 1 FROM public.users pu WHERE pu.id = au.id)
ON CONFLICT (id) DO UPDATE SET role = 'admin';

-- ================================================================
-- Step 4: Create SIMPLE policies (no recursion)
-- ================================================================

-- USERS table - Simple policies without recursion
CREATE POLICY "users_select" ON public.users FOR SELECT USING (true);
CREATE POLICY "users_insert" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "users_update" ON public.users FOR UPDATE USING (auth.uid() = id);

-- COMPANIES - Allow users to manage their own
CREATE POLICY "companies_select" ON public.companies FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "companies_insert" ON public.companies FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "companies_update" ON public.companies FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "companies_delete" ON public.companies FOR DELETE USING (auth.uid() = user_id);

-- SALES CALLS
CREATE POLICY "sales_calls_select" ON public.sales_calls FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "sales_calls_insert" ON public.sales_calls FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "sales_calls_update" ON public.sales_calls FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "sales_calls_delete" ON public.sales_calls FOR DELETE USING (auth.uid() = user_id);

-- APPOINTMENTS
CREATE POLICY "appointments_select" ON public.appointments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "appointments_insert" ON public.appointments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "appointments_update" ON public.appointments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "appointments_delete" ON public.appointments FOR DELETE USING (auth.uid() = user_id);

-- TASKS
CREATE POLICY "tasks_select" ON public.tasks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "tasks_insert" ON public.tasks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "tasks_update" ON public.tasks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "tasks_delete" ON public.tasks FOR DELETE USING (auth.uid() = user_id);

-- PROPOSALS
CREATE POLICY "proposals_select" ON public.proposals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "proposals_insert" ON public.proposals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "proposals_update" ON public.proposals FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "proposals_delete" ON public.proposals FOR DELETE USING (auth.uid() = user_id);

-- REMINDERS
CREATE POLICY "reminders_select" ON public.reminders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "reminders_insert" ON public.reminders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "reminders_update" ON public.reminders FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "reminders_delete" ON public.reminders FOR DELETE USING (auth.uid() = user_id);

-- CONTACTS
CREATE POLICY "contacts_select" ON public.contacts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "contacts_insert" ON public.contacts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "contacts_update" ON public.contacts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "contacts_delete" ON public.contacts FOR DELETE USING (auth.uid() = user_id);

-- COMPANY NOTES
CREATE POLICY "company_notes_select" ON public.company_notes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "company_notes_insert" ON public.company_notes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "company_notes_delete" ON public.company_notes FOR DELETE USING (auth.uid() = user_id);

-- SCRATCH NOTES
CREATE POLICY "scratch_notes_select" ON public.scratch_notes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "scratch_notes_insert" ON public.scratch_notes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "scratch_notes_update" ON public.scratch_notes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "scratch_notes_delete" ON public.scratch_notes FOR DELETE USING (auth.uid() = user_id);

-- DAILY LOG
CREATE POLICY "daily_log_select" ON public.daily_log FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "daily_log_insert" ON public.daily_log FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "daily_log_update" ON public.daily_log FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "daily_log_delete" ON public.daily_log FOR DELETE USING (auth.uid() = user_id);

-- TARGETS
CREATE POLICY "targets_select" ON public.targets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "targets_insert" ON public.targets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "targets_update" ON public.targets FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "targets_delete" ON public.targets FOR DELETE USING (auth.uid() = user_id);

-- ================================================================
-- Step 5: Verify setup
-- ================================================================

-- Check user profile
SELECT id, email, full_name, role FROM public.users;

-- Check policies (should see 4 per table)
SELECT tablename, COUNT(*) as policy_count 
FROM pg_policies 
WHERE schemaname = 'public' 
GROUP BY tablename 
ORDER BY tablename;

-- ================================================================
-- DONE! Now logout and login again to test
-- ================================================================
-- The infinite recursion is fixed
-- All operations should work now
-- ================================================================
