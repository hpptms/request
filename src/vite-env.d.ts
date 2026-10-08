/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_AMAZON_TAG?: string;
  readonly VITE_RAKUTEN_AFFILIATE_ID?: string;
  readonly VITE_GA_MEASUREMENT_ID?: string;
  readonly VITE_ADSENSE_CLIENT?: string;
  readonly VITE_X_HANDLE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
