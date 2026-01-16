# Icons and Assets Needed

## Current Status

✅ **Already created:**
- `favicon.ico` - exists
- `icon-192.png` - exists
- `icon-512.png` - exists

❌ **Still need:**
- `apple-touch-icon.png` (180x180px) - for iOS home screen
- `og-image.png` (1200x630px) - for social sharing previews

## What's Needed

To complete the icon setup, you'll need to provide:
1. A logo asset (PNG or SVG format, high resolution)
2. The logo will be used to generate:
   - `apple-touch-icon.png` (180x180px)
   - `og-image.png` (1200x630px)

## Icon Metadata

The icon metadata in `app/layout.tsx` has already been updated to reference these files. Once you create the missing files from your logo asset, they will be automatically used by the app.

## OG Image Requirements

The OG image (`og-image.png`) should:
- Be 1200x630 pixels (recommended aspect ratio)
- Include the app name "Life Lag"
- Include the tagline "Detect early life drift before patterns shift"
- Use your visual branding/colors
- Be optimized for file size while maintaining quality

## Apple Touch Icon Requirements

The apple touch icon (`apple-touch-icon.png`) should:
- Be 180x180 pixels
- Have proper padding (safe zone) for iOS icon mask
- Use your app logo/icon design
