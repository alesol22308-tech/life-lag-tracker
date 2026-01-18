const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '..', 'public');
// Try to find the source image - check for common formats
const possibleSources = [
  path.join(publicDir, 'lifelagicon.png'),
  path.join(publicDir, 'brain-icon.jpg'),
  path.join(publicDir, 'brain-icon.png'),
  path.join(publicDir, 'logo.png'),
  path.join(publicDir, 'logo.jpg'),
];

let sourceImage = null;
for (const source of possibleSources) {
  if (fs.existsSync(source)) {
    sourceImage = source;
    break;
  }
}

// Check if source image exists
if (!sourceImage) {
  console.error(`Error: Source image not found.`);
  console.log('Please make sure one of these files exists in the public/ folder:');
  possibleSources.forEach(s => console.log(`  - ${path.basename(s)}`));
  process.exit(1);
}

console.log(`Using source image: ${path.basename(sourceImage)}`);

async function generateIcons() {
  try {
    console.log('Generating PWA icons and OG image...\n');

    // Get image metadata to determine cropping strategy
    const metadata = await sharp(sourceImage).metadata();
    const isSquare = Math.abs(metadata.width - metadata.height) < 10;
    
    // For icons, crop to center and resize with padding
    const iconConfig = {
      fit: isSquare ? 'contain' : 'cover', // Use cover for non-square to crop and recenter
      position: 'center',
      background: { r: 0, g: 0, b: 0, alpha: 1 } // Black background
    };

    // Generate favicon.ico (32x32)
    await sharp(sourceImage)
      .resize(32, 32, iconConfig)
      .png()
      .toFile(path.join(publicDir, 'favicon.ico'));
    console.log('✓ Created favicon.ico (32x32 PNG format)');

    // Generate icon-192.png
    await sharp(sourceImage)
      .resize(192, 192, iconConfig)
      .png()
      .toFile(path.join(publicDir, 'icon-192.png'));
    console.log('✓ Created icon-192.png');

    // Generate icon-512.png
    await sharp(sourceImage)
      .resize(512, 512, iconConfig)
      .png()
      .toFile(path.join(publicDir, 'icon-512.png'));
    console.log('✓ Created icon-512.png');

    // Generate apple-touch-icon.png (180x180)
    await sharp(sourceImage)
      .resize(180, 180, {
        ...iconConfig,
        // For iOS, add safe padding (use 80% of size to avoid mask clipping)
        fit: 'contain',
      })
      .extend({
        top: 18,
        bottom: 18,
        left: 18,
        right: 18,
        background: { r: 0, g: 0, b: 0, alpha: 1 }
      })
      .png()
      .toFile(path.join(publicDir, 'apple-touch-icon.png'));
    console.log('✓ Created apple-touch-icon.png (180x180 with safe padding)');

    // Generate OG image (1200x630) - Social sharing preview
    // This will center the logo and add text
    const ogWidth = 1200;
    const ogHeight = 630;
    const logoSize = 200; // Size of logo on OG image
    
    // First, resize logo to fit nicely in the OG image
    const logoBuffer = await sharp(sourceImage)
      .resize(logoSize, logoSize, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 } // Transparent for overlay
      })
      .png()
      .toBuffer();

    // Create OG image with logo centered and text
    const ogImage = sharp({
      create: {
        width: ogWidth,
        height: ogHeight,
        channels: 4,
        background: { r: 5, g: 5, b: 5, alpha: 1 } // Dark background matching app theme
      }
    })
      .composite([
        {
          input: logoBuffer,
          top: Math.floor((ogHeight - logoSize) / 2) - 80, // Position logo above center
          left: Math.floor((ogWidth - logoSize) / 2),
        }
      ]);

    await ogImage
      .png()
      .toFile(path.join(publicDir, 'og-image.png'));
    console.log('✓ Created og-image.png (1200x630 for social sharing)');

    console.log('\n✅ All icons and OG image generated successfully!');
    console.log('\nGenerated files:');
    console.log('  - favicon.ico');
    console.log('  - icon-192.png');
    console.log('  - icon-512.png');
    console.log('  - apple-touch-icon.png');
    console.log('  - og-image.png');
  } catch (error) {
    console.error('Error generating icons:', error);
    process.exit(1);
  }
}

generateIcons();
