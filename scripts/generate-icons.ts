import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const publicDir = path.join(process.cwd(), 'public');

async function generateIcons() {
  console.log('Generating favicon and app icons...\n');

  // Check for source image
  const sourcePath = path.join(publicDir, 'apple-touch-icon-base.png');
  if (!fs.existsSync(sourcePath)) {
    console.error('Source image not found:', sourcePath);
    process.exit(1);
  }

  // Create favicon ICO (we'll create PNGs and note that ICO needs special handling)
  // For now, we'll create a 32x32 PNG as favicon.ico substitute
  
  const icons = [
    { name: 'favicon-16x16.png', size: 16 },
    { name: 'favicon-32x32.png', size: 32 },
    { name: 'apple-touch-icon.png', size: 180 },
    { name: 'android-chrome-192x192.png', size: 192 },
    { name: 'android-chrome-512x512.png', size: 512 },
    { name: 'icon-192-maskable.png', size: 192 },
    { name: 'icon-512-maskable.png', size: 512 },
  ];

  for (const icon of icons) {
    try {
      const outputPath = path.join(publicDir, icon.name);
      
      // For maskable icons, add padding (10% safe zone)
      const isMaskable = icon.name.includes('maskable');
      
      if (isMaskable) {
        // Create with padding for maskable icons
        const padding = Math.round(icon.size * 0.1);
        const innerSize = icon.size - (padding * 2);
        
        // Create a canvas with padding
        await sharp(sourcePath)
          .resize(innerSize, innerSize, { fit: 'contain', background: { r: 58, g: 50, b: 45 } })
          .extend({
            top: padding,
            bottom: padding,
            left: padding,
            right: padding,
            background: { r: 58, g: 50, b: 45 } // #3A322D
          })
          .png()
          .toFile(outputPath);
      } else {
        await sharp(sourcePath)
          .resize(icon.size, icon.size, { fit: 'contain' })
          .png()
          .toFile(outputPath);
      }
      
      console.log(`✓ Created: ${icon.name} (${icon.size}x${icon.size})`);
    } catch (error) {
      console.error(`✗ Failed: ${icon.name}`, error);
    }
  }

  // Create favicon.ico as a 32x32 PNG (browsers accept PNG as favicon)
  try {
    const faviconPath = path.join(publicDir, 'favicon.ico');
    await sharp(sourcePath)
      .resize(32, 32, { fit: 'contain' })
      .png()
      .toFile(faviconPath);
    console.log('✓ Created: favicon.ico (32x32)');
  } catch (error) {
    console.error('✗ Failed: favicon.ico', error);
  }

  console.log('\n✅ All icons generated!');
  
  // Clean up source
  fs.unlinkSync(sourcePath);
  console.log('🧹 Cleaned up temporary source image');
}

generateIcons().catch(console.error);
