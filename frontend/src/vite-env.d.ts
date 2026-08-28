/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ENABLE_RECENT_RACES?: string
  readonly VITE_RECENT_RACES_SNAPSHOT_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
