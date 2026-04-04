-- Sales Command Center Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USERS TABLE (extends auth.users)
-- ============================================
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    phone_number TEXT,
    designation TEXT,
    company_name TEXT DEFAULT 'Thomas Cook India',
    whatsapp_enabled BOOLEAN DEFAULT true,
    sms_enabled BOOLEAN DEFAULT true,
    inapp_enabled BOOLEAN DEFAULT true,
    reminder_day_before_time TIME DEFAULT '09:00:00',
    reminder_on_day_time TIME DEFAULT '08:00:00',
    dark_mode BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- COMPANIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    company_name TEXT NOT NULL,
    industry TEXT,
    city TEXT,
    state TEXT,
    address TEXT,
    website TEXT,
    gstin TEXT,
    account_tier TEXT DEFAULT 'Cold' CHECK (account_tier IN ('Hot', 'Warm', 'Cold')),
    pipeline_stage TEXT DEFAULT 'Cold Lead' CHECK (pipeline_stage IN ('Cold Lead', 'Contacted', 'Proposal Sent', 'Negotiation', 'Won', 'Lost')),
    annual_travel_budget_estimate NUMERIC(15,2),
    employee_count TEXT,
    primary_travel_type TEXT CHECK (primary_travel_type IN ('Domestic', 'International', 'MICE', 'Visa', 'Mixed')),
    account_notes TEXT,
    health_score INTEGER DEFAULT 50 CHECK (health_score >= 0 AND health_score <= 100),
    last_contacted_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_companies_user_id ON public.companies(user_id);
CREATE INDEX idx_companies_pipeline_stage ON public.companies(pipeline_stage);
CREATE INDEX idx_companies_health_score ON public.companies(health_score);
CREATE INDEX idx_companies_tier ON public.companies(account_tier);

-- ============================================
-- CONTACTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    designation TEXT,
    email TEXT,
    phone TEXT,
    is_primary_contact BOOLEAN DEFAULT false,
    linkedin_url TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_contacts_company_id ON public.contacts(company_id);
CREATE INDEX idx_contacts_user_id ON public.contacts(user_id);

-- ============================================
-- SALES CALLS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.sales_calls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
    call_date DATE NOT NULL,
    call_time TIME,
    duration_minutes INTEGER,
    call_type TEXT CHECK (call_type IN ('Cold Call', 'Warm Follow-up', 'Scheduled Meeting', 'Virtual Call', 'Walk-in Visit', 'Conference', 'Referral Call')),
    call_outcome TEXT CHECK (call_outcome IN ('Very Interested', 'Interested', 'Neutral', 'Not Interested', 'Callback Requested', 'Proposal Requested', 'Proposal Sent', 'Negotiating', 'Closed Won', 'Closed Lost', 'No Answer', 'Gatekeeper', 'Left Voicemail')),
    discussion_summary TEXT,
    next_steps TEXT,
    competitor_mentioned TEXT,
    proposal_value_discussed NUMERIC(15,2),
    revisit_date_given DATE,
    revisit_time_given TIME,
    revisit_notes TEXT,
    reminders_created BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sales_calls_user_id ON public.sales_calls(user_id);
CREATE INDEX idx_sales_calls_company_id ON public.sales_calls(company_id);
CREATE INDEX idx_sales_calls_call_date ON public.sales_calls(call_date);
CREATE INDEX idx_sales_calls_outcome ON public.sales_calls(call_outcome);

-- ============================================
-- APPOINTMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
    appointment_date DATE NOT NULL,
    appointment_time TIME,
    duration_estimated_minutes INTEGER DEFAULT 60,
    location TEXT,
    meeting_mode TEXT CHECK (meeting_mode IN ('In-Person', 'Virtual', 'Phone')),
    purpose TEXT,
    agenda TEXT,
    status TEXT DEFAULT 'Scheduled' CHECK (status IN ('Scheduled', 'Completed', 'Rescheduled', 'Cancelled')),
    actual_outcome TEXT,
    revisit_date DATE,
    revisit_time TIME,
    revisit_notes TEXT,
    reminder_day_before_sent BOOLEAN DEFAULT false,
    reminder_on_day_sent BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_appointments_user_id ON public.appointments(user_id);
CREATE INDEX idx_appointments_company_id ON public.appointments(company_id);
CREATE INDEX idx_appointments_date ON public.appointments(appointment_date);
CREATE INDEX idx_appointments_status ON public.appointments(status);

