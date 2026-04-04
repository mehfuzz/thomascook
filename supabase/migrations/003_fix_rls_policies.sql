-- Fix RLS Policies to Allow INSERT, UPDATE, DELETE Operations
-- Run this in Supabase SQL Editor

-- ============================================
-- COMPANIES TABLE - Allow all operations
-- ============================================
DROP POLICY IF EXISTS "Users can insert own companies" ON public.companies;
CREATE POLICY "Users can insert own companies" ON public.companies
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own companies" ON public.companies;
CREATE POLICY "Users can update companies" ON public.companies
    FOR UPDATE USING (
        auth.uid() = user_id 
        OR 
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

DROP POLICY IF EXISTS "Users can delete own companies" ON public.companies;
CREATE POLICY "Users can delete companies" ON public.companies
    FOR DELETE USING (
        auth.uid() = user_id 
        OR 
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

-- ============================================
-- SALES CALLS - Allow all operations
-- ============================================
DROP POLICY IF EXISTS "Users can insert own sales calls" ON public.sales_calls;
CREATE POLICY "Users can insert own sales calls" ON public.sales_calls
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own sales calls" ON public.sales_calls;
CREATE POLICY "Users can update sales calls" ON public.sales_calls
    FOR UPDATE USING (
        auth.uid() = user_id 
        OR 
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

DROP POLICY IF EXISTS "Users can delete own sales calls" ON public.sales_calls;
CREATE POLICY "Users can delete sales calls" ON public.sales_calls
    FOR DELETE USING (
        auth.uid() = user_id 
        OR 
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

-- ============================================
-- APPOINTMENTS - Allow all operations
-- ============================================
DROP POLICY IF EXISTS "Users can insert own appointments" ON public.appointments;
CREATE POLICY "Users can insert own appointments" ON public.appointments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own appointments" ON public.appointments;
CREATE POLICY "Users can update appointments" ON public.appointments
    FOR UPDATE USING (
        auth.uid() = user_id 
        OR 
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

DROP POLICY IF EXISTS "Users can delete own appointments" ON public.appointments;
CREATE POLICY "Users can delete appointments" ON public.appointments
    FOR DELETE USING (
        auth.uid() = user_id 
        OR 
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

-- ============================================
-- TASKS - Allow all operations
-- ============================================
DROP POLICY IF EXISTS "Users can insert own tasks" ON public.tasks;
CREATE POLICY "Users can insert own tasks" ON public.tasks
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own tasks" ON public.tasks;
CREATE POLICY "Users can update tasks" ON public.tasks
    FOR UPDATE USING (
        auth.uid() = user_id 
        OR 
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

DROP POLICY IF EXISTS "Users can delete own tasks" ON public.tasks;
CREATE POLICY "Users can delete tasks" ON public.tasks
    FOR DELETE USING (
        auth.uid() = user_id 
        OR 
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

-- ============================================
-- PROPOSALS - Allow all operations
-- ============================================
DROP POLICY IF EXISTS "Users can insert own proposals" ON public.proposals;
CREATE POLICY "Users can insert own proposals" ON public.proposals
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own proposals" ON public.proposals;
CREATE POLICY "Users can update proposals" ON public.proposals
    FOR UPDATE USING (
        auth.uid() = user_id 
        OR 
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

DROP POLICY IF EXISTS "Users can delete own proposals" ON public.proposals;
CREATE POLICY "Users can delete proposals" ON public.proposals
    FOR DELETE USING (
        auth.uid() = user_id 
        OR 
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

-- ============================================
-- REMINDERS - Allow all operations
-- ============================================
DROP POLICY IF EXISTS "Users can insert own reminders" ON public.reminders;
CREATE POLICY "Users can insert own reminders" ON public.reminders
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own reminders" ON public.reminders;
CREATE POLICY "Users can update reminders" ON public.reminders
    FOR UPDATE USING (
        auth.uid() = user_id 
        OR 
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

DROP POLICY IF EXISTS "Users can delete own reminders" ON public.reminders;
CREATE POLICY "Users can delete reminders" ON public.reminders
    FOR DELETE USING (
        auth.uid() = user_id 
        OR 
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

-- ============================================
-- CONTACTS - Allow all operations
-- ============================================
DROP POLICY IF EXISTS "Users can insert own contacts" ON public.contacts;
CREATE POLICY "Users can insert own contacts" ON public.contacts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own contacts" ON public.contacts;
CREATE POLICY "Users can update contacts" ON public.contacts
    FOR UPDATE USING (
        auth.uid() = user_id 
        OR 
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

DROP POLICY IF EXISTS "Users can delete own contacts" ON public.contacts;
CREATE POLICY "Users can delete contacts" ON public.contacts
    FOR DELETE USING (
        auth.uid() = user_id 
        OR 
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

-- ============================================
-- COMPANY NOTES - Allow all operations
-- ============================================
DROP POLICY IF EXISTS "Users can insert own company notes" ON public.company_notes;
CREATE POLICY "Users can insert own company notes" ON public.company_notes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own company notes" ON public.company_notes;
CREATE POLICY "Users can delete company notes" ON public.company_notes
    FOR DELETE USING (
        auth.uid() = user_id 
        OR 
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

-- ============================================
-- SCRATCH NOTES - Allow all operations
-- ============================================
DROP POLICY IF EXISTS "Users can insert own scratch notes" ON public.scratch_notes;
CREATE POLICY "Users can insert own scratch notes" ON public.scratch_notes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own scratch notes" ON public.scratch_notes;
CREATE POLICY "Users can update scratch notes" ON public.scratch_notes
    FOR UPDATE USING (
        auth.uid() = user_id 
        OR 
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

DROP POLICY IF EXISTS "Users can delete own scratch notes" ON public.scratch_notes;
CREATE POLICY "Users can delete scratch notes" ON public.scratch_notes
    FOR DELETE USING (
        auth.uid() = user_id 
        OR 
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

-- ============================================
-- DAILY LOG - Allow all operations
-- ============================================
DROP POLICY IF EXISTS "Users can insert own daily logs" ON public.daily_log;
CREATE POLICY "Users can insert own daily logs" ON public.daily_log
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own daily logs" ON public.daily_log;
CREATE POLICY "Users can update daily logs" ON public.daily_log
    FOR UPDATE USING (
        auth.uid() = user_id 
        OR 
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

DROP POLICY IF EXISTS "Users can delete own daily logs" ON public.daily_log;
CREATE POLICY "Users can delete daily logs" ON public.daily_log
    FOR DELETE USING (
        auth.uid() = user_id 
        OR 
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

-- ============================================
-- TARGETS - Allow all operations
-- ============================================
DROP POLICY IF EXISTS "Users can insert own targets" ON public.targets;
CREATE POLICY "Users can insert own targets" ON public.targets
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own targets" ON public.targets;
CREATE POLICY "Users can update targets" ON public.targets
    FOR UPDATE USING (
        auth.uid() = user_id 
        OR 
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

DROP POLICY IF EXISTS "Users can delete own targets" ON public.targets;
CREATE POLICY "Users can delete targets" ON public.targets
    FOR DELETE USING (
        auth.uid() = user_id 
        OR 
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

-- ============================================
-- USERS - Special policies for profile management
-- ============================================
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
-- Users can only insert their own profile (during signup)
CREATE POLICY "Users can insert own profile" ON public.users
    FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
-- Users can update their own profile, admins can update any profile
CREATE POLICY "Users can update profiles" ON public.users
    FOR UPDATE USING (
        auth.uid() = id 
        OR 
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );
