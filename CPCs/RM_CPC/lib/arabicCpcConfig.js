/** Default RM CPC Arabic QA Cloud Page URL (refresh qs= when expired). */
const DEFAULT_ARABIC_URL =
  'https://cloud.explore.realmadridworld.com/RMW_Arabic_CPC?qs=ABB7InYiOjEsImQiOjQ5NTF9ADMAAAAAAJnQ_lgq-qplNbvJrRA4Eyu63faY3Giezbwf8_dB9JxuD7xUGcRq9iIIbIJtNrDE8-oPsmblxiEYFknYpX93v9O3QkPkELw-j6dzFKJ3Bu-APCA6siyIeIpDbB6eQQwKKjv5QpFxBMZgJZYfGbc&utm_source=sfmc&utm_medium=email&utm_campaign=Sanity+Test+Email+AR&utm_term=%%%3dRedirectTo(CloudPagesURL(3445))%3d%%&utm_EmailName=Sanity+Test+Email+AR&Platform_Source=Real_Madrid&Date=7/28/2026&utm_id=503066&sfmc_id=116255438';

function getArabicCpcUrl() {
  return (process.env.RM_CPC_ARABIC_URL || DEFAULT_ARABIC_URL).trim();
}

module.exports = { DEFAULT_ARABIC_URL, getArabicCpcUrl };
