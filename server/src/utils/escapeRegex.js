/**
 * Escapes user input so it can be safely embedded in a RegExp / $regex.
 * @param {string} value
 * @returns {string}
 */
export function escapeRegex(value) {
    return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }