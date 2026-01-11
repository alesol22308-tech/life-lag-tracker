# Quick Guide: Add Environment Variables to Vercel

Follow these steps to fix the 500 error on your deployed site.

## Step 1: Get Your Supabase Credentials

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Select your project (or create one if you haven't)
3. Click **Settings** (gear icon) → **API**
4. Copy these two values:
   - **Project URL** (looks like `https://xxxxx.supabase.co`)
   - **anon public key** (click the eye icon to reveal, then copy)

## Step 2: Add Environment Variables to Vercel

1. Go to [https://vercel.com/dashboard](https://vercel.com/dashboard)
2. Click on your **life-lag-tracker** project
3. Click **Settings** (top menu)
4. Click **Environment Variables** (left sidebar)
5. Add these variables one by one:

### Variable 1: NEXT_PUBLIC_SUPABASE_URL
- **Key**: `NEXT_PUBLIC_SUPABASE_URL`
- **Value**: Paste your Supabase Project URL (from Step 1)
- **Environment**: Select all (Production, Preview, Development)
- Click **Save**

### Variable 2: NEXT_PUBLIC_SUPABASE_ANON_KEY
- **Key**: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Value**: Paste your Supabase anon public key (from Step 1)
- **Environment**: Select all (Production, Preview, Development)
- Click **Save**

### Variable 3: NEXT_PUBLIC_APP_URL (Optional but recommended)
- **Key**: `NEXT_PUBLIC_APP_URL`
- **Value**: Your Vercel app URL (e.g., `https://life-lag-tracker.vercel.app`)
- **Environment**: Select all
- Click **Save**

## Step 3: Redeploy

After adding the variables:
1. Go to **Deployments** tab
2. Click the **⋯** (three dots) on the latest deployment
3. Click **Redeploy**
4. Or push a new commit to trigger automatic redeploy

## That's It!

Once redeployed, your site should work. The 500 error will be gone because the middleware will have the Supabase credentials it needs.

## Optional: Additional Variables (for full functionality)

If you want email features to work, also add:
- `RESEND_API_KEY` - Get from [resend.com](https://resend.com)
- `FROM_EMAIL` - Your sender email (e.g., `Life Lag <checkin@yourdomain.com>`)
- `SUPABASE_SERVICE_ROLE_KEY` - From Supabase Settings → API → service_role key

But the two required variables above are enough to get the site working!
