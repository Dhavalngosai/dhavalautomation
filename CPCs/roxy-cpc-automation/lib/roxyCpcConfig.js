const DEFAULT_URL =
  'https://cloud.explore.theroxycinemas.com/CPC_Roxy?qs=ABB7InYiOjEsImQiOjQ5MzZ9ADMAAAAAAIO7DS2Suy7aTA_RfIT1Qi9hyeeNZifMybD5ffD53nsTEPnjktQq3yBehQNXSbQDlGpcZRE6woL91qlqsPBjXQGzZnCiwI-sektfZTFB9u4rMQvETV7c66iPyu6s-9s#interests';

function getRoxyCpcUrl() {
  return (process.env.ROXY_CPC_URL || DEFAULT_URL).trim();
}

module.exports = { DEFAULT_URL, getRoxyCpcUrl };
