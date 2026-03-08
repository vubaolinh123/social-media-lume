/**
 * Shared Template Utilities
 * Logo and QR code overlay — composited onto AI-generated images via Sharp
 */

const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const config = require('../../config');
const LOGO_QR_SIZE = 80;
const LOGO_QR_PADDING = 20;

/**
 * Load an asset image (logo/QR) and resize it
 * @param {string} assetPath - Path to the asset file
 * @param {number} size - Target size (square)
 * @returns {Buffer|null}
 */
async function loadAssetBuffer(assetPath, size = LOGO_QR_SIZE) {
  const resolvedPath = path.resolve(assetPath);
  if (!fs.existsSync(resolvedPath)) {
    console.warn(`⚠️  Asset not found: ${resolvedPath}`);
    return null;
  }
  try {
    return await sharp(resolvedPath)
      .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer();
  } catch (error) {
    console.warn(`⚠️  Failed to load asset ${resolvedPath}: ${error.message}`);
    return null;
  }
}

/**
 * Calculate position for an asset (logo/QR) based on named position
 * @param {string} position - 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
 * @param {number} canvasWidth
 * @param {number} canvasHeight
 * @param {number} assetSize
 * @returns {{ left: number, top: number }}
 */
function getAssetPosition(position, canvasWidth, canvasHeight, assetSize = LOGO_QR_SIZE) {
  const positions = {
    'top-left': { left: LOGO_QR_PADDING, top: LOGO_QR_PADDING },
    'top-right': { left: canvasWidth - assetSize - LOGO_QR_PADDING, top: LOGO_QR_PADDING },
    'bottom-left': { left: LOGO_QR_PADDING, top: canvasHeight - assetSize - LOGO_QR_PADDING },
    'bottom-right': { left: canvasWidth - assetSize - LOGO_QR_PADDING, top: canvasHeight - assetSize - LOGO_QR_PADDING },
  };
  return positions[position] || positions['bottom-left'];
}

/**
 * Composite logo and QR code onto an image buffer
 * @param {Buffer} imageBuffer - The AI-generated image
 * @param {object} options - { logoPosition, qrPosition }
 * @returns {Buffer} - Image with logo and QR composited
 */
async function compositeLogoAndQR(imageBuffer, options = {}) {
  const {
    logoPosition = 'bottom-left',
    qrPosition = 'bottom-right',
  } = options;

  // Get image dimensions
  const metadata = await sharp(imageBuffer).metadata();
  const { width, height } = metadata;

  const composites = [];

  // Load and position logo
  const logoBuffer = await loadAssetBuffer(config.paths.logo, LOGO_QR_SIZE);
  if (logoBuffer) {
    const pos = getAssetPosition(logoPosition, width, height, LOGO_QR_SIZE);
    composites.push({ input: logoBuffer, left: pos.left, top: pos.top });
  }

  // Load and position QR code
  const qrBuffer = await loadAssetBuffer(config.paths.qr, LOGO_QR_SIZE);
  if (qrBuffer) {
    const pos = getAssetPosition(qrPosition, width, height, LOGO_QR_SIZE);
    composites.push({ input: qrBuffer, left: pos.left, top: pos.top });
  }

  if (composites.length === 0) return imageBuffer;

  return sharp(imageBuffer)
    .composite(composites)
    .toBuffer();
}

module.exports = {
  LOGO_QR_SIZE,
  loadAssetBuffer,
  getAssetPosition,
  compositeLogoAndQR,
};
