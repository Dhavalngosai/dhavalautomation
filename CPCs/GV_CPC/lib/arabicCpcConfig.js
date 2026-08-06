/** Default GV CPC Arabic QA Cloud Page URL (refresh qs= when expired). */
const DEFAULT_ARABIC_URL =
  'https://cloud.explore.globalvillage.ae/AR_CPC?qs=ABB7InYiOjEsImQiOjQ5NTB9ADMAAAAAAJgCdaOn9Wof52SJhrxUt5NYdaRUU8D1zEWhllPY9nPhAeAQnN3G7flugm7u9ulwfdZg2Tv8gA3yIeYUs248pKhU8_ArDhDSGn-iiZuy3d0QrRZ0KwuJB3kTIYbRrW0XvGXgZzE4ts6FKaa1jUk&utm_source=sfmc&utm_medium=email&utm_campaign=Sanity+Test+Email+AR&utm_term=%%%3dRedirectTo(CloudPagesURL(3459))%3d%%&utm_EmailName=Sanity+Test+Email+AR&Platform_Source=GV&Date=7/27/2026&utm_id=502493&sfmc_id=116255438';

function getArabicCpcUrl() {
  return (process.env.GV_CPC_ARABIC_URL || DEFAULT_ARABIC_URL).trim();
}

module.exports = { DEFAULT_ARABIC_URL, getArabicCpcUrl };
