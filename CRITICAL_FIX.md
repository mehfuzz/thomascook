# 🚨 CRITICAL FIX - Run These SQL Scripts Immediately

## The Problem:
1. Admin page not accessible
2. Cannot add any data (companies, sales calls, tasks)
3. Missing RPC functions

## The Solution:
Run these 3 SQL scripts in your Supabase SQL Editor **IN ORDER**:

---

## Step 1: Fix RLS Policies (CRITICAL)

**File**: `/supabase/migrations/003_fix_rls_policies.sql`

**What it does**: Adds INSERT, UPDATE, DELETE policies for all tables. The previous migrations only had SELECT policies, which is why you couldn't add data.

**Copy and run the entire file in Supabase SQL Editor.**

---

## Step 2: Add RPC Functions

**File**: `/supabase/migrations/004_rpc_functions.sql`

**What it does**: 
- Creates helper functions for admin checks
- Auto-calculates company health scores
- Provides dashboard statistics
- Creates triggers for automatic updates

**Copy and run the entire file in Supabase SQL Editor.**

---

## Step 3: Create Your First User Profile

After running the above migrations, you need to create a user profile:

### 3a. Sign Up a User (if not done already)

Go to Supabase Dashboard → Authentication → Users → Add User

Or use the Supabase Auth signup:
```
Email: gm@thomascook.in
Password: Thomas@123
```

### 3b. Get the User ID

After signup, copy the User UID from Supabase Dashboard → Authentication → Users

### 3c. Create User Profile

Run this in SQL Editor (replace YOUR_USER_ID):

```sql
INSERT INTO public.users (id, email, full_name, phone_number, designation, role, company_name)
VALUES (
  'YOUR_USER_ID',  -- Replace with actual user ID from auth.users
  'gm@thomascook.in',
  'Rajesh Kumar',
  '+919876543210',
  'General Manager - Corporate Travel Sales',
  'admin',  -- Make first user an admin
  'Thomas Cook India'
);
```

---

## Step 4: Verify Everything Works

### Test 1: Login
1. Go to http://localhost:3000/login or your deployed URL
2. Login with your credentials
3. Should redirect to dashboard ✅

### Test 2: Add a Company
1. Go to Companies page
2. Click "Add Company"
3. Fill form and submit
4. Should see success toast ✅
5. Company should appear in list ✅

### Test 3: Log a Sales Call
1. Go to Sales Calls page
2. Click "Log New Call"
3. Select company (or add new one)
4. Fill form and submit
5. Should see success toast ✅
6. Call should appear in list ✅

### Test 4: Admin Access (if you set role='admin')
1. Check sidebar - should see "Admin Dashboard" link ✅
2. Click it - should load admin page ✅
3. Should see system stats ✅
4. Should see "Add User" button ✅

---

## Common Issues & Solutions:

### Issue: "Cannot add company" or "500 error"
**Solution**: Run migration 003_fix_rls_policies.sql - this fixes INSERT policies

### Issue: "Unauthorized" or "Permission denied"
**Solution**: Make sure you created the user profile in public.users table matching your auth.users ID

### Issue: "Admin page not found"
**Solution**: Middleware updated - just refresh the page after migrations

### Issue: "Health score not calculating"
**Solution**: Run migration 004_rpc_functions.sql - this adds the calculation functions

---

## Quick Check - Are Migrations Applied?

Run this in Supabase SQL Editor to verify:

```sql
-- Check if role column exists
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'role';

-- Check if RPC functions exist
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('is_admin', 'calculate_company_health_score');

-- Check if your user profile exists
SELECT id, email, full_name, role 
FROM public.users;
```

**Expected Results:**
- First query: Should return 'role'
- Second query: Should return function names
- Third query: Should show your user with role='admin' or 'user'

---

## After Running Migrations:

✅ You can add companies
✅ You can log sales calls
✅ You can create tasks
✅ You can update settings
✅ Admin can access /admin page
✅ Admin can create new users
✅ Health scores auto-calculate
✅ Data isolation works (users see only their data, admin sees all)

---

## Files Reference:

All migration files are in `/app/supabase/migrations/`:
1. `001_initial_schema.sql` - Base tables (run first time only)
2. `002_add_admin_role.sql` - Adds admin role
3. `003_fix_rls_policies.sql` - **CRITICAL** Fixes INSERT/UPDATE/DELETE policies
4. `004_rpc_functions.sql` - Adds helper functions and triggers

---

## Need Help?

If issues persist:
1. Check Supabase Dashboard → Database → Logs
2. Check browser console (F12) for JavaScript errors
3. Verify all 4 migrations ran successfully
4. Verify user profile exists in public.users table
5. Verify auth.uid() matches public.users.id

---

**🎯 Bottom Line: Run migrations 003 and 004, create user profile, and everything will work!**