-- ============================================
-- TARGETS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.targets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    target_period TEXT NOT NULL CHECK (target_period IN ('Daily', 'Weekly', 'Monthly')),
    period_start_date DATE NOT NULL,
    period_end_date DATE NOT NULL,
    calls_target INTEGER DEFAULT 0,
    meetings_target INTEGER DEFAULT 0,
    revenue_target NUMERIC(15,2) DEFAULT 0,
    proposals_target INTEGER DEFAULT 0,
    new_companies_target INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_targets_user_id ON public.targets(user_id);
CREATE INDEX idx_targets_period ON public.targets(target_period, period_start_date);

-- ============================================
-- DAILY LOG TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.daily_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    log_date DATE NOT NULL,
    calls_done INTEGER DEFAULT 0,
    meetings_done INTEGER DEFAULT 0,
    revenue_closed NUMERIC(15,2) DEFAULT 0,
    proposals_sent INTEGER DEFAULT 0,
    new_companies_added INTEGER DEFAULT 0,
    notes TEXT,
    mood_score INTEGER CHECK (mood_score >= 1 AND mood_score <= 5),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, log_date)
);

CREATE INDEX idx_daily_log_user_id ON public.daily_log(user_id);
CREATE INDEX idx_daily_log_date ON public.daily_log(log_date);

-- ============================================
-- TASKS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    due_date DATE,
    due_time TIME,
    priority TEXT DEFAULT 'Medium' CHECK (priority IN ('High', 'Medium', 'Low')),
    status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'In Progress', 'Done', 'Cancelled')),
    category TEXT CHECK (category IN ('Follow-up', 'Proposal', 'Admin', 'Internal', 'Research', 'Client Servicing')),
    reminder_set BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tasks_user_id ON public.tasks(user_id);
CREATE INDEX idx_tasks_company_id ON public.tasks(company_id);
CREATE INDEX idx_tasks_status ON public.tasks(status);
CREATE INDEX idx_tasks_due_date ON public.tasks(due_date);

-- ============================================
-- PROPOSALS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.proposals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
    proposal_title TEXT NOT NULL,
    travel_type TEXT CHECK (travel_type IN ('Domestic', 'International', 'MICE', 'Visa', 'Multi-destination', 'Group Travel')),
    proposal_value NUMERIC(15,2) NOT NULL,
    status TEXT DEFAULT 'Draft' CHECK (status IN ('Draft', 'Sent', 'Under Review', 'Revision Requested', 'Won', 'Lost')),
    sent_date DATE,
    decision_expected_date DATE,
    actual_decision_date DATE,
    lost_reason TEXT,
    competitor_won TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_proposals_user_id ON public.proposals(user_id);
CREATE INDEX idx_proposals_company_id ON public.proposals(company_id);
CREATE INDEX idx_proposals_status ON public.proposals(status);

-- ============================================
-- REMINDERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.reminders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    linked_type TEXT NOT NULL CHECK (linked_type IN ('appointment', 'revisit', 'task', 'general')),
    linked_id UUID,
    company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
    company_name TEXT,
    reminder_datetime TIMESTAMPTZ NOT NULL,
    message_text TEXT NOT NULL,
    delivery_channel TEXT DEFAULT 'all' CHECK (delivery_channel IN ('in-app', 'whatsapp', 'sms', 'all')),
    is_sent BOOLEAN DEFAULT false,
    sent_at TIMESTAMPTZ,
    is_read BOOLEAN DEFAULT false,
    snoozed_until TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_reminders_user_id ON public.reminders(user_id);
CREATE INDEX idx_reminders_datetime ON public.reminders(reminder_datetime);
CREATE INDEX idx_reminders_is_sent ON public.reminders(is_sent);
CREATE INDEX idx_reminders_is_read ON public.reminders(is_read);

-- Enable Realtime for reminders table
ALTER PUBLICATION supabase_realtime ADD TABLE public.reminders;

