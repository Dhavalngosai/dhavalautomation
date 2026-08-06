/**
 * Parse limit/offset env vars for field loop tests.
 * Default: remaining values from item 226 (offset 225) through the last value.
 */

/** Items 226-end — used by Country code and Country of Residence (no Nationality on DHE B2B). */
const REMAINING_FROM_226_RANGE = { offset: 225, limit: Number.MAX_SAFE_INTEGER };

/** Treat huge / non-finite limits as "through last value". */
function isToEndLimit(limit) {
  return !Number.isFinite(limit) || limit >= 1_000_000;
}

function parsePositiveInt(value, fallback) {
  const raw = Number(value);
  return Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : fallback;
}

function parseNonNegInt(value, fallback) {
  const raw = Number(value);
  return Number.isFinite(raw) && raw >= 0 ? Math.floor(raw) : fallback;
}

/**
 * @param {string} fieldLimitKey - e.g. DHE_B2B_CPC_COUNTRY_CODE_LIMIT
 * @param {string} fieldOffsetKey - e.g. DHE_B2B_CPC_COUNTRY_CODE_OFFSET
 * @param {string} globalLimitKey - e.g. DHE_B2B_CPC_FIELD_LIMIT
 * @param {string} globalOffsetKey - e.g. DHE_B2B_CPC_FIELD_OFFSET
 * @param {{ limit?: number, offset?: number }} [defaults]
 */
function getFieldRange(fieldLimitKey, fieldOffsetKey, globalLimitKey, globalOffsetKey, defaults = {}) {
  const defaultLimit = defaults.limit ?? REMAINING_FROM_226_RANGE.limit;
  const defaultOffset = defaults.offset ?? REMAINING_FROM_226_RANGE.offset;
  const limit = parsePositiveInt(
    process.env[fieldLimitKey] || process.env[globalLimitKey],
    defaultLimit
  );
  const offset = parseNonNegInt(
    process.env[fieldOffsetKey] || process.env[globalOffsetKey],
    defaultOffset
  );
  return { limit, offset };
}

/**
 * @param {unknown[]} allItems
 * @param {number} offset
 * @param {number} limit
 */
function sliceFieldItems(allItems, offset, limit) {
  if (!Array.isArray(allItems) || allItems.length === 0) return [];
  if (isToEndLimit(limit)) return allItems.slice(offset);
  return allItems.slice(offset, offset + limit);
}

/** @param {number} offset @param {number} limit */
function formatRangeLabel(offset, limit) {
  const start = offset + 1;
  if (isToEndLimit(limit)) {
    return `items ${start}-end (offset ${offset}, to last value)`;
  }
  const end = offset + limit;
  return `items ${start}-${end} (offset ${offset}, limit ${limit})`;
}

module.exports = {
  getFieldRange,
  sliceFieldItems,
  formatRangeLabel,
  REMAINING_FROM_226_RANGE,
  isToEndLimit,
};
