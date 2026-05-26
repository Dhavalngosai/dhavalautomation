/**
 * Error handling helpers for automation.
 * Wrap failures with context and suggest alternatives (e.g. alternative locator).
 */

/**
 * Wrap an error with a message and optional suggested fix.
 * @param {Error} err
 * @param {string} context - e.g. "Salesforce login: username field"
 * @param {string} [suggestion] - e.g. "Try data-id or getByLabel if name changes"
 */
function wrapError(err, context, suggestion) {
  const msg = suggestion
    ? `${context}: ${err.message}. Suggestion: ${suggestion}`
    : `${context}: ${err.message}`;
  const e = new Error(msg);
  e.cause = err;
  e.originalMessage = err.message;
  return e;
}

/**
 * Run fn; on failure throw wrapped error with context and suggestion.
 */
async function withErrorContext(fn, context, suggestion) {
  try {
    return await fn();
  } catch (err) {
    throw wrapError(err, context, suggestion);
  }
}

module.exports = {
  wrapError,
  withErrorContext,
};
