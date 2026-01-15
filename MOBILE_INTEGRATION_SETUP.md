# Mobile Integration Setup Guide

This guide covers setting up all mobile integrations for the Life-Lag app:
- Push Notifications (via Firebase Cloud Messaging)
- SMS Notifications (via Twilio)
- Capacitor Mobile App

## Table of Contents

1. [Push Notifications Setup](#push-notifications-setup)
2. [SMS Notifications Setup](#sms-notifications-setup)
3. [Capacitor Mobile App Setup](#capacitor-mobile-app-setup)
4. [Testing](#testing)
5. [Troubleshooting](#troubleshooting)

---

## Push Notifications Setup

Push notifications are handled via Firebase Cloud Messaging (FCM), which works for both iOS and Android.

### Prerequisites

- Google account
- Firebase project
- Node.js environment with the app installed

### Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or select existing project
3. Follow the setup wizard
4. Once created, go to Project Settings (gear icon)

### Step 2: Generate Service Account Key

1. In Firebase Console, go to **Project Settings** > **Service Accounts**
2. Click "Generate New Private Key"
3. Save the JSON file securely (DO NOT commit to git)
4. You'll need these values from the JSON file:
   - `project_id`
   - `client_email`
   - `private_key`

### Step 3: Configure Environment Variables

Add these to your `.env.local` (development) and Vercel/hosting environment variables (production):

```env
# Firebase Admin SDK (for push notifications)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-client-email@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY=base64_encoded_private_key_here
```

**Important**: The private key contains newlines which can break in environment variables. Encode it as base64:

```bash
# On Mac/Linux
echo -n "YOUR_PRIVATE_KEY_HERE" | base64

# On Windows (PowerShell)
[Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes("YOUR_PRIVATE_KEY_HERE"))
```

Use the base64 encoded string for `FIREBASE_PRIVATE_KEY`.

### Step 4: Configure Firebase for Mobile Apps

#### For Android:

1. In Firebase Console, add an Android app:
   - Android package name: `com.lifelag.app` (must match `appId` in `capacitor.config.json`)
2. Download `google-services.json`
3. Place it in `android/app/` directory (created after running `npx cap add android`)

#### For iOS:

1. In Firebase Console, add an iOS app:
   - iOS bundle ID: `com.lifelag.app` (must match `appId` in `capacitor.config.json`)
2. Download `GoogleService-Info.plist`
3. Place it in `ios/App/App/` directory (created after running `npx cap add ios`)
4. Configure APNs (Apple Push Notification service):
   - Go to Apple Developer account
   - Create APNs certificates or keys
   - Upload to Firebase Console under **Project Settings** > **Cloud Messaging** > **iOS app configuration**

### Step 5: Test Push Notifications

Once configured, the app will automatically:
- Request permission when user enables push notifications in Settings
- Register device token with Firebase
- Store token in database
- Send notifications via cron jobs for reminders

---

## SMS Notifications Setup

SMS notifications are handled via Twilio.

### Prerequisites

- Twilio account (free trial available)
- Phone number for sending (Twilio provides one)

### Step 1: Create Twilio Account

1. Go to [Twilio](https://www.twilio.com/try-twilio)
2. Sign up for a free account
3. Verify your email and phone number

### Step 2: Get Twilio Credentials

1. Go to [Twilio Console](https://console.twilio.com/)
2. Find your **Account SID** and **Auth Token** on the dashboard
3. Get a phone number:
   - Go to **Phone Numbers** > **Manage** > **Buy a number**
   - Choose a number that supports SMS
   - For free trial, you can use the trial number

### Step 3: Configure Environment Variables

Add these to your `.env.local` (development) and Vercel/hosting environment variables (production):

```env
# Twilio (for SMS notifications)
TWILIO_ACCOUNT_SID=your_account_sid_here
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_FROM_NUMBER=+1234567890
```

### Step 4: Verify Phone Numbers (Trial Account)

If using a Twilio trial account:
1. Go to **Phone Numbers** > **Manage** > **Verified Caller IDs**
2. Add and verify phone numbers you want to test with
3. Trial accounts can only send SMS to verified numbers

### Step 5: Upgrade to Send to Any Number

For production use:
1. Upgrade your Twilio account (requires payment method)
2. This removes the verified number restriction
3. Set up billing alerts to monitor usage

---

## Capacitor Mobile App Setup

Capacitor allows the Next.js app to run as a native mobile app.

### Prerequisites

- Node.js and npm installed
- Xcode (for iOS development, Mac only)
- Android Studio (for Android development)

### Step 1: Install Dependencies

```bash
npm install
```

This installs all Capacitor packages listed in `package.json`:
- `@capacitor/core`
- `@capacitor/cli`
- `@capacitor/android`
- `@capacitor/ios`
- `@capacitor/push-notifications`

### Step 2: Build the Web App

```bash
npm run build
```

This creates the `.next` directory that Capacitor uses (configured in `capacitor.config.json`).

### Step 3: Add Native Platforms

#### For Android:

```bash
npx cap add android
```

This creates the `android/` directory with the native Android project.

#### For iOS:

```bash
npx cap add ios
```

This creates the `ios/` directory with the native iOS project.

**Note**: iOS development requires a Mac with Xcode installed.

### Step 4: Sync Web Code to Native Projects

After any web code changes:

```bash
npm run build
npx cap sync
```

This copies the built web app to the native projects and updates native dependencies.

### Step 5: Configure Push Notifications in Native Projects

#### Android Configuration

1. Open `android/app/build.gradle`
2. Ensure these are present (Capacitor usually adds them):
   ```gradle
   dependencies {
       implementation 'com.google.firebase:firebase-messaging:23.0.0'
   }
   ```

3. Open `android/app/src/main/AndroidManifest.xml`
4. Ensure push notification permissions are present:
   ```xml
   <uses-permission android:name="android.permission.POST_NOTIFICATIONS"/>
   ```

#### iOS Configuration

1. Open `ios/App/App.xcworkspace` in Xcode
2. Select your project in the navigator
3. Go to **Signing & Capabilities**
4. Click **+ Capability** and add:
   - **Push Notifications**
   - **Background Modes** (check "Remote notifications")
5. Ensure you have a provisioning profile with push notification entitlements

### Step 6: Run on Device/Emulator

#### Android:

```bash
npx cap open android
```

This opens Android Studio. Click "Run" to build and deploy to an emulator or connected device.

#### iOS:

```bash
npx cap open ios
```

This opens Xcode. Click "Run" to build and deploy to a simulator or connected device.

### Step 7: Configure Native App Icons and Splash Screens (Optional)

1. Add your app icon and splash screen assets to:
   - `android/app/src/main/res/` (various `mipmap-*` and `drawable-*` folders)
   - `ios/App/App/Assets.xcassets/`

2. Use [Capacitor Asset Generator](https://github.com/capacitor-community/assets) for automated generation:
   ```bash
   npm install -g @capacitor/assets
   npx capacitor-assets generate
   ```

---

## Testing

### Testing Push Notifications

#### 1. Test with Firebase Console

1. Go to Firebase Console > **Engage** > **Cloud Messaging**
2. Click "Send your first message"
3. Enter a notification title and text
4. Click "Send test message"
5. Enter the device token from your database and send

#### 2. Test with App

1. Enable push notifications in Settings
2. Check device token is saved to database (`push_notification_devices` table)
3. Wait for scheduled reminder (or trigger manually via API route)

#### 3. Test via API Route

You can manually trigger the reminder cron job:

```bash
curl -X POST http://localhost:3000/api/email/reminder \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  -H "Content-Type: application/json"
```

Set `CRON_SECRET` in your environment variables for security.

### Testing SMS Notifications

#### 1. Test via Settings

1. Enable SMS reminders in Settings
2. Enter your phone number (E.164 format, e.g., `+12125551234`)
3. Save preferences

#### 2. Test via API Route

```bash
curl -X POST http://localhost:3000/api/email/reminder \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  -H "Content-Type: application/json"
```

This triggers both email and SMS reminders.

#### 3. Check Twilio Logs

1. Go to Twilio Console > **Monitor** > **Logs** > **Messaging**
2. View sent messages and delivery status

### Testing on Mobile Devices

#### Android:

1. Build and install the app on a physical device or emulator
2. Grant notification permissions when prompted
3. Enable push notifications in app Settings
4. Send a test notification via Firebase Console

#### iOS:

1. Build and install on a physical device (push notifications don't work on simulator)
2. Grant notification permissions when prompted
3. Enable push notifications in app Settings
4. Send a test notification via Firebase Console

**Note**: iOS push notifications require:
- Physical device (not simulator)
- Valid provisioning profile
- APNs configured in Firebase

---

## Troubleshooting

### Push Notifications

#### Issue: "Push notification service not yet configured" error

**Solution**: Ensure all Firebase environment variables are set:
- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY` (base64 encoded)

Restart your Next.js server after adding environment variables.

#### Issue: Notifications not received on iOS

**Solutions**:
1. Ensure you're testing on a physical device (not simulator)
2. Check APNs is configured in Firebase Console
3. Verify push notification capability is enabled in Xcode
4. Check provisioning profile includes push notifications

#### Issue: Notifications not received on Android

**Solutions**:
1. Ensure `google-services.json` is in `android/app/`
2. Check notification permissions are granted on device
3. Verify Firebase is initialized properly (check Android Studio logs)
4. Test with Firebase Console first to isolate issues

#### Issue: "Invalid registration token" error

**Solution**: The device token has expired or is invalid. This happens when:
- App is uninstalled and reinstalled
- User revokes notification permissions
- Token expires (rare)

The app should automatically re-register, or user can toggle push notifications off/on in Settings.

### SMS Notifications

#### Issue: "SMS service not yet configured" error

**Solution**: Ensure all Twilio environment variables are set:
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_FROM_NUMBER`

#### Issue: SMS not received

**Solutions**:
1. **Trial Account**: Verify the recipient number is verified in Twilio Console
2. **Number Format**: Ensure phone number is in E.164 format (e.g., `+12125551234`)
3. **Twilio Balance**: Check you have sufficient balance
4. **Number Capabilities**: Ensure your Twilio number supports SMS
5. **Logs**: Check Twilio Console logs for delivery errors

#### Issue: "Unable to create record" error from Twilio

**Solution**: 
- Check the `from` number is a valid Twilio number you own
- Verify the `to` number is properly formatted
- Ensure your Twilio account is in good standing

### Capacitor/Mobile App

#### Issue: "Plugin not found" error

**Solution**: 
```bash
npm install
npx cap sync
```

Ensure native projects have the latest plugins.

#### Issue: Changes not reflecting in mobile app

**Solution**:
```bash
npm run build
npx cap sync
npx cap open [ios|android]
```

Then rebuild in Xcode/Android Studio.

#### Issue: Build errors in Android Studio

**Solutions**:
1. Update Android Studio to latest version
2. Update Gradle: File > Project Structure > Project > Update
3. Sync Gradle files
4. Clean and rebuild: Build > Clean Project, then Build > Rebuild Project

#### Issue: Build errors in Xcode

**Solutions**:
1. Update Xcode to latest version
2. Clean build folder: Product > Clean Build Folder
3. Delete derived data: Xcode > Preferences > Locations > Derived Data (click arrow, delete folder)
4. Re-sync: `npx cap sync ios`

---

## Cron Job Setup (Production)

To send automated reminders, set up cron jobs:

### Using Vercel Cron (Recommended for Vercel deployments)

Add to `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/email/reminder",
      "schedule": "0 9 * * *"
    },
    {
      "path": "/api/notifications/mid-week",
      "schedule": "0 9 * * *"
    }
  ]
}
```

### Using External Cron Service (EasyCron, cron-job.org, etc.)

1. Set up a cron job to hit these endpoints:
   - `POST https://your-app.com/api/email/reminder`
   - `POST https://your-app.com/api/notifications/mid-week`

2. Add authorization header:
   ```
   Authorization: Bearer YOUR_CRON_SECRET
   ```

3. Set `CRON_SECRET` environment variable for security

---

## Environment Variables Summary

Here's a complete list of environment variables needed:

```env
# App
NEXT_PUBLIC_APP_URL=https://your-app.com

# Supabase (existing)
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Email (existing)
RESEND_API_KEY=your-resend-api-key
FROM_EMAIL=Life Lag <checkin@lifelag.app>

# Firebase (for push notifications)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-client-email@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY=base64_encoded_private_key

# Twilio (for SMS)
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_FROM_NUMBER=+1234567890

# Cron Security
CRON_SECRET=your-random-secret-string
```

---

## Additional Resources

- [Firebase Cloud Messaging Documentation](https://firebase.google.com/docs/cloud-messaging)
- [Twilio SMS Documentation](https://www.twilio.com/docs/sms)
- [Capacitor Documentation](https://capacitorjs.com/docs)
- [Capacitor Push Notifications Plugin](https://capacitorjs.com/docs/apis/push-notifications)

---

## Support

If you encounter issues not covered here:

1. Check the browser/app console for error messages
2. Check server logs (Vercel logs, etc.)
3. Check Firebase Console logs
4. Check Twilio Console logs
5. Review the [Troubleshooting](#troubleshooting) section

For development assistance, refer to the codebase:
- Push notifications: `lib/push.ts`, `lib/push-registration.ts`
- SMS: `lib/sms.ts`
- API routes: `app/api/notifications/`, `app/api/email/`
- Settings page: `app/(app)/settings/page.tsx`
