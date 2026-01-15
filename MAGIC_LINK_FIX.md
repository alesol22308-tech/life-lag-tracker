# Magic Link Fix Guide

## Why It's Not Working
The magic link is redirecting to `localhost:3000`, which only works when your development server is running locally.

## Quick Fix Options

### Option A: Start Your Local Dev Server (For Local Development)

**Method 1: Double-click the batch file**
1. Find `start-dev-server.bat` in your project folder
2. Double-click it
3. Wait for "Ready on http://localhost:3000"
4. Click the magic link from your email again

**Method 2: Use Terminal**
```bash
cd "C:\Users\123al\OneDrive\Documents\Life-Lag"
npm run dev
```

### Option B: Use Your Production App (Recommended)

If your app is deployed on Vercel:

1. **Find your production URL**
   - Go to https://vercel.com/dashboard
   - Find your Life-Lag project
   - Copy your production URL (e.g., `https://life-lag.vercel.app`)

2. **Update Supabase Configuration**
   - Go to https://supabase.com/dashboard
   - Select your Life-Lag project
   - Go to **Authentication** → **URL Configuration**
   - Set **Site URL** to your production URL
   - Add your production URL to **Redirect URLs**
   - Click **Save**

3. **Test Again**
   - Go to your production URL
   - Click sign in
   - Request a new magic link
   - This time it will work! ✅

## Troubleshooting

### If npm is not found:
1. Install Node.js from https://nodejs.org/ (LTS version)
2. Restart your terminal/computer
3. Try again

### If you don't remember your production URL:
Run this command:
```bash
vercel ls
```

Or check your Vercel dashboard at https://vercel.com/dashboard

## Recommended Setup
**For development**: Use localhost and start dev server
**For production**: Use your Vercel URL

Update Supabase to use your production URL so magic links work without needing to run the server locally!
