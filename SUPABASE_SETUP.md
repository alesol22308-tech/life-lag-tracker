# Supabase Setup Guide for Life-Lag

## Step 1: Create a Supabase Account and Project

1. Go to [https://supabase.com](https://supabase.com)
2. Click **"Start your project"** or **"Sign in"** if you already have an account
3. Sign in with GitHub (recommended) or email
4. Click **"New Project"**
5. Fill in the project details:
   - **Name**: `life-lag` (or your preferred name)
   - **Database Password**: Create a strong password (save this securely)
   - **Region**: Choose the region closest to your users
   - **Pricing Plan**: Free tier is fine for MVP
6. Click **"Create new project"**
7. Wait 2-3 minutes for the project to be provisioned

## Step 2: Get Your Connection Credentials

1. Once your project is ready, go to **Settings** (gear icon in the left sidebar)
2. Click **API** under Project Settings
3. You'll see several important values:

### Copy these values:

- **Project URL**: Found under "Project URL" section
  - Looks like: `https://xxxxxxxxxxxxx.supabase.co`
  
- **anon/public key**: Found under "Project API keys" → "anon" "public"
  - This is the `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - Click the "eye" icon to reveal it, then click copy

- **service_role key**: Found under "Project API keys" → "service_role" "secret"
  - This is the `SUPABASE_SERVICE_ROLE_KEY`
  - ⚠️ **Keep this secret!** Never expose it in client-side code
  - Click the "eye" icon to reveal it, then click copy

## Step 3: Set Up Environment Variables

1. In your project root directory, create a file named `.env.local`
2. Add the following variables with your actual values:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
RESEND_API_KEY=your_resend_api_key_here
FROM_EMAIL=Life-Lag <checkin@yourdomain.com>
NEXT_PUBLIC_APP_URL=http://localhost:3000
CRON_SECRET=your_random_secret_here
```

**Replace:**
- `https://xxxxxxxxxxxxx.supabase.co` with your Project URL
- `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` with your actual keys
- Fill in the other values (Resend API key, email, etc.)

## Step 4: Run the Database Migration

1. In your Supabase dashboard, go to **SQL Editor** (left sidebar)
2. Click **"New query"**
3. Open the file `supabase/migrations/001_initial_schema.sql` from your project
4. Copy the entire contents of that file
5. Paste it into the Supabase SQL Editor
6. Click **"Run"** (or press `Ctrl+Enter` / `Cmd+Enter`)
7. You should see "Success. No rows returned"

### Verify Tables Were Created

1. Go to **Table Editor** (left sidebar)
2. You should see three tables:
   - `users`
   - `checkins`
   - `streaks`

## Step 5: Configure Authentication

1. Go to **Authentication** → **URL Configuration** (in left sidebar)
2. Under **Site URL**, enter: `http://localhost:3000` (for development)
3. Under **Redirect URLs**, click **"Add URL"** and add this EXACT URL (one per line, no wildcards):
   ```
   http://localhost:3000/auth/callback
   ```
   
   **Important Notes:**
   - Use the EXACT URL format shown above (no trailing slash, no wildcards)
   - Supabase does NOT accept wildcards like `/**` or `*`
   - When deploying to production, add your production URL: `https://yourdomain.com/auth/callback`
   - Each URL must be on its own line or added separately

4. Go to **Authentication** → **Providers**
5. Make sure **Email** provider is enabled (it's enabled by default)
6. Optionally configure:
   - **Confirm email**: Toggle off for development (recommended)
   - **Enable email confirmations**: Toggle off for faster testing

## Step 6: Test the Connection

1. Make sure your `.env.local` file is properly configured
2. Start your development server:
   ```bash
   npm run dev
   ```
3. Open [http://localhost:3000](http://localhost:3000)
4. Try signing up with an email address
5. Check your email for the magic link (or check Supabase logs if email confirmations are disabled)

## Troubleshooting

### "Invalid API key" error
- Double-check that you copied the keys correctly
- Make sure there are no extra spaces or line breaks
- Verify you're using the correct key (`anon` vs `service_role`)

### "Relation does not exist" error
- Make sure you ran the migration SQL successfully
- Check the Table Editor to verify tables exist
- Try running the migration again

### Authentication not working
- Verify the redirect URLs are configured correctly
- Check that the Email provider is enabled
- Look at the browser console for errors
- Check Supabase logs: **Logs** → **Auth Logs** (left sidebar)

### Can't see tables
- Make sure you're in the correct project
- Refresh the Table Editor
- Verify the migration ran successfully (check SQL Editor history)

## Production Setup

When deploying to production (e.g., Vercel):

1. Add the same environment variables to your hosting platform
2. Update `NEXT_PUBLIC_APP_URL` to your production URL
3. Update Supabase **Redirect URLs** to include your production callback URL
4. Consider enabling email confirmations in production for security

## Useful Supabase Dashboard Links

- **Table Editor**: View and edit data
- **SQL Editor**: Run queries and migrations
- **Authentication**: Manage users and auth settings
- **API Docs**: Auto-generated API documentation
- **Logs**: View real-time logs and errors
- **Database**: View database structure and run queries

## Next Steps

After connecting to Supabase:
1. Set up Resend for email (see README.md)
2. Test the full user flow: signup → check-in → results → email
3. Deploy to Vercel when ready
