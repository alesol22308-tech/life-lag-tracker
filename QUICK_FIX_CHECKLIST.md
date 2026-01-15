# ✅ Quick Fix Checklist - Get Magic Links Working NOW!

## 🎯 Your Mission: 3 Simple Steps

### STEP 1: Find Your Production URL (2 minutes)
Go to: **https://vercel.com/dashboard**

Look for: **Life-Lag** or **life-lag** project

You'll see something like:
```
life-lag-abc123.vercel.app
```
or
```
your-custom-domain.com
```

**📝 Write it down or copy it!**

---

### STEP 2: Update Supabase Configuration (3 minutes)
Go to: **https://supabase.com/dashboard**

1. Click your **Life-Lag** project
2. Click **⚙️ Authentication** (left sidebar)
3. Click **URL Configuration**

#### Change Site URL:
```
FROM: http://localhost:3000
TO: https://YOUR-URL-FROM-STEP-1.vercel.app
```

#### Add Redirect URLs:
Add both of these (click "Add URL" for each):
```
✅ https://YOUR-URL-FROM-STEP-1.vercel.app/auth/callback
✅ http://localhost:3000/auth/callback
```

**💾 Click SAVE!**

---

### STEP 3: Test It! (1 minute)
1. Open **your production URL** (from Step 1) in browser
2. Click **"Sign In"** or **"Get Started"**
3. Click **"Use magic link"**
4. Enter your email
5. Click **"Send Magic Link"**
6. Open your email
7. Click the magic link
8. **🎉 SUCCESS!** You're signed in!

---

## 🚨 Important Notes

### ❌ DON'T:
- Don't use old magic links (request a new one after Step 2)
- Don't try on localhost (use your production URL)
- Don't skip saving in Supabase

### ✅ DO:
- Use your production URL from Vercel
- Request a NEW magic link after configuration
- Make sure URLs start with `https://`

---

## 📸 Visual Guide

### What Your Supabase Config Should Look Like:

```
┌─────────────────────────────────────────────┐
│ URL Configuration                            │
├─────────────────────────────────────────────┤
│                                              │
│ Site URL:                                    │
│ https://life-lag-abc123.vercel.app          │
│                                              │
│ Redirect URLs:                               │
│ • https://life-lag-abc123.vercel.app/auth/  │
│   callback                                   │
│ • http://localhost:3000/auth/callback       │
│                                              │
│            [Save Changes]                    │
└─────────────────────────────────────────────┘
```

---

## ⏱️ Total Time: ~6 minutes

## 🎯 Result: Magic links work forever! No more localhost issues!

---

**Need help? Open `CONFIGURE_PRODUCTION_URL.md` for detailed instructions.**
