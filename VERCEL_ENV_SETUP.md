# Detailed Guide: Add Environment Variables to Vercel

This guide will walk you through every single step to add environment variables to your Vercel project. Follow along carefully!

## Step 1: Get Your Supabase Credentials

Before adding variables to Vercel, you need to get them from Supabase:

1. **Open Supabase Dashboard**
   - Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
   - Sign in if you're not already signed in

2. **Select Your Project**
   - You'll see a list of your projects
   - Click on the project you want to use (or create a new one if you don't have one yet)
   - Wait for the project dashboard to load

3. **Navigate to API Settings**
   - Look at the **left sidebar** - you'll see icons for different sections
   - Find and click the **Settings** icon (it looks like a gear/cog ⚙️)
   - In the settings menu, click on **API** (it should be under "Project Settings")

4. **Copy Your Credentials**
   - You'll see a section called **"Project URL"**
     - It will look something like: `https://abcdefghijklmnop.supabase.co`
     - Click the **copy icon** (📋) next to it to copy the URL
     - **Save this somewhere** - you'll need it in a moment
   
   - Scroll down to **"Project API keys"** section
   - You'll see a table with different keys
   - Find the row that says **"anon"** and **"public"**
   - There's an **eye icon** 👁️ in that row - click it to reveal the key
   - Once revealed, click the **copy icon** (📋) to copy the key
   - **Save this somewhere too** - it's a long string starting with `eyJ...`

**You now have:**
- ✅ Your Supabase Project URL
- ✅ Your Supabase anon/public key

---

## Step 2: Navigate to Vercel Project Settings

1. **Open Vercel Dashboard**
   - Go to [https://vercel.com/dashboard](https://vercel.com/dashboard)
   - Sign in if needed

2. **Find Your Project**
   - You'll see a list/grid of all your projects
   - Look for **"life-lag-tracker"** (or whatever you named it)
   - **Click on the project name** to open it

3. **Open Project Settings**
   - Once inside the project, look at the **top navigation bar**
   - You'll see tabs like: **Overview**, **Deployments**, **Analytics**, **Settings**
   - Click on **"Settings"** (it's usually the rightmost tab)

4. **Find Environment Variables Section**
   - In the Settings page, look at the **left sidebar menu**
   - You'll see options like:
     - General
     - Domains
     - **Environment Variables** ← Click this one!
     - Integrations
     - Git
     - etc.
   - Click on **"Environment Variables"**

---

## Step 3: Add the First Environment Variable

You should now see a page with:
- A heading that says "Environment Variables"
- A button that says **"Add New"** or **"Add"** or a **"+"** icon
- Possibly an empty list or a list of existing variables

### Adding NEXT_PUBLIC_SUPABASE_URL:

1. **Click the "Add New" button**
   - This opens a form/dialog box

2. **Fill in the Key field**
   - You'll see a field labeled **"Key"** or **"Name"**
   - Type exactly: `NEXT_PUBLIC_SUPABASE_URL`
   - ⚠️ **Important**: Copy it exactly - it's case-sensitive!
   - No spaces, no typos

3. **Fill in the Value field**
   - You'll see a field labeled **"Value"**
   - Paste the Supabase Project URL you copied earlier
   - It should look like: `https://abcdefghijklmnop.supabase.co`
   - Make sure there are no extra spaces before or after

4. **Select Environments**
   - You'll see checkboxes or toggles for different environments:
     - ☐ **Production** - for your live site
     - ☐ **Preview** - for preview deployments
     - ☐ **Development** - for local development
   - **Check ALL THREE boxes** (or select "All environments" if there's that option)
   - This ensures the variable works everywhere

5. **Save the Variable**
   - Look for a **"Save"** button (usually at the bottom right of the form)
   - Click **"Save"**
   - You should see the variable appear in the list below

---

## Step 4: Add the Second Environment Variable

Now add the Supabase API key:

1. **Click "Add New" again**
   - Same button as before

2. **Fill in the Key**
   - Type exactly: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - ⚠️ **Case-sensitive!** Make sure it's exactly right

3. **Fill in the Value**
   - Paste the anon/public key you copied from Supabase
   - It's a very long string starting with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   - Make sure you copied the entire key (it's usually 200+ characters)
   - No spaces, no line breaks

4. **Select Environments**
   - Check **ALL THREE** environments again (Production, Preview, Development)

5. **Save**
   - Click **"Save"**
   - You should now see TWO variables in your list

---

## Step 5: Add the App URL (Optional but Recommended)

This helps with redirects and callbacks:

1. **Click "Add New" again**

2. **Fill in the Key**
   - Type: `NEXT_PUBLIC_APP_URL`

3. **Fill in the Value**
   - This is your Vercel deployment URL
   - To find it: Go to the **"Deployments"** tab in your project
   - Look at the latest deployment - you'll see a URL like:
     - `https://life-lag-tracker.vercel.app` or
     - `https://life-lag-tracker-xxxxx.vercel.app`
   - Copy that entire URL (including `https://`)
   - Paste it as the value

4. **Select Environments**
   - Check all three again

5. **Save**

---

## Step 6: Verify Your Variables

Before redeploying, double-check:

1. **Look at your Environment Variables list**
   - You should see at least 2-3 variables listed
   - Each should show:
     - The Key name
     - Partially masked Value (for security)
     - Which environments it's enabled for

2. **Verify the keys are correct**
   - `NEXT_PUBLIC_SUPABASE_URL` ✅
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` ✅
   - `NEXT_PUBLIC_APP_URL` ✅ (optional)

---

## Step 7: Redeploy Your Application

Environment variables only take effect after a new deployment:

### Option A: Redeploy from Vercel Dashboard (Easiest)

1. **Go to Deployments Tab**
   - Click **"Deployments"** in the top navigation
   - You'll see a list of all your deployments

2. **Find the Latest Deployment**
   - Usually the top one in the list
   - It will show a status (like "Ready" or "Building")

3. **Open the Deployment Menu**
   - Look for **three dots** (⋯) or a **menu icon** on the right side of that deployment row
   - Click it to open a dropdown menu

4. **Click "Redeploy"**
   - In the menu, you'll see options like:
     - Redeploy
     - View Function Logs
     - Cancel
     - etc.
   - Click **"Redeploy"**

5. **Confirm Redeploy**
   - A popup might ask you to confirm
   - Click **"Redeploy"** or **"Confirm"**

6. **Wait for Deployment**
   - You'll see the deployment status change to "Building..."
   - Wait 1-2 minutes for it to complete
   - Status will change to "Ready" when done

### Option B: Trigger by Pushing Code (Alternative)

If you prefer:
1. Make a small change to any file (or just add a comment)
2. Commit and push to GitHub
3. Vercel will automatically detect the push and redeploy

---

## Step 8: Test Your Site

After redeployment completes:

1. **Visit Your Site**
   - Go to your Vercel deployment URL
   - Or click the deployment in Vercel and click "Visit"

2. **Check for Errors**
   - The 500 error should be gone!
   - You should see your landing page or login page
   - If you still see errors, check the deployment logs

3. **Check Deployment Logs (if needed)**
   - In Vercel, go to the deployment
   - Click on it to see details
   - Look for any error messages in the logs

---

## Troubleshooting

### "Variable not found" errors
- Make sure you spelled the key names exactly right
- Check that you selected all environments
- Make sure you clicked "Save" after adding each variable

### Still seeing 500 errors
- Wait a few minutes - sometimes it takes time to propagate
- Check that you copied the full Supabase URL and key (no truncation)
- Verify in Supabase that your project is active and running
- Check the Vercel deployment logs for specific error messages

### Can't find the Environment Variables section
- Make sure you're in **Settings** (not Overview or Deployments)
- Look in the **left sidebar** - it should be there
- If you're on mobile, try the desktop site

### Variables not showing up after redeploy
- Make sure you selected the correct environments (Production, Preview, Development)
- Try redeploying again
- Check that the variable values don't have extra spaces

---

## What Each Variable Does

- **NEXT_PUBLIC_SUPABASE_URL**: Tells your app where your Supabase database is located
- **NEXT_PUBLIC_SUPABASE_ANON_KEY**: Allows your app to authenticate with Supabase (safe to expose in client-side code)
- **NEXT_PUBLIC_APP_URL**: Used for redirects after login (helps Supabase know where to send users back)

---

## Optional: Additional Variables

For full functionality, you can also add:

- **RESEND_API_KEY**: For sending emails (get from resend.com)
- **FROM_EMAIL**: The email address that sends emails
- **SUPABASE_SERVICE_ROLE_KEY**: For server-side operations (keep secret!)

But the two required variables above are enough to get your site working and fix the 500 error!

---

## Summary Checklist

- [ ] Got Supabase Project URL
- [ ] Got Supabase anon/public key
- [ ] Opened Vercel project settings
- [ ] Added `NEXT_PUBLIC_SUPABASE_URL` variable
- [ ] Added `NEXT_PUBLIC_SUPABASE_ANON_KEY` variable
- [ ] Selected all environments for both variables
- [ ] Redeployed the application
- [ ] Tested the site - no more 500 error!

You're done! 🎉
