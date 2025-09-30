/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly VITE_SOCKET_URL: string
  readonly VITE_AUTH_SERVICE_URL: string
  readonly VITE_CUSTOMER_SERVICE_URL: string
  readonly VITE_ORDER_SERVICE_URL: string
  readonly VITE_MENU_SERVICE_URL: string
  readonly VITE_INVENTORY_SERVICE_URL: string
  readonly VITE_TABLE_SERVICE_URL: string
  readonly VITE_GROQ_API_KEY?: string
  readonly VITE_COHERE_API_KEY?: string
  readonly VITE_OPENAI_API_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
