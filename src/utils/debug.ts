// Utility for controlled, consistent debugging throughout the application
// Set this to false to disable all debug logs in production
const DEBUG_ENABLED = process.env.NODE_ENV === 'development';

/**
 * A controlled logging utility for the application.
 * Only logs in development mode unless force is true.
 */
export const debug = {
  /**
   * Log information with controlled verbosity
   * @param module The module/component name
   * @param message The message to log
   * @param data Optional data to include in the log
   * @param force Force logging even in production
   */
  log: (module: string, message: string, data?: any, force = false) => {
    if (DEBUG_ENABLED || force) {
      console.log(`[${module}] ${message}`, data !== undefined ? data : '');
    }
  },

  /**
   * Log errors with controlled verbosity
   * @param module The module/component name
   * @param message The error message to log
   * @param error Optional error object to include
   * @param force Force logging even in production
   */
  error: (module: string, message: string, error?: any, force = false) => {
    if (DEBUG_ENABLED || force) {
      console.error(`[${module}] ERROR: ${message}`, error !== undefined ? error : '');
    }
  },

  /**
   * Log warnings with controlled verbosity
   * @param module The module/component name
   * @param message The warning message to log
   * @param data Optional data to include
   * @param force Force logging even in production
   */
  warn: (module: string, message: string, data?: any, force = false) => {
    if (DEBUG_ENABLED || force) {
      console.warn(`[${module}] WARN: ${message}`, data !== undefined ? data : '');
    }
  },

  /**
   * Log info for API responses - useful for debugging
   * @param module The module/component name
   * @param endpoint The API endpoint that was called
   * @param response The response data
   * @param force Force logging even in production
   */
  api: (module: string, endpoint: string, response: any, force = false) => {
    if (DEBUG_ENABLED || force) {
      console.log(`[${module}] API ${endpoint}:`, response);
    }
  }
};

export default debug;
