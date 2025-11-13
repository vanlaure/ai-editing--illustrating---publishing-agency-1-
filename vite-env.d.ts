/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GEMINI_API_KEY: string
  readonly VITE_WS_ENDPOINT?: string
  readonly VITE_ANALYTICS_ENDPOINT?: string
  readonly VITE_STUDIO_ID?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}