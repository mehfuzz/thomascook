# SETUP GUIDE - Thomas Cook Sales Command Center

## Step 1: Set Up Supabase Database

### 1.1 Create Supabase Project (Already Done ✅)
Your Supabase project is already configured:
- URL: https://zxvthqvdltoebbpnwjyb.supabase.co
- Credentials are in `.env` file

### 1.2 Run Database Migration

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Click on **SQL Editor** in the left sidebar
4. Click **"New query"** button
5. Copy the ENTIRE content of `/supabase/migrations/001_initial_schema.sql`
6. Paste it into the SQL Editor
7. Click **"Run"** button (or press Cmd/Ctrl + Enter)
8. Wait for success message: "Success. No rows returned"

This creates:
- ✅ 12 tables (users, companies, contacts, sales_calls, appointments, targets, daily_log, tasks, proposals, reminders, company_notes, scratch_notes)
- ✅ All indexes for performance
- ✅ Row Level Security policies on every table
- ✅ Automatic timestamp triggers
- ✅ Realtime enabled for reminders table

## Step 2: Create Your First User

### 2.1 Sign Up via Authentication

1. In Supabase Dashboard, go to **Authentication** > **Users**
2. Click **"Add user"** > **"Create new user"**
3. Enter:
   - Email: `gm@thomascook.in` (or your preferred email)
   - Password: `Thomas@123` (or your preferred password)
   - Check "Auto Confirm User" ✅
4. Click **"Create user"**
5. Copy the **User UID** (looks like: `a1b2c3d4-5678-90ab-cdef-1234567890ab`)

### 2.2 Create User Profile

Now you need to add a row to the `users` table:

1. Go to **SQL Editor** in Supabase
2. Run this query (replace `YOUR_USER_UID` with the UID you copied):

```sql
INSERT INTO public.users (id, email, full_name, phone_number, designation, company_name)
VALUES (
  'YOUR_USER_UID',
  'gm@thomascook.in',
  'Rajesh Kumar',
  '+919876543210',
  'General Manager - Corporate Travel Sales',
  'Thomas Cook India'
);
```

3. Click **"Run"**

## Step 3: Add Sample Data (Optional but Recommended)

Add some test companies to see the app in action:

```sql
-- Replace YOUR_USER_UID with your actual user ID
INSERT INTO public.companies (user_id, company_name, industry, city, state, account_tier, pipeline_stage, health_score, primary_travel_type, employee_count)
VALUES 
(
  'YOUR_USER_UID',
  'Infosys Limited',
  'IT Services',
  'Bangalore',
  'Karnataka',
  'Hot',
  'Negotiation',
  85,
  'Mixed',
  '200,000+'
),
(
  'YOUR_USER_UID',
  'Tata Consultancy Services',
  'IT Services',
  'Mumbai',
  'Maharashtra',
  'Hot',
  'Proposal Sent',
  75,
  'International',
  '500,000+'
),
(
  'YOUR_USER_UID',
  'Wipro Limited',
  'IT Services',
  'Bangalore',
  'Karnataka',
  'Warm',
  'Contacted',
  60,
  'Domestic',
  '200,000+'
),
(
  'YOUR_USER_UID',
  'Reliance Industries',
  'Conglomerate',
  'Mumbai',
  'Maharashtra',
  'Hot',
  'Negotiation',
  90,
  'MICE',
  '50,000+'
),
(
  'YOUR_USER_UID',
  'HDFC Bank',
  'Banking',
  'Mumbai',
  'Maharashtra',
  'Warm',
  'Proposal Sent',
  70,
  'Mixed',
  '100,000+'
);
```

## Step 4: Test the Application

### 4.1 Access the App

The app is running at: **https://sales-command-center-9.preview.emergentagent.com**

Or locally at: **http://localhost:3000**

### 4.2 Login

1. You'll be redirected to the login page
2. Enter:
   - Email: `gm@thomascook.in`
   - Password: `Thomas@123` (or whatever you set)
3. Click **"Sign In"**

### 4.3 Explore

✅ **Dashboard**: See your overview with stats and quick actions
✅ **Companies**: View, add, search, and filter companies
✅ **Navigation**: Use the sidebar to explore different sections

## Step 5: Verify Everything Works

### Test Checklist:

- [ ] Can log in successfully
- [ ] Dashboard loads with your name
- [ ] Can see sample companies (if added)
- [ ] Can add a new company
- [ ] Can search/filter companies
- [ ] Company health scores display correctly
- [ ] Navigation sidebar works
- [ ] Can log out and log back in

## Current Features Live:

✅ **Authentication** - Login with email/password, session management
✅ **Dashboard** - Stats, targets, quick actions, morning brief
✅ **Companies CRM** - Full CRUD, search, filters, duplicate detection
✅ **Navigation** - Sidebar, top navbar, Thomas Cook branding
✅ **Security** - Row Level Security, protected routes, middleware

## Features In Development:

🚧 Sales Calls logging with revisit dates
🚧 Appointments with calendar view
🚧 Targets & Performance tracking
🚧 Task management
🚧 Proposals tracker
🚧 Real-time notifications
🚧 MIS Reports (Excel & PDF export)
🚧 Settings page

## Troubleshooting

### "Unauthorized" Error
- Make sure you created the user profile in the `users` table (Step 2.2)
- Verify the user ID matches between `auth.users` and `public.users`

### No Companies Showing
- Check if you're logged in with the correct user
- Verify RLS policies are applied (they should be from the migration)
- Try adding a company through the UI

### Login Not Working
- Check Supabase dashboard > Authentication to verify user exists
- Make sure "Auto Confirm User" was checked when creating the user
- Clear browser cache and cookies

### Migration Errors
- Make sure to run the ENTIRE migration file at once
- If you get "already exists" errors, drop the tables and run again:
  ```sql
  DROP TABLE IF EXISTS public.scratch_notes CASCADE;
  DROP TABLE IF EXISTS public.company_notes CASCADE;
  DROP TABLE IF EXISTS public.reminders CASCADE;
  DROP TABLE IF EXISTS public.proposals CASCADE;
  DROP TABLE IF EXISTS public.tasks CASCADE;
  DROP TABLE IF EXISTS public.daily_log CASCADE;
  DROP TABLE IF EXISTS public.targets CASCADE;
  DROP TABLE IF EXISTS public.appointments CASCADE;
  DROP TABLE IF EXISTS public.sales_calls CASCADE;
  DROP TABLE IF EXISTS public.contacts CASCADE;
  DROP TABLE IF EXISTS public.companies CASCADE;
  DROP TABLE IF EXISTS public.users CASCADE;
  ```
  Then run the migration again.

## Need Help?

1. Check Supabase Dashboard > Logs for any errors
2. Check browser console (F12) for JavaScript errors
3. Verify all environment variables in `.env` are correct
4. Make sure the migration completed successfully

---

**Next Steps**: Once you confirm everything works, we'll continue building:
- Sales Calls page with call timer
- Appointments with calendar
- Complete dashboard widgets
- Real-time notifications
- And all remaining features!
