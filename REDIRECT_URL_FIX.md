# Fix: Supabase Redirect URL Configuration

## The Problem
Supabase is saying the redirect URL is invalid. This is because Supabase has strict requirements for redirect URLs.

## The Solution

Go to your Supabase dashboard:

1. **Authentication** → **URL Configuration** (left sidebar)

2. Under **Site URL**, enter:
   ```
   http://localhost:3000
   ```

3. Under **Redirect URLs**, add this EXACT URL (one URL per line):
   ```
   http://localhost:3000/auth/callback
   ```

## Important Rules

✅ **DO:**
- Use the exact URL format: `http://localhost:3000/auth/callback`
- No trailing slash
- No wildcards (`*` or `/**`)
- One URL per line if adding multiple

❌ **DON'T:**
- Don't use wildcards: `http://localhost:3000/**` ❌
- Don't add trailing slash: `http://localhost:3000/auth/callback/` ❌
- Don't use patterns: `http://localhost:3000/*` ❌

## For Production

When you deploy to production (e.g., Vercel), add your production URL:
```
https://yourdomain.com/auth/callback
```

## How to Add the URL

1. In the **Redirect URLs** section, click the input field
2. Type: `http://localhost:3000/auth/callback`
3. Press Enter or click outside the field
4. The URL should appear in the list below
5. Click **Save** if there's a save button

## Still Having Issues?

- Make sure there are no extra spaces before/after the URL
- Try removing all URLs and adding just this one
- Make sure you're using `http://` (not `https://`) for localhost
- Check that the URL matches exactly: `http://localhost:3000/auth/callback`
