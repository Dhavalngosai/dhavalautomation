/**
 * Parse limit/offset env vars for field loop tests.
 * Default: all values (offset 0, no limit).
 */

function parsePositiveInt(value, fallback) {
  const raw = Number(value);
  return Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : fallback;
}

function parseNonNegInt(value, fallback) {
  const raw = Number(value);
  return Number.isFinite(raw) && raw >= 0 ? Math.floor(raw) : fallback;
}

/**
 * @param {string} fieldLimitKey
 * @param {string} fieldOffsetKey
 * @param {string} globalLimitKey
 * @param {string} globalOffsetKey
 * @param {{ limit?: number | null, offset?: number }} [defaults]
 */
function getFieldRange(fieldLimitKey, fieldOffsetKey, globalLimitKey, globalOffsetKey, defaults = {}) {
  const envLimit = process.env[fieldLimitKey] || process.env[globalLimitKey];
  const envOffset = process.env[fieldOffsetKey] || process.env[globalOffsetKey];
  const defaultLimit = defaults.limit ?? null;
  const defaultOffset = defaults.offset ?? 0;

  const limit = envLimit ? parsePositiveInt(envLimit, defaultLimit) : defaultLimit;
  const offset = parseNonNegInt(envOffset, defaultOffset);
  return { limit, offset };
}

/**
 * @param {unknown[]} allItems
 * @param {number} offset
 * @param {number | null} limit
 */
function sliceFieldItems(allItems, offset, limit) {
  if (limit == null) {
    return allItems.slice(offset);
  }
  return allItems.slice(offset, offset + limit);
}

/** @param {number} offset @param {number | null} limit @param {number} total */
function formatRangeLabel(offset, limit, total) {
  if (limit == null) {
    return offset === 0 ? `all ${total} items` : `items ${offset + 1}–${total} (offset ${offset})`;
  }
  const start = offset + 1;
  const end = offset + limit;
  return `items ${start}–${end} (offset ${offset}, limit ${limit})`;
}

module.exports = { getFieldRange, sliceFieldItems, formatRangeLabel };
