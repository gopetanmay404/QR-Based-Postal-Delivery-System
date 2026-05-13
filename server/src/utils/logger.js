const morgan = require('morgan');

// Custom morgan format for development
const devFormat = ':method :url :status :response-time ms - :res[content-length]';

// Custom morgan format for production
const prodFormat = ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent"';

/**
 * Get the appropriate morgan middleware
 */
function getHttpLogger() {
  const format = process.env.NODE_ENV === 'production' ? prodFormat : devFormat;
  return morgan(format);
}

/**
 * Simple console logger with timestamps
 */
const logger = {
  info: (...args) => console.log(`[${new Date().toISOString()}] [INFO]`, ...args),
  warn: (...args) => console.warn(`[${new Date().toISOString()}] [WARN]`, ...args),
  error: (...args) => console.error(`[${new Date().toISOString()}] [ERROR]`, ...args),
  debug: (...args) => {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[${new Date().toISOString()}] [DEBUG]`, ...args);
    }
  },
};

module.exports = { getHttpLogger, logger };
