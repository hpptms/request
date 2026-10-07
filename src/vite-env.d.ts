/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_AMAZON_TAG?: string;
  readonly VITE_RAKUTEN_AFFILIATE_ID?: string;
  readonly VITE_GA_MEASUREMENT_ID?: string;
  readonly VITE_ADSENSE_CLIENT?: string;
  readonly VITE_ADS_ORIGIN?: string;
  readonly VITE_ADMAX_TAG_MOBILE_ANCHOR?: string;
  readonly VITE_ADMAX_TAG_PC_RAIL?: string;
  readonly VITE_ADMAX_TAG_PLAY_QUEUE?: string;
  readonly VITE_X_HANDLE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
