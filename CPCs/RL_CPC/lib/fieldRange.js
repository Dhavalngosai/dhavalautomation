/**
 * Parse limit/offset env vars for field loop tests.
 * Default: seventh batch items 151-175 (offset 150, limit 25) for all fields.
 */

/** Items 151-175 - used by Country code, Nationality, and Country of Residence. */
const SEVENTH_TWENTY_FIVE_RANGE = { offset: 150, limit: 25 };

function parsePositiveInt(value, fallback) {
  const raw = Number(value);
  return Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : fallback;
}

function parseNonNegInt(value, fallback) {
  const raw = Number(value);
  return Number.isFinite(raw) && raw >= 0 ? Math.floor(raw) : fallback;
}

/**
 * @param {string} fieldLimitKey - e.g. RL_CPC_COUNTRY_CODE_LIMIT
 * @param {string} fieldOffsetKey - e.g. RL_CPC_COUNTRY_CODE_OFFSET
 * @param {string} globalLimitKey - e.g. RL_CPC_FIELD_LIMIT
 * @param {string} globalOffsetKey - e.g. RL_CPC_FIELD_OFFSET
 * @param {{ limit?: number, offset?: number }} [defaults]
 */
function getFieldRange(fieldLimitKey, fieldOffsetKey, globalLimitKey, globalOffsetKey, defaults = {}) {
  const defaultLimit = defaults.limit ?? SEVENTH_TWENTY_FIVE_RANGE.limit;
  const defaultOffset = defaults.offset ?? SEVENTH_TWENTY_FIVE_RANGE.offset;
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
  return allItems.slice(offset, offset + limit);
}

/** @param {number} offset @param {number} limit */
function formatRangeLabel(offset, limit) {
  const start = offset + 1;
  const end = offset + limit;
  return `items ${start}-${end} (offset ${offset}, limit ${limit})`;
}

module.exports = { getFieldRange, sliceFieldItems, formatRangeLabel, SEVENTH_TWENTY_FIVE_RANGE };
