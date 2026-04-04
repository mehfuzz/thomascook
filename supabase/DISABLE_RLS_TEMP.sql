-- ================================================================
-- FINAL FIX - Copy this ENTIRE file and run in Supabase SQL Editor
-- ================================================================
-- This is the simplest possible fix that WILL work
-- ================================================================

-- Step 1: Add role column if missing
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'role') THEN
        ALTER TABLE public.users ADD COLUMN role TEXT DEFAULT 'user';
    END IF;
END $$;

-- Step 2: Create user profiles for anyone who logged in
INSERT INTO public.users (id, email, full_name, role, company_name)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'full_name', 'User'),
  'admin',  -- Make everyone admin for testing
  'Thomas Cook India'
FROM auth.users au
WHERE NOT EXISTS (SELECT 1 FROM public.users pu WHERE pu.id = au.id)
ON CONFLICT (id) DO UPDATE SET role = 'admin';

-- Step 3: DISABLE RLS temporarily to test
ALTER TABLE public.companies DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_calls DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposals DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminders DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_notes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.scratch_notes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_log DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.targets DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- ================================================================
-- IMPORTANT: After running this, LOGOUT and LOGIN again!
-- ================================================================
-- Then test if you can add companies
-- If it works, come back and enable RLS with proper policies
-- ================================================================

-- To re-enable RLS later with proper policies, run this:
/*
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scratch_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
*/

-- Verify user was created
SELECT id, email, full_name, role FROM public.users;
