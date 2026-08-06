/** Default Roxy Live CPC Arabic Cloud Page URL (refresh qs= when expired). */
const DEFAULT_ARABIC_URL =
  'https://cloud.explore.theroxycinemas.com/CPC_Roxy_AR?qs=ABB7InYiOjEsImQiOjQ5MzZ9ADMAAAAAAIWXbmLeRLqGaDnGZuvcoWlFyRwhE8gwY1XkpyMXh9UlZSdXUtgqjkkXrZT1LzQJO96ihZznvtfzzlSMjrPJda_Mi2PTYTFjIvKxHfZXAbdZN6l4r8r_rcWMp8q9oUFCqvDg1N_eznEoRTa_P4M&utm_source=sfmc&utm_medium=email&utm_campaign=Sanity+Test+Email+AR&utm_term=%%%3dRedirectTo(CloudPagesURL(3481))%3d%%&utm_EmailName=Sanity+Test+Email+AR&Platform_Source=Roxy&Date=7/13/2026&utm_id=499026&sfmc_id=116255438';

function getArabicCpcUrl() {
  return (process.env.ROXY_CPC_ARABIC_URL || DEFAULT_ARABIC_URL).trim();
}

module.exports = { DEFAULT_ARABIC_URL, getArabicCpcUrl };
