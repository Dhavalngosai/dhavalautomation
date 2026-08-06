/** Default DHE B2B CPC Arabic QA Cloud Page URL (refresh the URL token when expired). */
const DEFAULT_ARABIC_URL =
  'https://cloud.sales.dhentertainment.ae/DHE_B2B_AR_Prod?qs=ABB7InYiOjEsImQiOjQ5NTF9ADMAAAAAAJmOJFUUZtRPwpetZnSAoofnLruxFrC73jtE5Zb-wtJeItctrHDmM_eGVUni-0-itK35n69xuAgOzygBYY2FHSdFQ_kcjfBN0S0LX051Fr0_QST1mxWKmYKxh-hYjiBBtGza54mLsF_hGp72jb0';

function getArabicCpcUrl() {
  return (process.env.DHE_B2B_CPC_ARABIC_URL || DEFAULT_ARABIC_URL).trim();
}

module.exports = { DEFAULT_ARABIC_URL, getArabicCpcUrl };
