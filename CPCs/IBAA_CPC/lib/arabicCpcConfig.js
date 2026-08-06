/** Default IBAA CPC Arabic QA Cloud Page URL (refresh qs= when expired). */
const DEFAULT_ARABIC_URL =
  'https://cloud.explore.insideburjalarab.com/CPC_IBAA_AR?qs=ABB7InYiOjEsImQiOjQ5NTF9ADMAAAAAAJnE4BJ-vgVM473E4dbU-P9XrIaPvpEz2iDfWIxMeHno5t44eM5gsD61X7g_cl5W8cWmWhXzG_lGxxR3ioVA_eyr_T6Gd12FVrdNUY9MeZe3W6caob5C6Tp_0wNpn-jSlQB_GQzQwE6YfGgrb8I&utm_source=sfmc&utm_medium=email&utm_campaign=Sanity+Test+Email+AR&utm_term=%%%3dRedirectTo(CloudPagesURL(3911))%3d%%&utm_EmailName=Sanity+Test+Email+AR&Platform_Source=IBAA&Date=7/28/2026&utm_id=502969&sfmc_id=116255438';

function getArabicCpcUrl() {
  return (process.env.IBAA_CPC_ARABIC_URL || DEFAULT_ARABIC_URL).trim();
}

module.exports = { DEFAULT_ARABIC_URL, getArabicCpcUrl };
