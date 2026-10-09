import defaultBranding from './branding.json';

export interface BrandingConfig {
  storeName: string;
  tagline: string;
  logoUrl: string;
  colors: {
    primary: string;
    primaryHover: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    mutedText: string;
    border: string;
  };
  contact: {
    whatsappAdmin: string;
    whatsappDisplay: string;
    instagram: string;
    email: string;
  };
  payment: {
    bankName: string;
    accountNumber: string;
    accountHolder: string;
    qrisImageUrl: string;
    acceptedMethods: {
      id: string;
      name: string;
      badge: string;
      instructions: string;
    }[];
  };
  appsScriptUrl: string;
  adminPassword?: string;
}

const STORAGE_KEY = 'titipx_branding_config';
const LOCKED_URL_KEY = 'titipx_locked_apps_script_url';

export function getBranding(): BrandingConfig {
  const envUrl = (import.meta.env.VITE_APPS_SCRIPT_URL as string) || '';
  const defaultUrl = defaultBranding.appsScriptUrl || envUrl || '';

  let config: BrandingConfig = {
    ...defaultBranding,
    appsScriptUrl: defaultUrl,
  };

  if (typeof window !== 'undefined') {
    let resolvedUrl = defaultUrl;

    // 1. Check persistent locked URL key
    try {
      const storedLocked = localStorage.getItem(LOCKED_URL_KEY);
      if (storedLocked && storedLocked.startsWith('http')) {
        resolvedUrl = storedLocked;
      }
    } catch {
      // ignore
    }

    // 2. Check localStorage config
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        config = {
          ...config,
          ...parsed,
        };
        if (parsed.appsScriptUrl && parsed.appsScriptUrl.startsWith('http')) {
          resolvedUrl = parsed.appsScriptUrl;
        }
      }
    } catch {
      // ignore
    }

    // 3. Check if URL parameter ?api= or ?appsScriptUrl= is passed in link (auto-locks for shared links)
    // Query parameter has HIGHEST precedence because it's explicitly shared with auto-lock!
    try {
      const searchParams = new URLSearchParams(window.location.search);
      const queryApi = searchParams.get('api') || searchParams.get('appsScriptUrl');
      if (queryApi && queryApi.startsWith('http')) {
        resolvedUrl = queryApi;
        localStorage.setItem(LOCKED_URL_KEY, queryApi);
        const stored = localStorage.getItem(STORAGE_KEY);
        const parsed = stored ? JSON.parse(stored) : {};
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ ...defaultBranding, ...parsed, appsScriptUrl: queryApi })
        );
      }
    } catch {
      // ignore
    }

    config.appsScriptUrl = resolvedUrl;
  }

  return config;
}

export function saveBranding(config: Partial<BrandingConfig>): BrandingConfig {
  const current = getBranding();
  const updated = { ...current, ...config };
  if (typeof window !== 'undefined') {
    if (updated.appsScriptUrl && updated.appsScriptUrl.startsWith('http')) {
      localStorage.setItem(LOCKED_URL_KEY, updated.appsScriptUrl);
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }
  return updated;
}
