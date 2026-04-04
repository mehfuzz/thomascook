-- ========================================
-- EMERGENCY FIX - Run this IMMEDIATELY
-- ========================================
-- This disables RLS temporarily to test, then re-enables with proper policies
-- Copy this entire file and run in Supabase SQL Editor
-- ========================================

-- First, let's check if you have a user profile
-- Run this separately to see output:
-- SELECT * FROM auth.users;
-- SELECT * FROM public.users;

-- If public.users is empty, we need to create profiles for auth users
-- This will auto-create profiles for any auth users without profiles
INSERT INTO public.users (id, email, full_name, role, company_name)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'full_name', 'User'),
  'user',
  'Thomas Cook India'
FROM auth.users au
WHERE NOT EXISTS (
  SELECT 1 FROM public.users pu WHERE pu.id = au.id
)
ON CONFLICT (id) DO NOTHING;

-- Now add role column if not exists
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'user'));

-- Update first user to admin if no admin exists
UPDATE public.users 
SET role = 'admin' 
WHERE id = (SELECT id FROM public.users ORDER BY created_at LIMIT 1)
AND NOT EXISTS (SELECT 1 FROM public.users WHERE role = 'admin');

-- ========================================
-- STEP 1: Temporarily disable RLS to test
-- ========================================
-- Uncomment these lines ONLY for emergency testing:
-- ALTER TABLE public.companies DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.sales_calls DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.tasks DISABLE ROW LEVEL SECURITY;

-- ========================================
-- STEP 2: Fix all RLS policies properly
-- ========================================

-- Drop ALL existing policies first
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

