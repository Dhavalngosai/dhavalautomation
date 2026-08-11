/** Default MG CPC Arabic QA Cloud Page URL (refresh qs= when expired). */
const DEFAULT_ARABIC_URL =
  'https://cloud.explore.motiongatedubai.com/cpc_mg_ar?qs=ABB7InYiOjEsImQiOjQ5NDd9ADMAAAAAAJWpaPOltstX38YqkLJYeFJbzuHnUz5ZJpWYhCt0rB9pd_Q-wde1lh4L23Qmg2dhNvBYos67Njk9e2eT16H-86omo7dnj8XLBfCmVWBsvTe4rErvTcuunLffyNgMLftgHGs57uBar2Dpz017ViA&utm_source=sfmc&utm_medium=email&utm_campaign=Sanity+Test+Email+-+AR&utm_term=%%%3dRedirectTo(CloudPagesURL(3542))%3d%%&utm_EmailName=Sanity+Test+Email+-+AR&Platform_Source=MG&Date=7/24/2026&utm_id=502361&sfmc_id=116255438';

function getArabicCpcUrl() {
  return (process.env.MG_CPC_ARABIC_URL || DEFAULT_ARABIC_URL).trim();
}

module.exports = { DEFAULT_ARABIC_URL, getArabicCpcUrl };
