/** Default RL CPC Arabic QA Cloud Page URL (refresh qs= when expired). */
const DEFAULT_ARABIC_URL =
  'https://cloud.explore.riverlanddubai.com/Riverland_AR_CPC?qs=ABB7InYiOjEsImQiOjQ5NTF9ADMAAAAAAJnGDqxph8ITVdkaSAkwJ2IVnPqaP0yGRakbcmAJNpibcH4T7NdgHd4bOChNOCMS7qRCeHipRAnozWNDG0_pGqi7CUq_GPx-6MCEf8LSD8iMLmvi23bIhaQ0EiPmoEVInYccRaAfGojYfT9VEws&utm_source=sfmc&utm_medium=email&utm_campaign=AR+Email+Prod&utm_term=%%%3dRedirectTo(CloudPagesURL(5189))%3d%%&utm_EmailName=AR+Email+Prod&Platform_Source=RIVERLANDDUBAI&Date=7/28/2026&utm_id=503059&sfmc_id=116255438';

function getArabicCpcUrl() {
  return (process.env.RL_CPC_ARABIC_URL || DEFAULT_ARABIC_URL).trim();
}

module.exports = { DEFAULT_ARABIC_URL, getArabicCpcUrl };
