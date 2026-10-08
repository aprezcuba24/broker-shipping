/// <reference types="vite/client" />
/// <reference types="chrome" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string
  readonly VITE_SELLER_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
