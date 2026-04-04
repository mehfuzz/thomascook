-- Add admin role to users table and update RLS policies for admin access

-- Add role column to users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'user'));

-- Update RLS policies to allow admin to see all data

-- Drop existing policies and recreate with admin access

-- COMPANIES: Admin can see all, users see only their own
DROP POLICY IF EXISTS "Users can view own companies" ON public.companies;
CREATE POLICY "Users can view companies" ON public.companies
    FOR SELECT USING (
        auth.uid() = user_id 
        OR 
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

-- SALES CALLS: Admin can see all
DROP POLICY IF EXISTS "Users can view own sales calls" ON public.sales_calls;
CREATE POLICY "Users can view sales calls" ON public.sales_calls
    FOR SELECT USING (
        auth.uid() = user_id 
        OR 
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

-- APPOINTMENTS: Admin can see all
DROP POLICY IF EXISTS "Users can view own appointments" ON public.appointments;
CREATE POLICY "Users can view appointments" ON public.appointments
    FOR SELECT USING (
        auth.uid() = user_id 
        OR 
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

-- TASKS: Admin can see all
DROP POLICY IF EXISTS "Users can view own tasks" ON public.tasks;
CREATE POLICY "Users can view tasks" ON public.tasks
    FOR SELECT USING (
        auth.uid() = user_id 
        OR 
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

-- PROPOSALS: Admin can see all
DROP POLICY IF EXISTS "Users can view own proposals" ON public.proposals;
CREATE POLICY "Users can view proposals" ON public.proposals
    FOR SELECT USING (
        auth.uid() = user_id 
        OR 
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

-- REMINDERS: Admin can see all
DROP POLICY IF EXISTS "Users can view own reminders" ON public.reminders;
CREATE POLICY "Users can view reminders" ON public.reminders
    FOR SELECT USING (
        auth.uid() = user_id 
        OR 
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

-- DAILY LOG: Admin can see all
DROP POLICY IF EXISTS "Users can view own daily logs" ON public.daily_log;
CREATE POLICY "Users can view daily logs" ON public.daily_log
    FOR SELECT USING (
        auth.uid() = user_id 
        OR 
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

-- CONTACTS: Admin can see all
DROP POLICY IF EXISTS "Users can view own contacts" ON public.contacts;
CREATE POLICY "Users can view contacts" ON public.contacts
    FOR SELECT USING (
        auth.uid() = user_id 
        OR 
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

-- COMPANY NOTES: Admin can see all
DROP POLICY IF EXISTS "Users can view own company notes" ON public.company_notes;
CREATE POLICY "Users can view company notes" ON public.company_notes
    FOR SELECT USING (
        auth.uid() = user_id 
        OR 
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

-- SCRATCH NOTES: Admin can see all
DROP POLICY IF EXISTS "Users can view own scratch notes" ON public.scratch_notes;
CREATE POLICY "Users can view scratch notes" ON public.scratch_notes
    FOR SELECT USING (
        auth.uid() = user_id 
        OR 
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

-- USERS: Admin can view all users
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
CREATE POLICY "Users can view profiles" ON public.users
    FOR SELECT USING (
        auth.uid() = id 
        OR 
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

-- Admin can insert new users
CREATE POLICY "Admins can insert users" ON public.users
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

-- Admin can update any user
CREATE POLICY "Admins can update users" ON public.users
    FOR UPDATE USING (
        auth.uid() = id 
        OR 
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

-- Note: Run this migration after the initial schema
-- This adds admin functionality to the existing system