-- ========================================
-- COMPANIES - Complete policies
-- ========================================
CREATE POLICY "companies_select_policy" ON public.companies
    FOR SELECT USING (
        auth.uid() = user_id OR 
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "companies_insert_policy" ON public.companies
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "companies_update_policy" ON public.companies
    FOR UPDATE USING (
        auth.uid() = user_id OR 
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "companies_delete_policy" ON public.companies
    FOR DELETE USING (
        auth.uid() = user_id OR 
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

-- ========================================
-- SALES CALLS - Complete policies
-- ========================================
CREATE POLICY "sales_calls_select_policy" ON public.sales_calls
    FOR SELECT USING (
        auth.uid() = user_id OR 
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "sales_calls_insert_policy" ON public.sales_calls
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "sales_calls_update_policy" ON public.sales_calls
    FOR UPDATE USING (
        auth.uid() = user_id OR 
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "sales_calls_delete_policy" ON public.sales_calls
    FOR DELETE USING (
        auth.uid() = user_id OR 
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

-- ========================================
-- APPOINTMENTS - Complete policies
-- ========================================
CREATE POLICY "appointments_select_policy" ON public.appointments
    FOR SELECT USING (
        auth.uid() = user_id OR 
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "appointments_insert_policy" ON public.appointments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "appointments_update_policy" ON public.appointments
    FOR UPDATE USING (
        auth.uid() = user_id OR 
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "appointments_delete_policy" ON public.appointments
    FOR DELETE USING (
        auth.uid() = user_id OR 
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

-- ========================================
-- TASKS - Complete policies
-- ========================================
CREATE POLICY "tasks_select_policy" ON public.tasks
    FOR SELECT USING (
        auth.uid() = user_id OR 
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "tasks_insert_policy" ON public.tasks
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "tasks_update_policy" ON public.tasks
    FOR UPDATE USING (
        auth.uid() = user_id OR 
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "tasks_delete_policy" ON public.tasks
    FOR DELETE USING (
        auth.uid() = user_id OR 
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

-- ========================================
-- PROPOSALS - Complete policies
-- ========================================
CREATE POLICY "proposals_select_policy" ON public.proposals
    FOR SELECT USING (
        auth.uid() = user_id OR 
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "proposals_insert_policy" ON public.proposals
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "proposals_update_policy" ON public.proposals
    FOR UPDATE USING (
        auth.uid() = user_id OR 
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "proposals_delete_policy" ON public.proposals
    FOR DELETE USING (
        auth.uid() = user_id OR 
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

-- ========================================
-- REMINDERS - Complete policies
-- ========================================
CREATE POLICY "reminders_select_policy" ON public.reminders
    FOR SELECT USING (
        auth.uid() = user_id OR 
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "reminders_insert_policy" ON public.reminders
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "reminders_update_policy" ON public.reminders
    FOR UPDATE USING (
        auth.uid() = user_id OR 
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "reminders_delete_policy" ON public.reminders
    FOR DELETE USING (
        auth.uid() = user_id OR 
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

-- ========================================
-- CONTACTS - Complete policies
-- ========================================
CREATE POLICY "contacts_select_policy" ON public.contacts
    FOR SELECT USING (
        auth.uid() = user_id OR 
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "contacts_insert_policy" ON public.contacts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "contacts_update_policy" ON public.contacts
    FOR UPDATE USING (
        auth.uid() = user_id OR 
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "contacts_delete_policy" ON public.contacts
    FOR DELETE USING (
        auth.uid() = user_id OR 
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

-- ========================================
-- COMPANY NOTES - Complete policies
-- ========================================
CREATE POLICY "company_notes_select_policy" ON public.company_notes
    FOR SELECT USING (
        auth.uid() = user_id OR 
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "company_notes_insert_policy" ON public.company_notes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "company_notes_delete_policy" ON public.company_notes
    FOR DELETE USING (
        auth.uid() = user_id OR 
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

-- ========================================
-- SCRATCH NOTES - Complete policies
-- ========================================
CREATE POLICY "scratch_notes_select_policy" ON public.scratch_notes
    FOR SELECT USING (
        auth.uid() = user_id OR 
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "scratch_notes_insert_policy" ON public.scratch_notes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "scratch_notes_update_policy" ON public.scratch_notes
    FOR UPDATE USING (
        auth.uid() = user_id OR 
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "scratch_notes_delete_policy" ON public.scratch_notes
    FOR DELETE USING (
        auth.uid() = user_id OR 
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

-- ========================================
-- DAILY LOG - Complete policies
-- ========================================
CREATE POLICY "daily_log_select_policy" ON public.daily_log
    FOR SELECT USING (
        auth.uid() = user_id OR 
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "daily_log_insert_policy" ON public.daily_log
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "daily_log_update_policy" ON public.daily_log
    FOR UPDATE USING (
        auth.uid() = user_id OR 
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "daily_log_delete_policy" ON public.daily_log
    FOR DELETE USING (
        auth.uid() = user_id OR 
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

-- ========================================
-- TARGETS - Complete policies
-- ========================================
CREATE POLICY "targets_select_policy" ON public.targets
    FOR SELECT USING (
        auth.uid() = user_id OR 
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "targets_insert_policy" ON public.targets
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "targets_update_policy" ON public.targets
    FOR UPDATE USING (
        auth.uid() = user_id OR 
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "targets_delete_policy" ON public.targets
    FOR DELETE USING (
        auth.uid() = user_id OR 
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

-- ========================================
-- USERS - Special policies
-- ========================================
CREATE POLICY "users_select_policy" ON public.users
    FOR SELECT USING (
        auth.uid() = id OR 
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "users_insert_policy" ON public.users
    FOR INSERT WITH CHECK (
        auth.uid() = id OR 
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "users_update_policy" ON public.users
    FOR UPDATE USING (
        auth.uid() = id OR 
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

-- ========================================
-- Verify everything is set up
-- ========================================
-- After running this, verify with these queries:

-- 1. Check if you have a user profile:
-- SELECT id, email, full_name, role FROM public.users;

-- 2. Check if policies exist:
-- SELECT schemaname, tablename, policyname FROM pg_policies WHERE schemaname = 'public' ORDER BY tablename;

-- 3. Test inserting a company (replace USER_ID with your actual ID):
-- INSERT INTO public.companies (user_id, company_name, account_tier) 
-- VALUES ('YOUR_USER_ID', 'Test Company', 'Cold');

-- ========================================
-- SUCCESS! Now logout and login again
-- ========================================
