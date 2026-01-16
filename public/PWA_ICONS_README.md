# PWA Icons - TODO

The PWA manifest is configured but icons are not yet added. To complete the PWA setup:

## Required Icons

Add these files to the `public/` directory:

1. **icon-192.png** - 192x192 pixels
2. **icon-512.png** - 512x512 pixels  
3. **favicon.ico** - Standard favicon

## How to Generate Icons

### Option 1: Online Generator (Easiest)
1. Go to https://www.pwabuilder.com/imageGenerator
2. Upload your app logo/icon (at least 512x512px)
3. Download generated icons
4. Place in `public/` folder

### Option 2: Manual Creation
1. Create or find your app icon/logo
2. Resize to 192x192 and save as `icon-192.png`
3. Resize to 512x512 and save as `icon-512.png`
4. Create `favicon.ico` using https://favicon.io/

## After Adding Icons

Update `public/manifest.json` to include the icons array:

```json
"icons": [
  {
    "src": "/icon-192.png",
    "sizes": "192x192",
    "type": "image/png",
    "purpose": "any maskable"
  },
  {
    "src": "/icon-512.png",
    "sizes": "512x512",
    "type": "image/png",
    "purpose": "any maskable"
  }
]
```

And add icons back to shortcuts if desired.

## Note

The PWA will work without icons, but they won't display properly when installed. The app is fully functional otherwise.
