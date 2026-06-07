/**
 * Input Sanitization Middleware
 * Strips dangerous characters from string inputs to prevent XSS and injection attacks.
 */

/**
 * Recursively sanitize all string values in an object.
 * - Strips HTML tags
 * - Removes null bytes
 * - Trims excessive whitespace
 */
function sanitizeValue(value) {
  if (typeof value === 'string') {
    return value
      // Remove null bytes
      .replace(/\0/g, '')
      // Strip HTML/script tags (basic XSS prevention)
      .replace(/<[^>]*>/g, '')
      // Remove potential MongoDB/NoSQL injection operators
      .replace(/\$(?:gt|gte|lt|lte|ne|in|nin|or|and|not|nor|exists|type|regex|where|all|elemMatch|size|mod|slice|text|meta|group|project|limit|skip|unwind|sort|natural|explain|hint|maxScan|snapshot|comment|min|max|returnKey|showDiskLoc|orderby|query|each|position|bit|isolated)/gi, '')
      // Trim whitespace
      .trim();
  }
  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }
  if (value !== null && typeof value === 'object') {
    return sanitizeObject(value);
  }
  return value;
}

function sanitizeObject(obj) {
  if (!obj || typeof obj !== 'object') return obj;

  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    // Block keys that start with $ (NoSQL injection) or contain __proto__
    if (key.startsWith('$') || key === '__proto__' || key === 'constructor' || key === 'prototype') {
      continue;
    }
    sanitized[key] = sanitizeValue(value);
  }
  return sanitized;
}

/**
 * Express middleware that sanitizes req.body, req.query, and req.params.
 */
function sanitizeMiddleware(req, res, next) {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body);
  }
  if (req.query && typeof req.query === 'object') {
    req.query = sanitizeObject(req.query);
  }
  if (req.params && typeof req.params === 'object') {
    req.params = sanitizeObject(req.params);
  }
  next();
}

module.exports = sanitizeMiddleware;
