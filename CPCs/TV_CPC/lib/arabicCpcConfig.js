/** Default TV CPC Arabic QA Cloud Page URL (refresh qs= when expired). */
const DEFAULT_ARABIC_URL =
  'https://cloud.explore.theviewpalm.ae/CPC_TV_AR?qs=ABB7InYiOjEsImQiOjQ5NTF9ADMAAAAAAJl-z8qAlfKhKSeoZXZpT6UtWTub39dzgxyyd1mOfujZbeb8CzOYTGS3rYooGp0AaI3J9lsllsFrh_fqZ2vA2C18BUbc9ssW3oF1t0fkNzx0mVWIv0QRtU4Y9DOKu23yO8soWrAjyOcAW8SNfn4&utm_source=sfmc&utm_medium=email&utm_campaign=Sanity+Test+Email+AR&utm_term=%%%3dRedirectTo(CloudPagesURL(3883))%3d%%&utm_EmailName=Sanity+Test+Email+AR&Platform_Source=TV&Date=7/27/2026&utm_id=502953&sfmc_id=116255438';

function getArabicCpcUrl() {
  return (process.env.TV_CPC_ARABIC_URL || DEFAULT_ARABIC_URL).trim();
}

module.exports = { DEFAULT_ARABIC_URL, getArabicCpcUrl };
