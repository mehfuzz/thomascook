# 🚨 URGENT FIX - Cannot Add/Load Companies

## The Problem

You're getting these errors:
- ❌ "Failed to load companies"
- ❌ "Failed to add company"
- API returns 401 Unauthorized

## Root Cause

**You need to run the RLS policy fix in Supabase!**

The database has tables but no proper INSERT/UPDATE/DELETE policies, so all operations are blocked.

---

## ✅ SOLUTION - Follow These Steps EXACTLY:

### Step 1: Open Supabase SQL Editor

1. Go to https://supabase.com/dashboard
2. Select your project
3. Click **SQL Editor** in left sidebar
4. Click **New Query**

### Step 2: Run EMERGENCY_FIX.sql

1. Open the file: `/app/supabase/EMERGENCY_FIX.sql`
2. Copy **THE ENTIRE FILE**
3. Paste into Supabase SQL Editor
4. Click **"Run"** button (or Cmd/Ctrl + Enter)
5. Wait for: **"Success. No rows returned"**

### Step 3: Verify User Profile Created

Run this query separately:

```sql
SELECT id, email, full_name, role FROM public.users;
```

**Expected Result**: You should see your user(s) listed

**If empty**: The EMERGENCY_FIX should have auto-created profiles. If still empty, run:

```sql
SELECT id, email FROM auth.users;
```

Copy your user ID, then run:

```sql
INSERT INTO public.users (id, email, full_name, role, company_name)
VALUES (
  'PASTE_YOUR_USER_ID_HERE',
  'your-email@domain.com',
  'Your Name',
  'admin',
  'Thomas Cook India'
);
```

### Step 4: Verify Policies Created

Run this query:

```sql
SELECT tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'companies';
```

**Expected Result**: You should see 4 policies:
- companies_select_policy
- companies_insert_policy
- companies_update_policy
- companies_delete_policy

### Step 5: Logout and Login Again

**IMPORTANT**: You MUST logout and login again for the new policies to take effect!

1. Go to your app
2. Click **Logout**
3. Login again with your credentials
4. Try adding a company

---

## 🧪 Test If It's Working

### Test 1: Can you see the companies page?
- Go to Companies page
- Should load without errors
- Empty list is OK

### Test 2: Can you add a company?
1. Click "Add Company"
2. Fill in company name
3. Click submit
4. Should see: ✅ "Company added successfully!"
5. Company appears in list

### Test 3: Check browser console
1. Press F12 (open developer tools)
2. Go to Console tab
3. Try adding a company
4. Should NOT see 401 or 403 errors

---

## 🔍 Troubleshooting

### Still Getting "Unauthorized" Error?

**Check 1: User profile exists**
```sql
-- Should return your user
SELECT * FROM public.users WHERE id = auth.uid();
```

**Check 2: Auth is working**
```sql
-- Should return your user ID
SELECT auth.uid();
```

If NULL, you're not logged in. Logout and login again.

**Check 3: Policies are applied**
```sql
-- Should return multiple policies
SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public';
```

Should be 40+ policies.

### Still Getting "Failed to add company"?

**Option A: Check the actual error**
1. Open browser console (F12)
2. Try adding company
3. Look at the error message
4. Share the exact error

**Option B: Temporarily disable RLS (emergency only)**

```sql
-- WARNING: Only for testing!
ALTER TABLE public.companies DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_calls DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks DISABLE ROW LEVEL SECURITY;
```

Try adding company. If it works, the issue is RLS policies.

**Then re-enable RLS:**
```sql
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
```

And run EMERGENCY_FIX.sql again.

---

## 📝 What EMERGENCY_FIX.sql Does

1. ✅ Auto-creates user profiles for auth users
2. ✅ Makes first user an admin
3. ✅ Drops all old conflicting policies
4. ✅ Creates fresh policies with correct permissions
5. ✅ Enables SELECT, INSERT, UPDATE, DELETE for users
6. ✅ Allows admin to see/edit all data

---

## ⚡ Quick Test After Fix

```sql
-- This should work after fix:
INSERT INTO public.companies (user_id, company_name, account_tier) 
VALUES (auth.uid(), 'Test Company ABC', 'Cold');

-- Check if it was inserted:
SELECT * FROM public.companies WHERE user_id = auth.uid();
```

If this works in SQL, it will work in the app!

---

## 🆘 If Nothing Works

1. **Check Supabase logs**:
   - Supabase Dashboard → Logs → API
   - Look for error messages

2. **Verify your environment**:
   - Check `.env` file has correct Supabase URL and keys
   - Restart app after any .env changes

3. **Nuclear option** (last resort):
   - Disable RLS temporarily
   - Test if app works
   - Re-enable RLS
   - Run EMERGENCY_FIX.sql

---

## ✅ After Fix Checklist

- [ ] Ran EMERGENCY_FIX.sql in Supabase
- [ ] Verified user profile exists
- [ ] Verified policies created
- [ ] Logged out and logged in again
- [ ] Can view companies page
- [ ] Can add a company
- [ ] Company appears in list
- [ ] Can log a sales call
- [ ] Can create a task

---

**Bottom Line**: Run EMERGENCY_FIX.sql, logout, login, and everything will work! 🎉
