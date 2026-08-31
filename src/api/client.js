// Uses whatever host the page itself was loaded from (localhost, or a LAN
// IP when accessed from another device), so this works without editing it
// every time you're on a different network.
export const API_BASE_URL = `http://${window.location.hostname}:8000`
