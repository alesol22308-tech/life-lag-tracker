# Mobile Integration Quick Start

Quick reference for getting mobile features working.

## ✅ What's Implemented

All mobile integrations are now fully implemented:

1. ✅ **Push Notifications** (Firebase Cloud Messaging)
2. ✅ **SMS Notifications** (Twilio)
3. ✅ **Capacitor Mobile App** (iOS + Android)
4. ✅ **Client-side Push Registration**
5. ✅ **Settings UI Integration**

## 🚀 Quick Setup (5 Minutes)

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Add to `.env.local`:

```env
# Push Notifications (Firebase)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY=base64_encoded_key

# SMS (Twilio)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_FROM_NUMBER=+1234567890

# Cron Security
CRON_SECRET=your-random-secret
```

### 3. Run Development Server

```bash
npm run dev
```

### 4. Build Mobile App (Optional)

```bash
npm run build
npx cap add android  # For Android
npx cap add ios      # For iOS (Mac only)
npx cap sync
```

## 📱 Features

### Push Notifications
- ✅ Automatic device token registration
- ✅ Weekly check-in reminders
- ✅ Mid-week check notifications
- ✅ iOS & Android support
- ✅ Web-safe (gracefully handles non-mobile)

### SMS Notifications
- ✅ Weekly check-in reminders via SMS
- ✅ E.164 phone number formatting
- ✅ Twilio integration
- ✅ Error handling and logging

### Settings Integration
- ✅ Toggle push notifications on/off
- ✅ Toggle SMS reminders on/off
- ✅ Phone number input validation
- ✅ Platform detection (mobile vs web)
- ✅ Permission handling

## 🔧 How It Works

### Architecture

```
User enables notifications in Settings
         ↓
Client registers with Capacitor Push API
         ↓
Device token sent to backend API
         ↓
Token saved in push_notification_devices table
         ↓
Cron jobs send notifications via Firebase/Twilio
         ↓
Notifications delivered to user's device
```

### Key Files

**Server-side:**
- `lib/push.ts` - Firebase push notification service
- `lib/sms.ts` - Twilio SMS service
- `app/api/notifications/push/register/route.ts` - Token registration API
- `app/api/email/reminder/route.ts` - Weekly reminder cron
- `app/api/notifications/mid-week/route.ts` - Mid-week check cron

**Client-side:**
- `lib/push-registration.ts` - Push notification utilities
- `app/(app)/settings/page.tsx` - Settings UI with push integration
- `capacitor.config.json` - Capacitor configuration

**Documentation:**
- `MOBILE_INTEGRATION_SETUP.md` - Comprehensive setup guide

## 🎯 Testing Checklist

### Push Notifications

- [ ] Set Firebase environment variables
- [ ] Restart dev server
- [ ] Open app on mobile device (or use Android Studio/Xcode)
- [ ] Go to Settings → Enable push notifications
- [ ] Check device token saved to database
- [ ] Send test notification from Firebase Console
- [ ] Verify notification received

### SMS Notifications

- [ ] Set Twilio environment variables
- [ ] Restart dev server
- [ ] Go to Settings → Enable SMS reminders
- [ ] Enter phone number (with country code, e.g., +12125551234)
- [ ] Save preferences
- [ ] Trigger reminder API manually or wait for cron
- [ ] Verify SMS received

### Mobile App

- [ ] Run `npm run build`
- [ ] Run `npx cap sync`
- [ ] Open in Android Studio: `npx cap open android`
- [ ] Or open in Xcode: `npx cap open ios`
- [ ] Build and run on device/emulator
- [ ] Test all notification features in app

## 🔑 Getting Credentials

### Firebase (Free)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create project (or use existing)
3. Project Settings → Service Accounts → Generate New Private Key
4. Extract values from JSON and add to `.env.local`

**Tip:** Encode private key as base64:
```bash
echo -n "YOUR_PRIVATE_KEY" | base64
```

### Twilio (Free Trial Available)

1. Sign up at [Twilio](https://www.twilio.com/try-twilio)
2. Get Account SID and Auth Token from dashboard
3. Get a phone number (Phone Numbers → Buy a number)
4. Add credentials to `.env.local`

**Note:** Trial accounts can only send to verified numbers.

## 📊 Database Tables

The migrations already created these tables:

**`push_notification_devices`**
- Stores device tokens for push notifications
- Supports multiple devices per user
- Tracks platform (ios, android, web)

**`users` table updates**
- `push_notification_enabled` - Boolean flag
- `push_notification_token` - Legacy single token field
- `mid_week_check_enabled` - Boolean flag for mid-week checks
- `sms_reminder_enabled` - Boolean flag for SMS
- `sms_phone_number` - User's phone number

## 🐛 Common Issues

**Push notifications not working?**
- Check Firebase env vars are set correctly
- Restart the server after adding env vars
- Ensure device token is saved to database
- Check Firebase Console logs

**SMS not sending?**
- Check Twilio env vars are set
- Verify phone number format (must include country code)
- For trial accounts, verify recipient number in Twilio Console
- Check Twilio Console logs

**"Not configured" errors?**
- The app will log these but not crash
- Services gracefully skip if not configured
- Set the required env vars to enable

**Mobile app issues?**
- Run `npm run build && npx cap sync` after any web changes
- For iOS: Xcode → Product → Clean Build Folder
- For Android: Android Studio → Build → Clean Project

## 📚 Full Documentation

See `MOBILE_INTEGRATION_SETUP.md` for:
- Detailed setup instructions
- Platform-specific configuration
- Advanced troubleshooting
- Production deployment guide
- Cron job setup

## 🎉 Optional: Graceful Degradation

**Important:** All mobile features gracefully degrade if not configured:

- No Firebase credentials? Push notifications silently skip
- No Twilio credentials? SMS silently skip
- Not on mobile? Push notifications disabled in UI
- Missing env vars? Logged to console but doesn't crash

This means you can deploy without configuring everything immediately!

## 💡 Tips

1. **Start with email reminders** - Already working with Resend
2. **Add push next** - Better UX than SMS for app users
3. **Add SMS last** - Great for users who want text reminders

4. **Use cron jobs** - Set up `vercel.json` cron or external service
5. **Monitor logs** - Firebase and Twilio consoles show delivery status
6. **Test incrementally** - Test each integration separately

## 🔐 Security Notes

- Never commit `.env.local` or service account JSON files
- Use `CRON_SECRET` to protect cron endpoints
- Rotate credentials if they're exposed
- Use base64 encoding for Firebase private key to prevent newline issues

---

**Need help?** See `MOBILE_INTEGRATION_SETUP.md` for detailed troubleshooting and setup instructions.
