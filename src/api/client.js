// API base URL.
//
// A production build always talks to the deployed backend over HTTPS. Override
// the URL at build time with VITE_API_BASE_URL (hosting platform env settings,
// or .env.production); otherwise it uses the known production host below.
//
// The http://<host>:8000 branch is dev-only: `import.meta.env.PROD` is a literal
// `false` there, so the whole branch is stripped from the production bundle by
// dead-code elimination and can never fire over HTTPS. In local dev it points at
// whatever host loaded the page, which keeps LAN access (phone, other devices)
// working without any config.
const PROD_API_BASE_URL = 'https://timepay-analytics.onrender.com'

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.PROD
    ? PROD_API_BASE_URL
    : `http://${window.location.hostname}:8000`)
