/** Default Trex CPC Arabic QA Cloud Page URL (refresh qs= when expired). */
const DEFAULT_ARABIC_URL =
  'https://cloud.explore.trexglamping.com/TREX_CPC_AR?qs=ABB7InYiOjEsImQiOjQ5NTF9ADMAAAAAAJnPPlEyuDhRgdzGiaNf1ISdECMLrIcyFCoIss3hlYcqE2gJQRarrVkV6uH9pee2KV8lvQoZL98OcMcDZnHB-MazA6GDbLXavxu1Abh39nE5XlvITcy21-kSjB0FyqcGkOYZafyyyQRz-7GAhSA';

function getArabicCpcUrl() {
  return (process.env.TREX_CPC_ARABIC_URL || DEFAULT_ARABIC_URL).trim();
}

module.exports = { DEFAULT_ARABIC_URL, getArabicCpcUrl };
