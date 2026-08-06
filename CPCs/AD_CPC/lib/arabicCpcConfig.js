/** Default AD CPC Arabic QA Cloud Page URL (refresh qs= when expired). */
const DEFAULT_ARABIC_URL =
  'https://click.explore.aindubai.com/?qs=ABB7InYiOjEsImQiOjQ5NTB9ADMAAAAAAJgJs_BbW56S0TgxTKqmsQ28psjKPwfOOFdD6dRFCv1X9xWU6G1CDiSYGs6UG5kjr5eRJZVkp7ruuBW6pRqvY-LRnlLZtufTmKRMmYmHaVs';

function getArabicCpcUrl() {
  return (process.env.AD_CPC_ARABIC_URL || DEFAULT_ARABIC_URL).trim();
}

module.exports = { DEFAULT_ARABIC_URL, getArabicCpcUrl };
