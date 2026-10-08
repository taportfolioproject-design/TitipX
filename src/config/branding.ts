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

export function getBranding(): BrandingConfig {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return { ...defaultBranding, ...JSON.parse(stored) };
      }
    } catch {
      // ignore
    }
  }
  return defaultBranding;
}

export function saveBranding(config: Partial<BrandingConfig>): BrandingConfig {
  const current = getBranding();
  const updated = { ...current, ...config };
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }
  return updated;
}
