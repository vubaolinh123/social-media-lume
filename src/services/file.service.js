const fs = require('fs').promises;

async function deleteFileSafe(filePath) {
  if (!filePath) {
    return { success: true, skipped: true, reason: 'empty_path' };
  }

  try {
    await fs.unlink(filePath);
    return { success: true, skipped: false };
  } catch (error) {
    if (error.code === 'ENOENT') {
      return { success: true, skipped: true, reason: 'missing_file' };
    }
    return {
      success: false,
      skipped: false,
      reason: 'fs_error',
      error,
    };
  }
}

module.exports = {
  deleteFileSafe,
};
