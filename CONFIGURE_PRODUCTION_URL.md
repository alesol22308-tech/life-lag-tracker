# Configure Production URL for Magic Links

## Step 1: Find Your Production URL

### Option A: Check Vercel Dashboard
1. Go to https://vercel.com/dashboard
2. Sign in with your GitHub account
3. Find your **Life-Lag** project in the list
4. Click on it
5. You'll see your production URL at the top (looks like `life-lag-xxxx.vercel.app` or your custom domain)
6. **Copy this URL** (without the `https://` part for now)

### Option B: Check Your GitHub Repository
1. Go to your GitHub repository
2. Look for the Vercel bot's comment on recent commits
3. It will show your deployment URL

### Option C: Check Recent Emails
1. Check your email for messages from Vercel
2. They send deployment success emails with your URL

## Step 2: Configure Supabase (THIS IS CRITICAL!)

Once you have your production URL (e.g., `life-lag-xxxx.vercel.app`):

### A. Update Site URL
1. Go to https://supabase.com/dashboard
2. Select your **Life-Lag** project
3. Click **Authentication** in the left sidebar
4. Click **URL Configuration**
5. Find **Site URL** field
6. Change from `http://localhost:3000` 
7. To `https://your-actual-url.vercel.app` (replace with YOUR url)
8. Click **Save**

### B. Add Redirect URLs
Still in URL Configuration:
1. Find the **Redirect URLs** section
2. Click **Add URL**
3. Add: `https://your-actual-url.vercel.app/auth/callback`
4. Also keep: `http://localhost:3000/auth/callback` (for local development)
5. Click **Save**

### Example Configuration:
```
Site URL: https://life-lag-tracker.vercel.app

Redirect URLs:
- https://life-lag-tracker.vercel.app/auth/callback ✅
- http://localhost:3000/auth/callback ✅
```

## Step 3: Test Magic Link

1. Go to your **production URL** (not localhost!)
2. Click "Sign In" or "Get Started"
3. Click "Use magic link" 
4. Enter your email
5. Click "Send Magic Link"
6. Check your email
7. Click the magic link
8. **It should work now!** ✅

## Step 4: (Optional) Update Environment Variable

If you have `NEXT_PUBLIC_APP_URL` in your Vercel environment variables:

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Find `NEXT_PUBLIC_APP_URL`
3. Update it to match your production URL: `https://your-actual-url.vercel.app`
4. Click **Save**
5. Redeploy (or it will update on next deployment)

## Troubleshooting

### Can't find my production URL?
- Email me at the email you signed up with and I'll check your Vercel account
- Or DM me on the platform where we're connected

### Magic link still goes to localhost?
- You requested the link BEFORE updating Supabase
- Request a NEW magic link after updating Supabase configuration
- Old links will still point to localhost

### Still not working?
Make sure:
- [ ] Site URL in Supabase is your production URL
- [ ] Redirect URL includes `/auth/callback`
- [ ] Both URLs start with `https://` (not `http://`)
- [ ] You're requesting a NEW magic link (not using an old one)
- [ ] You're clicking the link from your production site, not localhost

## Quick Checklist

- [ ] Found my Vercel production URL
- [ ] Updated Site URL in Supabase
- [ ] Added redirect URL with `/auth/callback`
- [ ] Saved changes in Supabase
- [ ] Visited my production site (not localhost)
- [ ] Requested a NEW magic link
- [ ] Clicked the link and successfully signed in! 🎉

---

**Once this is done, magic links will work perfectly without needing to run a local server!**
