# Fix: "Failed to create user profile" Error

## The Problem

When submitting the check-in questions, you get an error: "Failed to create user profile". This happens because the database migration is missing an INSERT policy for the users table.

## The Solution

You need to add an INSERT policy to your Supabase database. You have two options:

### Option 1: Run the SQL Fix (Quick)

1. Go to your Supabase dashboard: [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Select your project
3. Click **SQL Editor** (left sidebar)
4. Click **"New query"**
5. Copy and paste this SQL:

```sql
CREATE POLICY "Users can insert own profile"
  ON users FOR INSERT
  WITH CHECK (auth.uid() = id);
```

6. Click **"Run"** (or press `Ctrl+Enter` / `Cmd+Enter`)
7. You should see "Success. No rows returned"

### Option 2: Re-run the Migration (Recommended)

The migration file has been updated to include the INSERT policy. To apply it:

1. Go to Supabase Dashboard → SQL Editor
2. Click **"New query"**
3. Open the file `supabase/migrations/001_initial_schema.sql` from your project
4. Copy the ENTIRE contents (it now includes the INSERT policy)
5. Paste into SQL Editor
6. Click **"Run"**

Note: Since tables already exist, the `CREATE TABLE IF NOT EXISTS` statements won't recreate them, but the policy will be added.

## Verify the Fix

1. Go to Supabase Dashboard → **Table Editor**
2. Click on the **users** table
3. Go to the **"Policies"** tab (usually at the top or in a sidebar)
4. You should now see THREE policies:
   - ✅ "Users can view own profile" (SELECT)
   - ✅ "Users can insert own profile" (INSERT) ← This is the new one
   - ✅ "Users can update own profile" (UPDATE)

## Test

After adding the policy:

1. Go back to your Vercel site
2. Try submitting the check-in questions again
3. The error should be gone!

## What This Policy Does

The INSERT policy allows users to create their own profile in the `users` table, but only if:
- They're authenticated (`auth.uid()` returns their user ID)
- The `id` field in the insert matches their authenticated user ID

This is secure because users can only create profiles for themselves, not for other users.
