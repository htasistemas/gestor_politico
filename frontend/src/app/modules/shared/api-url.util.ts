const DEV_API_URL = 'http://localhost:8080/api';
const DEV_SERVER_PORT = '4200';

let cachedBaseUrl: string | null = null;

function resolveBaseUrl(): string {
  if (cachedBaseUrl) {
    return cachedBaseUrl;
  }

  if (typeof window === 'undefined') {
    cachedBaseUrl = DEV_API_URL;
    return cachedBaseUrl;
  }

  const { hostname, port, origin } = window.location;
  if ((hostname === 'localhost' || hostname === '127.0.0.1') && port === DEV_SERVER_PORT) {
    cachedBaseUrl = DEV_API_URL;
    return cachedBaseUrl;
  }

  cachedBaseUrl = `${origin}/api`;
  return cachedBaseUrl;
}

export function buildApiUrl(path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${resolveBaseUrl()}${normalizedPath}`;
}
