// Domain detection and configuration for multi-domain setup

export type SupportedDomain = 'thelegendofhendo' | 'nebulaclouds' | 'localhost';

export interface DomainConfig {
  name: string;
  displayName: string;
  primaryColor: string;
  logo: string;
  theme: 'hendo' | 'nebula';
}

export const DOMAIN_CONFIGS: Record<SupportedDomain, DomainConfig> = {
  thelegendofhendo: {
    name: 'thelegendofhendo',
    displayName: 'The Legend of Hendo',
    primaryColor: '#FF6B6B',
    logo: '/images/hendo-logo.png',
    theme: 'hendo'
  },
  nebulaclouds: {
    name: 'nebulaclouds',
    displayName: 'Nebula Clouds',
    primaryColor: '#4ECDC4',
    logo: '/images/nebula-logo.png',
    theme: 'nebula'
  },
  localhost: {
    name: 'localhost',
    displayName: 'Development',
    primaryColor: '#9B59B6',
    logo: '/images/dev-logo.png',
    theme: 'hendo'
  }
};

export function getCurrentDomain(): SupportedDomain {
  if (typeof window === 'undefined') {
    return 'thelegendofhendo'; // default for SSR
  }

  const hostname = window.location.hostname;

  if (hostname.includes('thelegendofhendo')) {
    return 'thelegendofhendo';
  } else if (hostname.includes('nebulaclouds')) {
    return 'nebulaclouds';
  } else if (hostname.includes('localhost')) {
    return 'localhost';
  }

  return 'thelegendofhendo'; // default fallback
}

export function getDomainConfig(): DomainConfig {
  const domain = getCurrentDomain();
  return DOMAIN_CONFIGS[domain];
}

export function isHendoDomain(): boolean {
  return getCurrentDomain() === 'thelegendofhendo';
}

export function isNebulaDomain(): boolean {
  return getCurrentDomain() === 'nebulaclouds';
}

export function isDevelopment(): boolean {
  return getCurrentDomain() === 'localhost';
}

