-- ================================================================
-- CORRECTED RLS FIX - Eliminates infinite recursion completely
-- ================================================================
-- This fixes the "infinite recursion detected in policy for relation users" error
-- The problem: policies were querying the users table within users table policies
-- Solution: Use a helper function to cache the role check
-- ================================================================

-- Step 1: Drop ALL existing policies to start fresh
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

-- Step 2: Ensure role column exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'role') THEN
        ALTER TABLE public.users ADD COLUMN role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'user'));
    END IF;
END $$;

-- Step 3: Create user profile for current auth user (set as admin for testing)
INSERT INTO public.users (id, email, full_name, role, company_name)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'full_name', au.email),
  'admin',
  'Thomas Cook India'
FROM auth.users au
WHERE NOT EXISTS (SELECT 1 FROM public.users pu WHERE pu.id = au.id)
ON CONFLICT (id) DO UPDATE SET role = 'admin';

-- ================================================================
-- Step 4: Create a STABLE function to check if current user is admin
-- This prevents infinite recursion by marking the function as STABLE
-- ================================================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ================================================================
-- Step 5: Create NEW RLS policies using the helper function
-- ================================================================

-- ============================================
-- USERS TABLE
-- ============================================
-- Everyone can view their own profile
CREATE POLICY "users_select_own" ON public.users
  FOR SELECT
  USING (auth.uid() = id);

-- Admins can view all profiles (using helper function)
CREATE POLICY "users_select_admin" ON public.users
  FOR SELECT
  USING (public.is_admin());

-- Users can insert their own profile
CREATE POLICY "users_insert_own" ON public.users
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Admins can insert any user
CREATE POLICY "users_insert_admin" ON public.users
  FOR INSERT
  WITH CHECK (public.is_admin());

-- Users can update their own profile
CREATE POLICY "users_update_own" ON public.users
  FOR UPDATE
  USING (auth.uid() = id);

-- Admins can update any user
CREATE POLICY "users_update_admin" ON public.users
  FOR UPDATE
  USING (public.is_admin());

-- ============================================
-- COMPANIES TABLE
-- ============================================
CREATE POLICY "companies_select" ON public.companies
  FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "companies_insert" ON public.companies
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "companies_update" ON public.companies
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "companies_delete" ON public.companies
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- CONTACTS TABLE
-- ============================================
CREATE POLICY "contacts_select" ON public.contacts
  FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "contacts_insert" ON public.contacts
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "contacts_update" ON public.contacts
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "contacts_delete" ON public.contacts
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- SALES CALLS TABLE
-- ============================================
CREATE POLICY "sales_calls_select" ON public.sales_calls
  FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "sales_calls_insert" ON public.sales_calls
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "sales_calls_update" ON public.sales_calls
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "sales_calls_delete" ON public.sales_calls
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- APPOINTMENTS TABLE
-- ============================================
CREATE POLICY "appointments_select" ON public.appointments
  FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "appointments_insert" ON public.appointments
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "appointments_update" ON public.appointments
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "appointments_delete" ON public.appointments
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- TASKS TABLE
-- ============================================
CREATE POLICY "tasks_select" ON public.tasks
  FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "tasks_insert" ON public.tasks
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "tasks_update" ON public.tasks
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "tasks_delete" ON public.tasks
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- PROPOSALS TABLE
-- ============================================
CREATE POLICY "proposals_select" ON public.proposals
  FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "proposals_insert" ON public.proposals
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "proposals_update" ON public.proposals
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "proposals_delete" ON public.proposals
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- REMINDERS TABLE
-- ============================================
CREATE POLICY "reminders_select" ON public.reminders
  FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "reminders_insert" ON public.reminders
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "reminders_update" ON public.reminders
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "reminders_delete" ON public.reminders
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- COMPANY NOTES TABLE
-- ============================================
CREATE POLICY "company_notes_select" ON public.company_notes
  FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "company_notes_insert" ON public.company_notes
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "company_notes_delete" ON public.company_notes
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- SCRATCH NOTES TABLE
-- ============================================
CREATE POLICY "scratch_notes_select" ON public.scratch_notes
  FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "scratch_notes_insert" ON public.scratch_notes
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "scratch_notes_update" ON public.scratch_notes
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "scratch_notes_delete" ON public.scratch_notes
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- DAILY LOG TABLE
-- ============================================
CREATE POLICY "daily_log_select" ON public.daily_log
  FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "daily_log_insert" ON public.daily_log
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "daily_log_update" ON public.daily_log
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "daily_log_delete" ON public.daily_log
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- TARGETS TABLE
-- ============================================
CREATE POLICY "targets_select" ON public.targets
  FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "targets_insert" ON public.targets
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "targets_update" ON public.targets
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "targets_delete" ON public.targets
  FOR DELETE
  USING (auth.uid() = user_id);

-- ================================================================
-- Step 6: Verification Queries
-- ================================================================

-- Check that admin user was created
SELECT id, email, full_name, role FROM public.users;

-- Check that policies are in place (should see multiple policies per table)
SELECT tablename, COUNT(*) as policy_count 
FROM pg_policies 
WHERE schemaname = 'public' 
GROUP BY tablename 
ORDER BY tablename;

-- Verify the helper function exists
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_schema = 'public' AND routine_name = 'is_admin';

-- ================================================================
-- DONE! 
-- ================================================================
-- Now logout and login again to your app
-- The infinite recursion error should be completely resolved
-- Companies, sales calls, and all other data should load properly
-- ================================================================
