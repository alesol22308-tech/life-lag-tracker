const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '..', 'public');
const sourceImage = path.join(publicDir, 'brain-icon.jpg');

// Check if source image exists
if (!fs.existsSync(sourceImage)) {
  console.error(`Error: Source image not found at ${sourceImage}`);
  console.log('Please make sure brain-icon.jpg exists in the public/ folder');
  process.exit(1);
}

async function generateIcons() {
  try {
    console.log('Generating PWA icons from brain-icon.jpg...');

    // Generate icon-192.png
    await sharp(sourceImage)
      .resize(192, 192, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 1 } // Black background
      })
      .png()
      .toFile(path.join(publicDir, 'icon-192.png'));
    console.log('✓ Created icon-192.png');

    // Generate icon-512.png
    await sharp(sourceImage)
      .resize(512, 512, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 1 } // Black background
      })
      .png()
      .toFile(path.join(publicDir, 'icon-512.png'));
    console.log('✓ Created icon-512.png');

    // Generate favicon.ico (16x16 and 32x32 sizes)
    // Note: sharp can't directly create .ico, so we'll create a 32x32 PNG as favicon
    // Most browsers accept PNG as favicon
    await sharp(sourceImage)
      .resize(32, 32, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 1 }
      })
      .png()
      .toFile(path.join(publicDir, 'favicon.ico'));
    console.log('✓ Created favicon.ico (32x32 PNG format)');

    console.log('\n✅ All PWA icons generated successfully!');
    console.log('Next: Update manifest.json to reference these icons.');
  } catch (error) {
    console.error('Error generating icons:', error);
    process.exit(1);
  }
}

generateIcons();
