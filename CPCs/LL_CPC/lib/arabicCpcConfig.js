/** Default LL CPC Arabic QA Cloud Page URL (refresh qs= when expired). */
const DEFAULT_ARABIC_URL =
  'https://cloud.explore.legoland.ae/CPC_LL_AR?qs=ABB7InYiOjEsImQiOjQ5NTB9ADMAAAAAAJe0HhfRK8Xts6VOHFT0E1IeXvuUfZZ-NIeyMwUdhIE2Id9_V_uO4ZmrwtmPSZwS_zMN11c_nB68zcpWuarNpyG6kfC0qZgKFbiGamLu_XM9EO5PBiQPbvwjG5-FDVoG9g5Q-3Oju3BhymjAst4&utm_source=sfmc&utm_medium=email&utm_campaign=Sanity+Test+Email+-+AR&utm_term=%%%3dRedirectTo(CloudPagesURL(3515))%3d%%&utm_EmailName=Sanity+Test+Email+-+AR&Platform_Source=Legoland&Date=7/26/2026&utm_id=502486&sfmc_id=116255438';

function getArabicCpcUrl() {
  return (process.env.LL_CPC_ARABIC_URL || DEFAULT_ARABIC_URL).trim();
}

module.exports = { DEFAULT_ARABIC_URL, getArabicCpcUrl };
