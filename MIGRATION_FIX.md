# How to Fix the Migration Error

## The Problem

The error "policy 'Users can view own profile' for table 'users' already exists" means you're trying to run the FIRST migration again, but you only need to run the SECOND migration.

## The Solution

1. **In Supabase SQL Editor, start a FRESH query:**
   - Click "New query" button (or clear the editor completely)
   - Make sure the editor is empty

2. **Copy ONLY the contents of `002_retention_features.sql`**
   - Open the file `supabase/migrations/002_retention_features.sql`
   - Copy ALL of its contents (lines 1-50)
   - Paste into the SQL editor

3. **Make sure you're NOT including:**
   - Any content from `001_initial_schema.sql`
   - The first migration should have already been run
   - You only need the second migration

4. **Run the query**

## What Should Be in the Editor

The migration should START with:
```sql
-- Migration: Retention & Engagement Features
-- Adds fields for continuity, soft streaks, milestones, and preferences

-- Add columns to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS preferred_checkin_day TEXT,
...
```

It should NOT start with:
```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
...
```
(That's from the first migration - don't include it!)

## Verify It Worked

After running, you should see:
- "Success. No rows returned" (or similar success message)
- No errors about existing policies
