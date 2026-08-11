/** Default MG CPC Arabic QA Cloud Page URL (refresh qs= when expired). */
const DEFAULT_ARABIC_URL =
  'https://cloud.explore.motiongatedubai.com/cpc_mg_ar_qa?qs=ABB7InYiOjEsImQiOjQ5MzN9ADMAAAAAAIKSuL3difHy41ms14lCLTTHaedxIAXzviJu45wF6UMrST_SbJXVYc0R8dvF5HI4src6ZSxNpDyPDKVcgMc6kWFu5tHaLHCRWO56bQkaCZdh_vYkbL9X0yX_PekPZXxquXZZ8YgjCQBhzs-M1CY&utm_source=sfmc&utm_medium=email&utm_campaign=Sanity+Test+Email+QA+-+AR&utm_term=%%%3dRedirectTo(CloudPagesURL(3381))%3d%%&utm_EmailName=Sanity+Test+Email+QA+-+AR&Platform_Source=MG&Date=7/10/2026&utm_id=498790&sfmc_id=116255438';

function getArabicCpcUrl() {
  return (process.env.MG_CPC_ARABIC_URL || DEFAULT_ARABIC_URL).trim();
}

module.exports = { DEFAULT_ARABIC_URL, getArabicCpcUrl };
