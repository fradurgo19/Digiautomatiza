/// <reference types="vite/client" />

interface ImportMetaEnv {
  // WhatsApp - Twilio
  readonly VITE_TWILIO_ACCOUNT_SID?: string
  readonly VITE_TWILIO_AUTH_TOKEN?: string
  readonly VITE_TWILIO_WHATSAPP_NUMBER?: string
  
  // WhatsApp - Meta
  readonly VITE_META_ACCESS_TOKEN?: string
  readonly VITE_META_PHONE_NUMBER_ID?: string
  
  // Backend
  readonly VITE_BACKEND_URL?: string
  
  // Supabase
  readonly VITE_SUPABASE_URL?: string
  readonly VITE_SUPABASE_ANON_KEY?: string
  
  // Email
  readonly VITE_SENDGRID_API_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
