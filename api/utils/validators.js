// api/utils/validators.js

/**
 * Validates tweet text length
 */
const validateTweetText = (text) => {
  if (!text || typeof text !== 'string') {
    return { valid: false, error: 'Tweet text is required' };
  }
  if (text.trim().length < 1) {
    return { valid: false, error: 'Tweet cannot be empty' };
  }
  if (text.length > 280) {
    return { valid: false, error: 'Tweet cannot exceed 280 characters' };
  }
  return { valid: true };
};

/**
 * Validates username format
 */
const validateUsername = (username) => {
  if (!username || typeof username !== 'string') {
    return { valid: false, error: 'Username is required' };
  }
  if (username.length < 3) {
    return { valid: false, error: 'Username must be at least 3 characters' };
  }
  if (username.length > 30) {
    return { valid: false, error: 'Username cannot exceed 30 characters' };
  }
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return { valid: false, error: 'Username can only contain letters, numbers, and underscores' };
  }
  return { valid: true };
};

/**
 * Validates UUID format
 */
const validateUUID = (uuid) => {
  if (!uuid || typeof uuid !== 'string') {
    return { valid: false, error: 'UUID is required' };
  }
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(uuid)) {
    return { valid: false, error: 'Invalid UUID format' };
  }
  return { valid: true };
};

/**
 * Validates pagination parameters
 */
const validatePagination = (page = 1, limit = 20) => {
  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);

  if (isNaN(pageNum) || pageNum < 1) {
    return { valid: false, error: 'Page must be a positive number' };
  }
  if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
    return { valid: false, error: 'Limit must be between 1 and 100' };
  }

  return { valid: true, page: pageNum, limit: limitNum };
};

module.exports = {
  validateTweetText,
  validateUsername,
  validateUUID,
  validatePagination,
};
