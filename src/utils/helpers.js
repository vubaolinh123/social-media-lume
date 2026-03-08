const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

/**
 * Generate a unique filename
 */
function generateFilename(ext = '.png') {
  return `${Date.now()}-${uuidv4().slice(0, 8)}${ext}`;
}

/**
 * Ensure directory exists
 */
function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * Get file extension
 */
function getFileExt(filename) {
  return path.extname(filename).toLowerCase();
}

/**
 * Check if file is an image
 */
function isImage(filename) {
  const imageExts = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp'];
  return imageExts.includes(getFileExt(filename));
}

/**
 * Check if file is a video
 */
function isVideo(filename) {
  const videoExts = ['.mp4', '.mov', '.avi', '.mkv', '.webm'];
  return videoExts.includes(getFileExt(filename));
}

/**
 * Escape XML/SVG special characters
 */
function escapeXml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Truncate text with ellipsis
 */
function truncateText(text, maxLength = 100) {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

/**
 * Format date to Vietnamese locale
 */
function formatDate(date = new Date()) {
  return date.toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

module.exports = {
  generateFilename,
  ensureDir,
  getFileExt,
  isImage,
  isVideo,
  escapeXml,
  truncateText,
  formatDate,
};
