/**
 * Storage configuration constants (JavaScript version for scripts)
 * Update these values in one place to change limits across the application
 */

// Video file size limit in bytes (2GB)
const VIDEO_FILE_SIZE_LIMIT = 2 * 1024 * 1024 * 1024; // 2GB

// Image file size limit in bytes (5MB)
const IMAGE_FILE_SIZE_LIMIT = 5 * 1024 * 1024; // 5MB

module.exports = {
  VIDEO_FILE_SIZE_LIMIT,
  IMAGE_FILE_SIZE_LIMIT,
};
