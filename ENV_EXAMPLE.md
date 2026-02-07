# Environment Variables Example

Copy this to `.env.local` for local development and set in your hosting provider (Vercel, etc.) for production.

```env
# App Configuration
NEXT_PUBLIC_APP_URL=https://your-app.com

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Email (Resend)
RESEND_API_KEY=your-resend-api-key
FROM_EMAIL=Life Lag <checkin@lifelag.app>

# Web Push (Browser Notifications) - OPTIONAL
# Generate VAPID keys using: npx web-push generate-vapid-keys
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your-vapid-public-key
VAPID_PRIVATE_KEY=your-vapid-private-key
# Set to true to send "check-in complete" push after each check-in (default: off)
# NEXT_PUBLIC_SEND_CHECKIN_COMPLETE_PUSH=true

# Firebase (Mobile Push Notifications) - OPTIONAL
# Get these from Firebase Console > Project Settings > Service Accounts
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY=base64_encoded_private_key_here

# Twilio (SMS Notifications) - OPTIONAL
# Get these from Twilio Console
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_FROM_NUMBER=+1234567890

# Cron Job Security
# Generate a random string for securing cron endpoints
CRON_SECRET=your-random-secret-string
```

## Notes

- **VAPID Keys**: Generate using:
  ```bash
  npx web-push generate-vapid-keys
  ```
  The public key goes in `NEXT_PUBLIC_VAPID_PUBLIC_KEY` and the private key goes in `VAPID_PRIVATE_KEY`.
  These are used for browser push notifications (Web Push Protocol).

- **FIREBASE_PRIVATE_KEY**: Must be base64 encoded to preserve newlines. Use:
  ```bash
  echo -n "YOUR_PRIVATE_KEY" | base64
  ```
  This is used for mobile push notifications (Firebase Cloud Messaging).

- **TWILIO_FROM_NUMBER**: Must include country code (e.g., +1 for US)

- **CRON_SECRET**: Generate with:
  ```bash
  openssl rand -base64 32
  ```

- VAPID keys, Firebase, and Twilio are **optional**. The app will work without them, but push notifications and SMS will be disabled.
