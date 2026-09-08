// API base URL.
//
// Production builds pick up VITE_API_BASE_URL (see .env.production, or an env
// var set in the hosting platform) and point at the live backend.
//
// In local dev there's no env file, so we fall back to whatever host the page
// was loaded from on port 8000 — that keeps working when you hit the dev
// server from another device (phone, LAN IP) without editing anything.
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || `http://${window.location.hostname}:8000`
