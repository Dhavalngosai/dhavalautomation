/**
 * Parse limit/offset env vars for field loop tests.
 * Default: ninth batch items 201-225 (offset 200, limit 25) for all fields.
 * If fewer than 25 values remain past the offset, continue from item 1.
 */

/** Items 201-225 - used by Country code, Nationality, and Country of Residence. */
const NINTH_TWENTY_FIVE_RANGE = { offset: 200, limit: 25 };

function parsePositiveInt(value, fallback) {
  const raw = Number(value);
  return Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : fallback;
}

function parseNonNegInt(value, fallback) {
  const raw = Number(value);
  return Number.isFinite(raw) && raw >= 0 ? Math.floor(raw) : fallback;
}

/**
 * @param {string} fieldLimitKey - e.g. RM_CPC_COUNTRY_CODE_LIMIT
 * @param {string} fieldOffsetKey - e.g. RM_CPC_COUNTRY_CODE_OFFSET
 * @param {string} globalLimitKey - e.g. RM_CPC_FIELD_LIMIT
 * @param {string} globalOffsetKey - e.g. RM_CPC_FIELD_OFFSET
 * @param {{ limit?: number, offset?: number }} [defaults]
 */
function getFieldRange(fieldLimitKey, fieldOffsetKey, globalLimitKey, globalOffsetKey, defaults = {}) {
  const defaultLimit = defaults.limit ?? NINTH_TWENTY_FIVE_RANGE.limit;
  const defaultOffset = defaults.offset ?? NINTH_TWENTY_FIVE_RANGE.offset;
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
 * Slice items starting at offset. If the tail is shorter than limit,
 * wrap from the beginning until limit values are collected.
 * @param {unknown[]} allItems
 * @param {number} offset
 * @param {number} limit
 */
function sliceFieldItems(allItems, offset, limit) {
  if (!Array.isArray(allItems) || allItems.length === 0 || limit <= 0) return [];

  const fromOffset = allItems.slice(offset, offset + limit);
  if (fromOffset.length >= limit) return fromOffset;

  const needed = limit - fromOffset.length;
  const fromStart = allItems.slice(0, Math.min(needed, allItems.length));
  return [...fromOffset, ...fromStart].slice(0, limit);
}

/** @param {number} offset @param {number} limit */
function formatRangeLabel(offset, limit) {
  const start = offset + 1;
  const end = offset + limit;
  return `items ${start}-${end} (offset ${offset}, limit ${limit}, wrap from start if short)`;
}

module.exports = { getFieldRange, sliceFieldItems, formatRangeLabel, NINTH_TWENTY_FIVE_RANGE };
