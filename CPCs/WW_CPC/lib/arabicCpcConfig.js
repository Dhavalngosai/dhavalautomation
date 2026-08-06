/** Default WW CPC Arabic QA Cloud Page URL (refresh qs= when expired). */
const DEFAULT_ARABIC_URL =
  'https://cloud.explore.wildwadi.com/CPC_WW_AR?qs=ABB7InYiOjEsImQiOjQ5NTB9ADMAAAAAAJhyQ4sC6bP3TvKszHfROnNb73CRRZByd5CBphdv5aij6u6EYmC2QOx7bG-pxaN71Rbo0KG3bIvn49PtmvjkAM5d8JWDpPgStwvHuziiRRqlRzsJ5bN59ChFCtW3Y3Wdvn70gMWyaQltQPaJeZg&utm_source=sfmc&utm_medium=email&utm_campaign=Sanity+Test+Email+-+AR&utm_term=%%%3dRedirectTo(CloudPagesURL(3799))%3d%%&utm_EmailName=Sanity+Test+Email+-+AR&Platform_Source=WW&Date=7/27/2026&utm_id=502808&sfmc_id=116255438';

function getArabicCpcUrl() {
  return (process.env.WW_CPC_ARABIC_URL || DEFAULT_ARABIC_URL).trim();
}

module.exports = { DEFAULT_ARABIC_URL, getArabicCpcUrl };
