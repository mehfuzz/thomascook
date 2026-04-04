# 🔧 How to Fix the Company Loading Issue

## Problem
Your app is showing "Failed to load companies" error because of an **infinite recursion in Supabase RLS policies**.

## Solution
I've created a corrected SQL file that fixes this issue permanently.

---

## 📋 Step-by-Step Instructions

### Step 1: Open Supabase Dashboard
1. Go to https://supabase.com
2. Log in to your account
3. Select your **Thomas Cook Sales Command Center** project

### Step 2: Open SQL Editor
1. Click on **"SQL Editor"** in the left sidebar
2. Click on **"New Query"** button

### Step 3: Copy and Run the Fix
1. Open the file `/app/supabase/FINAL_RLS_FIX.sql` from your project
2. **Copy the ENTIRE contents** of that file
3. **Paste** it into the Supabase SQL Editor
4. Click the **"Run"** button (or press Ctrl+Enter / Cmd+Enter)

### Step 4: Verify Success
You should see output showing:
- ✅ Your user profile with `role = 'admin'`
- ✅ List of tables with their policy counts
- ✅ The `is_admin` function created successfully

### Step 5: Test Your App
1. Go back to your app
2. **Logout** (if logged in)
3. **Login** again
4. Navigate to the **Companies** page
5. Companies should now load successfully! 🎉

---

## 🔍 What This Fix Does

1. **Removes all old broken policies** that were causing infinite recursion
2. **Creates a helper function** `is_admin()` that checks user role safely
3. **Creates new policies** that use this helper function to avoid recursion
4. **Sets your current user as admin** so you can test all features
5. **Enables both user and admin access** with proper data segregation

---

## ✅ Expected Result

After running this SQL:
- ✅ Companies page will load data
- ✅ Sales calls page will work
- ✅ Tasks page will work
- ✅ Admin dashboard will show all user data
- ✅ No more "infinite recursion" errors
- ✅ No more 401/500 API errors

---

## 🆘 If You Get Any Errors

If you see any errors when running the SQL, please share:
1. The exact error message
2. A screenshot of the error

I'll help you resolve it immediately!

---

## 📍 File Location
The SQL fix is located at: `/app/supabase/FINAL_RLS_FIX.sql`
