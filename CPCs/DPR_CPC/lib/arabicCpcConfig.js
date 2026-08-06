/** Default DPR CPC Arabic QA Cloud Page URL (refresh qs= when expired). */
const DEFAULT_ARABIC_URL =
  'https://cloud.explore.dubaiparksandresorts.com/cpc_dpr_ar?qs=ABB7InYiOjEsImQiOjQ5NDd9ADMAAAAAAJT7avKw_1MuaiFz_vAF5mM32QDNXhix99NeWI3m8pvY0oaNozFxjhg6oaTnqQRJWNeWOA6M4BL7SJgXEv8NOHoofwRzc15TcTEwxGGPzs0YWS_HRBu7fhvXs5SHBZfXxCyOyRsH-gM62TXJ7cc&utm_source=sfmc&utm_medium=email&utm_campaign=Sanity+Test+Email+-+AR&utm_term=%%%3dRedirectTo(CloudPagesURL(3258))%3d%%&utm_EmailName=Sanity+Test+Email+-+AR&Platform_Source=DPR&Date=7/24/2026&utm_id=502053&sfmc_id=116255438';

function getArabicCpcUrl() {
  return (process.env.DPR_CPC_ARABIC_URL || DEFAULT_ARABIC_URL).trim();
}

module.exports = { DEFAULT_ARABIC_URL, getArabicCpcUrl };
