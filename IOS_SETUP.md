# iOS Setup Guide for Life-Lag

This guide covers setting up and building Life-Lag for iOS using Capacitor and Xcode.

## Prerequisites

Before you begin, ensure you have:

1. **macOS** - Required for iOS development
2. **Xcode 14+** - Download from the Mac App Store
3. **Node.js 18.17.0+** - Already configured in this project
4. **CocoaPods** - Will be installed automatically, or install manually:
   ```bash
   sudo gem install cocoapods
   ```
5. **Apple Developer Account** - Required for running on physical devices

## Project Architecture

Life-Lag uses **Capacitor** to wrap the web app in a native iOS container. The app loads from your hosted production server (e.g., Vercel) rather than bundling static files, enabling:

- Full API route functionality
- Server-side authentication
- Real-time data updates
- Push notifications via Firebase

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Add iOS Platform (if not already added)

```bash
npm run cap:add:ios
```

This creates the `ios/` directory with the native Xcode project.

### 3. Sync Capacitor

```bash
npm run cap:sync:ios
```

This updates the iOS project with the latest Capacitor configuration.

### 4. Open in Xcode

```bash
npm run cap:open:ios
```

Or manually open: `ios/App/App.xcworkspace`

**Important**: Always open `.xcworkspace`, not `.xcodeproj`!

### 5. Configure Signing

1. In Xcode, select the **App** project in the navigator
2. Select the **App** target
3. Go to **Signing & Capabilities** tab
4. Select your **Team** from the dropdown
5. Ensure **Bundle Identifier** is `com.lifelag.app`

### 6. Build and Run

1. Select a simulator or connected device from the device dropdown
2. Press **Cmd + R** or click the **Run** button
3. The app will build and launch

## Development Workflow

### Making Changes

Since the app loads from a hosted server:

1. Make changes to your web code
2. Deploy to your hosting provider (Vercel, etc.)
3. The iOS app will automatically load the updated version

### Updating Native Configuration

If you modify `capacitor.config.json` or native iOS files:

```bash
npm run cap:sync:ios
```

Then rebuild in Xcode.

## Configuring the Server URL

The app is configured to load from `https://lifelag.app`. To change this:

1. Edit `capacitor.config.json`:
   ```json
   {
     "server": {
       "url": "https://your-domain.com"
     }
   }
   ```

2. Sync the changes:
   ```bash
   npm run cap:sync:ios
   ```

### Local Development

For local development with hot reload:

1. Start the dev server:
   ```bash
   npm run dev
   ```

2. Temporarily update `capacitor.config.json`:
   ```json
   {
     "server": {
       "url": "http://YOUR_LOCAL_IP:3000",
       "cleartext": true
     }
   }
   ```

3. Sync and rebuild:
   ```bash
   npm run cap:sync:ios
   ```

**Note**: Replace `YOUR_LOCAL_IP` with your machine's local IP address (e.g., `192.168.1.100`), not `localhost`.

## Push Notifications Setup

### 1. Enable Capabilities in Xcode

1. Select the **App** project
2. Go to **Signing & Capabilities**
3. Click **+ Capability**
4. Add **Push Notifications**
5. Add **Background Modes** and check **Remote notifications**

### 2. Configure Firebase

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Add an iOS app with bundle ID: `com.lifelag.app`
3. Download `GoogleService-Info.plist`
4. Drag it into `ios/App/App/` in Xcode
5. Ensure "Copy items if needed" is checked
6. Add to target: App

### 3. Configure APNs

1. Go to Apple Developer Portal
2. Create an APNs key or certificate
3. Upload to Firebase Console > Project Settings > Cloud Messaging

## App Store Submission

### 1. Update Version Numbers

In Xcode, update:
- **Version** (CFBundleShortVersionString): e.g., `1.0.0`
- **Build** (CFBundleVersion): e.g., `1`

### 2. Configure App Icons

App icons should be in `ios/App/App/Assets.xcassets/AppIcon.appiconset/`:
- 1024x1024px (App Store)
- Various sizes for device icons

### 3. Archive and Submit

1. Select **Any iOS Device** as the build target
2. Go to **Product > Archive**
3. When complete, click **Distribute App**
4. Follow the prompts to upload to App Store Connect

## Troubleshooting

### Build Errors

**"No signing certificate"**
- Ensure you're logged into Xcode with your Apple ID
- Select a valid team in Signing & Capabilities

**"Pod install failed"**
```bash
cd ios/App
pod install --repo-update
```

**"Module not found"**
```bash
npm run cap:sync:ios
```
Then clean build folder in Xcode: **Product > Clean Build Folder**

### Runtime Issues

**App shows blank screen**
- Check the server URL in `capacitor.config.json`
- Ensure the server is running and accessible
- Check Safari > Develop > Simulator for console errors

**Push notifications not working**
- Must test on physical device (not simulator)
- Verify capabilities are enabled
- Check Firebase configuration
- Ensure `GoogleService-Info.plist` is in the project

**Authentication issues**
- Ensure your production server has correct Supabase configuration
- Check that cookies are properly set

### Xcode Updates

After updating Xcode:
1. Clean derived data: **Xcode > Preferences > Locations > Derived Data** (click arrow, delete folder)
2. Clean build folder: **Product > Clean Build Folder**
3. Re-sync: `npm run cap:sync:ios`

## File Structure

```
ios/
├── App/
│   ├── App/
│   │   ├── AppDelegate.swift      # Main app delegate
│   │   ├── Assets.xcassets/       # App icons and images
│   │   ├── Base.lproj/            # Storyboards
│   │   ├── capacitor.config.json  # Copied config
│   │   ├── Info.plist             # App configuration
│   │   └── public/                # Web assets (minimal)
│   ├── App.xcodeproj/             # Xcode project
│   ├── App.xcworkspace/           # Xcode workspace (USE THIS)
│   └── Podfile                    # CocoaPods dependencies
└── capacitor-cordova-ios-plugins/ # Plugin bridge
```

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run cap:add:ios` | Add iOS platform |
| `npm run cap:sync:ios` | Sync web assets and config to iOS |
| `npm run cap:open:ios` | Open Xcode project |
| `npm run ios` | Sync and open Xcode |

## Resources

- [Capacitor iOS Documentation](https://capacitorjs.com/docs/ios)
- [Capacitor Push Notifications](https://capacitorjs.com/docs/apis/push-notifications)
- [Apple Developer Documentation](https://developer.apple.com/documentation/)
- [Firebase iOS Setup](https://firebase.google.com/docs/ios/setup)

## Support

For issues specific to:
- **Web app**: Check browser console and server logs
- **iOS native**: Check Xcode console and device logs
- **Push notifications**: Check Firebase Console and APNs logs

See also:
- `MOBILE_INTEGRATION_SETUP.md` - Full mobile integration guide
- `MOBILE_INTEGRATION_QUICK_START.md` - Quick reference
