/** Default TGP Live CPC Arabic Cloud Page URL (refresh qs= when expired). */
const DEFAULT_ARABIC_URL =
  'https://cloud.explore.thegreenplanetdubai.com/CPC_TGP_AR?qs=ABB7InYiOjEsImQiOjQ5Mzd9ADMAAAAAAIZ4nXO0x9edu5NFYiU9ZcHRh6uNHlWdtRoTlt4yIiAVVrMe6cfWJvvORCuYTnE6kSvnBZFXpVJ2eV3oVUzmedWQ_Fi0BfshBlX_G8k6BOd4DNrY7eYRkw-tLXcJO1bENwhjnDOMqco7qujHpBE&utm_source=sfmc&utm_medium=email&utm_campaign=Sanity+Test+Email+-+Arabic&utm_term=%%%3dRedirectTo(CloudPagesURL(3339))%3d%%&utm_EmailName=Sanity+Test+Email+-+Arabic&Platform_Source=TGP&Date=7/14/2026&utm_id=499179&sfmc_id=116255438';

function getArabicCpcUrl() {
  return (process.env.TGP_CPC_ARABIC_URL || DEFAULT_ARABIC_URL).trim();
}

module.exports = { DEFAULT_ARABIC_URL, getArabicCpcUrl };
