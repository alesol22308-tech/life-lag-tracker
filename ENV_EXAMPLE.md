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

# Firebase (Push Notifications) - OPTIONAL
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

- **FIREBASE_PRIVATE_KEY**: Must be base64 encoded to preserve newlines. Use:
  ```bash
  echo -n "YOUR_PRIVATE_KEY" | base64
  ```

- **TWILIO_FROM_NUMBER**: Must include country code (e.g., +1 for US)

- **CRON_SECRET**: Generate with:
  ```bash
  openssl rand -base64 32
  ```

- Firebase and Twilio are **optional**. The app will work without them, but push notifications and SMS will be disabled.