-- ============================================
-- COMPANY NOTES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.company_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    note_text TEXT NOT NULL,
    note_type TEXT CHECK (note_type IN ('General', 'Meeting Note', 'Research', 'Concern', 'Opportunity')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_company_notes_company_id ON public.company_notes(company_id);
CREATE INDEX idx_company_notes_user_id ON public.company_notes(user_id);

-- ============================================
-- SCRATCH NOTES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.scratch_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    linked_company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
    is_archived BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_scratch_notes_user_id ON public.scratch_notes(user_id);
CREATE INDEX idx_scratch_notes_archived ON public.scratch_notes(is_archived);

-- ============================================
-- AUTOMATIC TIMESTAMP UPDATES
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON public.companies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON public.contacts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sales_calls_updated_at BEFORE UPDATE ON public.sales_calls
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON public.appointments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_targets_updated_at BEFORE UPDATE ON public.targets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_daily_log_updated_at BEFORE UPDATE ON public.daily_log
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON public.tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_proposals_updated_at BEFORE UPDATE ON public.proposals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_scratch_notes_updated_at BEFORE UPDATE ON public.scratch_notes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scratch_notes ENABLE ROW LEVEL SECURITY;

-- Users table policies
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Companies table policies
CREATE POLICY "Users can view own companies" ON public.companies
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own companies" ON public.companies
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own companies" ON public.companies
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own companies" ON public.companies
    FOR DELETE USING (auth.uid() = user_id);

-- Contacts table policies
CREATE POLICY "Users can view own contacts" ON public.contacts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own contacts" ON public.contacts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own contacts" ON public.contacts
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own contacts" ON public.contacts
    FOR DELETE USING (auth.uid() = user_id);

-- Sales calls table policies
CREATE POLICY "Users can view own sales calls" ON public.sales_calls
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sales calls" ON public.sales_calls
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sales calls" ON public.sales_calls
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own sales calls" ON public.sales_calls
    FOR DELETE USING (auth.uid() = user_id);

-- Appointments table policies
CREATE POLICY "Users can view own appointments" ON public.appointments
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own appointments" ON public.appointments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own appointments" ON public.appointments
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own appointments" ON public.appointments
    FOR DELETE USING (auth.uid() = user_id);

-- Targets table policies
CREATE POLICY "Users can view own targets" ON public.targets
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own targets" ON public.targets
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own targets" ON public.targets
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own targets" ON public.targets
    FOR DELETE USING (auth.uid() = user_id);

-- Daily log table policies
CREATE POLICY "Users can view own daily logs" ON public.daily_log
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own daily logs" ON public.daily_log
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own daily logs" ON public.daily_log
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own daily logs" ON public.daily_log
    FOR DELETE USING (auth.uid() = user_id);

-- Tasks table policies
CREATE POLICY "Users can view own tasks" ON public.tasks
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tasks" ON public.tasks
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tasks" ON public.tasks
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own tasks" ON public.tasks
    FOR DELETE USING (auth.uid() = user_id);

-- Proposals table policies
CREATE POLICY "Users can view own proposals" ON public.proposals
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own proposals" ON public.proposals
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own proposals" ON public.proposals
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own proposals" ON public.proposals
    FOR DELETE USING (auth.uid() = user_id);

-- Reminders table policies
CREATE POLICY "Users can view own reminders" ON public.reminders
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own reminders" ON public.reminders
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reminders" ON public.reminders
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own reminders" ON public.reminders
    FOR DELETE USING (auth.uid() = user_id);

-- Company notes table policies
CREATE POLICY "Users can view own company notes" ON public.company_notes
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own company notes" ON public.company_notes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own company notes" ON public.company_notes
    FOR DELETE USING (auth.uid() = user_id);

-- Scratch notes table policies
CREATE POLICY "Users can view own scratch notes" ON public.scratch_notes
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own scratch notes" ON public.scratch_notes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own scratch notes" ON public.scratch_notes
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own scratch notes" ON public.scratch_notes
    FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- SEED DATA FOR TESTING
-- ============================================
-- Note: After running this migration, you'll need to:
-- 1. Sign up a user via Supabase Auth UI or API
-- 2. Get the user's UUID from auth.users table
-- 3. Insert a row into public.users with that UUID
-- 4. Then you can add sample companies, contacts, etc.

-- Example seed data (replace USER_UUID with actual UUID after signup):
-- INSERT INTO public.users (id, email, full_name, phone_number, designation)
-- VALUES ('USER_UUID', 'gm@thomascook.in', 'Rajesh Kumar', '+919876543210', 'General Manager - Corporate Travel Sales');

-- INSERT INTO public.companies (user_id, company_name, industry, city, account_tier, pipeline_stage, health_score)
-- VALUES 
-- ('USER_UUID', 'Infosys Limited', 'IT Services', 'Bangalore', 'Hot', 'Negotiation', 85),
-- ('USER_UUID', 'Tata Consultancy Services', 'IT Services', 'Mumbai', 'Hot', 'Proposal Sent', 75),
-- ('USER_UUID', 'Wipro Limited', 'IT Services', 'Bangalore', 'Warm', 'Contacted', 60);
