# Quick Deployment Checklist

## ✅ Step 1: Database Migration - DONE!
Your migration has been successfully run.

## Step 2: Deploy to Vercel

### Option A: Deploy via Vercel Dashboard (Easiest)

1. **Go to Vercel**
   - Visit [vercel.com](https://vercel.com)
   - Sign in with GitHub

2. **Import Your Project**
   - Click **"Add New..."** → **"Project"**
   - Select your GitHub repository (or connect it if not already connected)
   - Click **"Import"**

3. **Configure Build Settings**
   - Framework Preset: **Next.js** (should auto-detect)
   - Root Directory: `./` (leave as default)
   - Build Command: `npm run build` (default)
   - Output Directory: `.next` (default)
   - Install Command: `npm install` (default)

4. **Add Environment Variables**
   Click "Environment Variables" and add these (copy from your `.env.local` file):
   
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://aldiuuphvrmjimttucxw.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFsZGl1dXBodnJtamltdHR1Y3h3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgxNDk1OTUsImV4cCI6MjA4MzcyNTU5NX0.Xaeskh3tA_JcRa7JSkkKonCO6pyyIzV5lO0ETxtU8LA
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFsZGl1dXBodnJtamltdHR1Y3h3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODE0OTU5NSwiZXhwIjoyMDgzNzI1NTk1fQ.SYYSADp3BWuRIOHeUheo5F1pMpQH5lNdTbHSikSgmkk
   NEXT_PUBLIC_APP_URL=https://your-app-name.vercel.app
   ```
   
   **Important:** For `NEXT_PUBLIC_APP_URL`, use a placeholder for now (like `https://your-app-name.vercel.app`), then update it after deployment with your actual Vercel URL.

5. **Deploy**
   - Click **"Deploy"**
   - Wait 2-3 minutes for the build to complete

6. **Get Your Deployment URL**
   - Once deployed, Vercel will show you a URL like: `https://your-app-name.vercel.app`
   - Copy this URL

### Step 3: Update Environment Variables

1. **Go back to Vercel Project Settings → Environment Variables**
2. **Update `NEXT_PUBLIC_APP_URL`** with your actual deployment URL
3. **Redeploy** (click the three dots on the latest deployment → "Redeploy")

### Step 4: Update Supabase Redirect URLs

1. **Go to Supabase Dashboard** → **Authentication** → **URL Configuration**

2. **Update Site URL:**
   - Set to: `https://your-app-name.vercel.app` (your actual Vercel URL)

3. **Add Redirect URL:**
   - Click "Add URL" 
   - Add: `https://your-app-name.vercel.app/auth/callback`
   - Make sure it's exactly: `https://your-app-name.vercel.app/auth/callback` (no trailing slash)

4. **Save**

### Step 5: Test Your Deployment

1. **Visit your Vercel URL**
2. **Test the flow:**
   - Click "Continue" on the landing page
   - Enter your email
   - Check email for magic link
   - Click magic link → should redirect and sign you in
   - Complete a check-in
   - Verify all features work:
     - Continuity message appears
     - Streak shows (if applicable)
     - Reassurance message displays
     - Settings page works
     - Lock-in feature works

## Troubleshooting

- **Build fails?** Check the build logs in Vercel for errors
- **Auth not working?** Verify redirect URLs in Supabase match your Vercel domain exactly
- **Features not showing?** Check browser console (F12) for errors

## That's It!

Your app should now be live! 🎉
