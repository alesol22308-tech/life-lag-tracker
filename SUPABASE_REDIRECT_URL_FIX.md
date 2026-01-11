# Fix: Email Links Redirecting to Localhost (Production)

## The Problem

When you click the email verification link, it tries to redirect to `localhost` instead of your Vercel deployment URL. This happens because Supabase needs to have your production URL whitelisted.

## The Solution

You need to add your Vercel production URL to Supabase's allowed redirect URLs.

### Step 1: Find Your Vercel Production URL

1. Go to your Vercel dashboard: [https://vercel.com/dashboard](https://vercel.com/dashboard)
2. Click on your **life-lag-tracker** project
3. Look at the top of the page - you'll see your deployment URL
   - It will look like: `https://life-lag-tracker.vercel.app` or
   - `https://life-lag-tracker-xxxxx.vercel.app`
4. **Copy this URL** - you'll need it in the next step

### Step 2: Open Supabase URL Configuration

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Select your project
3. In the **left sidebar**, click **Authentication** (icon looks like a key/lock)
4. In the Authentication submenu, click **URL Configuration**

### Step 3: Update Site URL

1. Find the **"Site URL"** field (it's usually at the top)
2. If it currently says `http://localhost:3000`, you have two options:

   **Option A: Use Your Production URL (Recommended)**
   - Replace it with your Vercel URL: `https://your-app.vercel.app`
   - This sets your production site as the default

   **Option B: Keep Localhost for Development**
   - Leave it as `http://localhost:3000` if you're still developing locally
   - The redirect URLs will handle both environments

### Step 4: Add Production Redirect URL

1. Scroll down to the **"Redirect URLs"** section
2. You'll see a list of currently allowed URLs (probably just `http://localhost:3000/auth/callback`)

3. **Add your production URL:**
   - Click the **input field** or **"Add URL"** button
   - Type your production callback URL:
     ```
     https://your-app.vercel.app/auth/callback
     ```
   - Replace `your-app.vercel.app` with your actual Vercel URL
   - ⚠️ **Important**: 
     - Use `https://` (not `http://`)
     - No trailing slash at the end
     - Include `/auth/callback` at the end
     - Exact format: `https://life-lag-tracker.vercel.app/auth/callback`

4. **Press Enter** or click outside the field to add it
5. The URL should appear in the list below

### Step 5: Save Your Changes

1. Look for a **"Save"** button (usually at the bottom of the page)
2. Click **"Save"** to save your changes
3. You might see a success message confirming the save

### Step 6: Verify Your URLs

Your Redirect URLs list should now show:
- ✅ `http://localhost:3000/auth/callback` (for local development)
- ✅ `https://your-app.vercel.app/auth/callback` (for production)

**Example of correct format:**
```
http://localhost:3000/auth/callback
https://life-lag-tracker.vercel.app/auth/callback
```

## Important Rules (Read Carefully!)

✅ **DO:**
- Use the **exact URL format** shown above
- Use `https://` for production URLs (Vercel uses HTTPS)
- Use `http://` for localhost (local development)
- Include `/auth/callback` at the end
- One URL per line
- No trailing slashes (`/` at the end)

❌ **DON'T:**
- ❌ Don't use wildcards: `https://*.vercel.app/**`
- ❌ Don't add trailing slash: `https://your-app.vercel.app/auth/callback/`
- ❌ Don't use patterns: `https://your-app.vercel.app/*`
- ❌ Don't forget the `/auth/callback` part
- ❌ Don't mix up `http://` and `https://`

## Testing

After saving:

1. **Request a new magic link** from your Vercel site (not localhost)
   - Go to your production site
   - Enter your email
   - Click "Send Magic Link"

2. **Check your email** for the new magic link

3. **Click the link** - it should now redirect to your Vercel site instead of localhost

4. **If it still doesn't work:**
   - Wait a minute (changes might take a moment to propagate)
   - Double-check the URL format matches exactly
   - Make sure you clicked "Save" in Supabase
   - Try requesting a new magic link (old links might still have the old redirect)

## Common Issues

### "The link still goes to localhost"
- Make sure you added the production URL to the Redirect URLs list
- Request a NEW magic link after making the change (old links won't work)
- Check that the URL format is exactly right (no typos)

### "Invalid redirect URL" error
- Check the URL format matches exactly: `https://your-app.vercel.app/auth/callback`
- Make sure there's no trailing slash
- Verify you're using `https://` not `http://` for production

### "Redirect URL not in allowed list"
- Double-check the URL in Supabase matches your Vercel URL exactly
- Make sure you saved the changes in Supabase
- Try removing and re-adding the URL

## Summary

1. ✅ Found your Vercel production URL
2. ✅ Went to Supabase → Authentication → URL Configuration
3. ✅ Added production redirect URL: `https://your-app.vercel.app/auth/callback`
4. ✅ Saved changes
5. ✅ Requested new magic link from production site
6. ✅ Clicked link - now works! 🎉

Your email verification links should now work correctly!
