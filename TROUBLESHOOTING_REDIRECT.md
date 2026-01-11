# Troubleshooting: Email Links Still Going to Localhost

If you've added the production URL to Supabase but links are still going to localhost, follow these steps:

## Step 1: Verify You Added the URL Correctly in Supabase

1. Go to Supabase Dashboard → Your Project → **Authentication** → **URL Configuration**

2. Check the **"Redirect URLs"** section - you should see BOTH:
   - `http://localhost:3000/auth/callback`
   - `https://your-app.vercel.app/auth/callback` ← This must match your Vercel URL exactly

3. **Verify the format is exactly correct:**
   - ✅ Starts with `https://`
   - ✅ Your exact Vercel domain (check your Vercel dashboard to confirm)
   - ✅ Ends with `/auth/callback`
   - ✅ No trailing slash
   - ✅ No extra spaces

4. **Did you click "Save"?** Look for a save button and make sure you clicked it.

## Step 2: Check Your Actual Vercel URL

1. Go to your Vercel dashboard
2. Click on your project
3. Look at the top - what's the exact URL shown?
   - It might be: `life-lag-tracker.vercel.app`
   - Or: `life-lag-tracker-abc123.vercel.app`
   - Copy this EXACT URL

4. In Supabase, make sure the redirect URL uses THIS EXACT domain

## Step 3: Request a NEW Magic Link

⚠️ **IMPORTANT**: Old magic links won't work! You MUST request a new one.

1. Go to your **Vercel production site** (not localhost)
   - Open: `https://your-app.vercel.app/login`
   - Don't use `http://localhost:3000`

2. Enter your email address
3. Click "Send Magic Link"
4. Check your email for the NEW link
5. Click the NEW link

## Step 4: Check the Email Link Directly

Before clicking, check what URL the link points to:

1. In your email, **right-click** on the magic link
2. Select **"Copy link address"** or **"Copy link location"**
3. Paste it somewhere (like a text editor)
4. Look at the URL - does it say:
   - ❌ `http://localhost:3000` → This is wrong, see Step 5
   - ✅ `https://your-app.vercel.app` → This is correct!

## Step 5: If the Link Still Has Localhost

If the email link itself contains `localhost`, this means:

1. **You're requesting from localhost** - Make sure you're on your Vercel site, not `localhost:3000`
2. **OR** the Site URL in Supabase is set to localhost

### Fix the Site URL in Supabase:

1. Go to Supabase → Authentication → URL Configuration
2. Find the **"Site URL"** field (usually at the top)
3. Change it from `http://localhost:3000` to:
   ```
   https://your-app.vercel.app
   ```
4. **Save** the changes
5. Request a NEW magic link from your production site

## Step 6: Double-Check Everything

Make a checklist:

- [ ] I added the production redirect URL to Supabase: `https://my-app.vercel.app/auth/callback`
- [ ] I clicked "Save" in Supabase
- [ ] The Site URL in Supabase is set to my production URL (or at least the redirect URL is added)
- [ ] I'm requesting the magic link from my **production Vercel site** (not localhost)
- [ ] I'm using a **NEW** magic link (not an old one from before I added the URL)
- [ ] The redirect URL format is exactly: `https://domain.vercel.app/auth/callback` (no trailing slash)

## Still Not Working?

### Option 1: Try a Different Browser
Sometimes browsers cache redirects. Try:
- A different browser
- Incognito/Private mode
- Clear your browser cache

### Option 2: Check Browser Console
1. Open your Vercel site
2. Press F12 to open developer tools
3. Go to the Console tab
4. Try to log in
5. Look for any error messages

### Option 3: Verify the URL Format Again
In Supabase, your Redirect URLs should look EXACTLY like this (with your actual domain):

```
http://localhost:3000/auth/callback
https://life-lag-tracker.vercel.app/auth/callback
```

Common mistakes:
- ❌ `https://life-lag-tracker.vercel.app/auth/callback/` (trailing slash)
- ❌ `http://life-lag-tracker.vercel.app/auth/callback` (http instead of https)
- ❌ `https://life-lag-tracker.vercel.app/callback` (missing /auth)
- ❌ `https://www.life-lag-tracker.vercel.app/auth/callback` (www prefix if you don't use it)

### Option 4: Check Supabase Logs
1. Go to Supabase Dashboard
2. Click **Logs** (left sidebar)
3. Click **Auth Logs**
4. Look for any errors when you try to log in

## Quick Test

To verify your setup is correct:

1. **In Supabase**: Redirect URLs should have your production URL
2. **In Supabase**: Site URL should be your production URL (or at least redirect URLs include it)
3. **In Vercel**: Your site is deployed and accessible
4. **Request link**: From your production site (not localhost)
5. **Use NEW link**: From the email you just received

If all of these are correct, it should work!
