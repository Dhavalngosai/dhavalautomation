/** Default OB CPC Arabic QA Cloud Page URL (refresh qs= when expired). */
const DEFAULT_ARABIC_URL =
  'https://cloud.explore.oasisbaydubai.com/OasisBay_AR_CPC?qs=ABB7InYiOjEsImQiOjQ5NTF9ADMAAAAAAJmszZLzXoysMoVjcbw4vgNZPb1bisxksxZREQe1bXHdaVrSUJ5X7gyc8CB89m7EVWZXfN_fCUreEnBjyD1nmEHkcJmCfvi6XhcNJu-HFgCOUXpORLFwLJGaeZ6LbTGl16VzB_gWKdrwGptPqSc&utm_source=sfmc&utm_medium=email&utm_campaign=AR+Email+Prod&utm_term=%%%3dRedirectTo(CloudPagesURL(5330))%3d%%&utm_EmailName=AR+Email+Prod&Platform_Source=OASISBAYDUBAI&Date=7/28/2026&utm_id=502972&sfmc_id=116255438';

function getArabicCpcUrl() {
  return (process.env.OB_CPC_ARABIC_URL || DEFAULT_ARABIC_URL).trim();
}

module.exports = { DEFAULT_ARABIC_URL, getArabicCpcUrl };
