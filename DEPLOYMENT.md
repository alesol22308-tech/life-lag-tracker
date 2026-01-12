# Deployment Guide for Life-Lag

## Prerequisites

Before deploying, make sure you have:

1. ✅ All code changes committed to git
2. ✅ Supabase project set up and migration `002_retention_features.sql` run
3. ✅ Environment variables ready

## Step 1: Run Database Migration

**IMPORTANT:** You must run the new migration before deploying!

1. Go to your Supabase dashboard
2. Navigate to **SQL Editor**
3. Open the file `supabase/migrations/002_retention_features.sql`
4. Copy the entire contents
5. Paste into SQL Editor and click **Run**
6. Verify the migration succeeded (no errors)

## Step 2: Prepare Environment Variables

You'll need these environment variables in Vercel:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
NEXT_PUBLIC_APP_URL=https://your-vercel-domain.vercel.app
```

**Note:** `NEXT_PUBLIC_APP_URL` should be your Vercel domain (update after first deployment if needed).

## Step 3: Deploy to Vercel

### Option A: Deploy via Vercel Dashboard (Recommended for first deployment)

1. **Push your code to GitHub**
   ```bash
   git add .
   git commit -m "Add retention and engagement features"
   git push origin main
   ```

2. **Go to Vercel Dashboard**
   - Visit [vercel.com](https://vercel.com)
   - Sign in with GitHub

3. **Import Project**
   - Click **"Add New..."** → **"Project"**
   - Select your GitHub repository
   - Click **"Import"**

4. **Configure Project**
   - Framework Preset: **Next.js** (should auto-detect)
   - Root Directory: `./` (default)
   - Build Command: `npm run build` (default)
   - Output Directory: `.next` (default)

5. **Add Environment Variables**
   - In the environment variables section, add all variables from Step 2
   - Click **"Deploy"**

6. **Wait for Deployment**
   - First deployment takes 2-3 minutes
   - Watch the build logs for any errors

7. **Update Redirect URL in Supabase**
   - Once deployed, copy your Vercel URL (e.g., `https://your-app.vercel.app`)
   - Go to Supabase Dashboard → **Authentication** → **URL Configuration**
   - Add redirect URL: `https://your-app.vercel.app/auth/callback`
   - Update Site URL to: `https://your-app.vercel.app`

### Option B: Deploy via Vercel CLI

1. **Install Vercel CLI** (if not installed)
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   vercel
   ```
   - Follow prompts (link to existing project or create new)
   - Enter environment variables when prompted, or add them via dashboard

4. **Deploy to Production**
   ```bash
   vercel --prod
   ```

## Step 4: Verify Deployment

1. **Visit your Vercel URL**
   - Should see the landing page

2. **Test the flow:**
   - Click "Get Started" / "Continue"
   - Enter email for magic link
   - Complete check-in
   - Verify all new features work:
     - Continuity message appears
     - Streak displays (if applicable)
     - Reassurance message shows
     - Settings page has preferences
     - Lock-in feature works

3. **Check for errors:**
   - Open browser console (F12)
   - Check Vercel logs: Dashboard → Project → Logs

## Step 5: Update Supabase Redirect URLs

After deployment, update Supabase:

1. Go to **Supabase Dashboard** → **Authentication** → **URL Configuration**
2. **Site URL:** `https://your-app.vercel.app`
3. **Redirect URLs:** Add `https://your-app.vercel.app/auth/callback`
4. Save changes

## Troubleshooting

### Build Fails

- Check build logs in Vercel dashboard
- Common issues:
  - Missing environment variables
  - TypeScript errors (run `npm run build` locally first)
  - Database connection issues

### Database Errors

- Verify migration `002_retention_features.sql` was run
- Check RLS policies are correct
- Verify environment variables are set correctly

### Authentication Not Working

- Verify redirect URLs in Supabase match your Vercel domain
- Check that `NEXT_PUBLIC_APP_URL` matches your Vercel domain
- Clear browser cookies and try again

### Missing Features

- Check browser console for JavaScript errors
- Verify API routes are working (check Network tab)
- Check Vercel function logs

## Custom Domain (Optional)

If you have a custom domain:

1. Go to Vercel Dashboard → Project → Settings → Domains
2. Add your custom domain
3. Follow DNS configuration instructions
4. Update Supabase redirect URLs to use custom domain
5. Update `NEXT_PUBLIC_APP_URL` environment variable

## Post-Deployment Checklist

- [ ] Database migration `002_retention_features.sql` run
- [ ] Environment variables set in Vercel
- [ ] Application deployed successfully
- [ ] Supabase redirect URLs updated
- [ ] Test sign-up flow
- [ ] Test check-in flow
- [ ] Verify continuity messages work
- [ ] Verify streaks display correctly
- [ ] Test settings preferences
- [ ] Test lock-in feature
- [ ] Check mobile responsiveness

## Next Steps

After successful deployment:

1. Monitor Vercel logs for any errors
2. Test the full user journey
3. Set up monitoring/alerts (optional)
4. Consider setting up Vercel Analytics (optional)
