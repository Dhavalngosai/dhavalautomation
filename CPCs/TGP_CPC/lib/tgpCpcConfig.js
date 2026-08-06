/** Default TGP Live CPC English Cloud Page URL (refresh qs= when expired). */
const DEFAULT_URL =
  'https://cloud.explore.thegreenplanetdubai.com/CPC_TGP?qs=ABB7InYiOjEsImQiOjQ5Mzd9ADMAAAAAAIYL096FCn0w5steArNJi-I8UvW2jsT6hNWQJTGc1ky8fk6pD7rp_RAcuE340z98fuwgJBgMmSYadBbCDZksdf1aE2tlaqYli0tfJRkLnTgn9Puql82jWzVH0GnZAiIdEgn_SLMkCOumW5jTZgI&utm_source=sfmc&utm_medium=email&utm_campaign=Sanity+Test+Email&utm_term=%%%3dRedirectTo(CloudPagesURL(2754))%3d%%&utm_EmailName=Sanity+Test+Email&Platform_Source=TGP&Date=7/14/2026&utm_id=499177&sfmc_id=116255438';

function getTgpCpcUrl() {
  return (process.env.TGP_CPC_URL || DEFAULT_URL).trim();
}

module.exports = { DEFAULT_URL, getTgpCpcUrl };
