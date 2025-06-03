/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  // you can add other env variables here
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}