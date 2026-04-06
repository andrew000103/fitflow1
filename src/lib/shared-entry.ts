export type SharedEntryTarget = 'level-test';

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.replace(/\/+$/, '');
}

export function getSharedLevelTestUrl(): string | null {
  const configuredWebUrl = process.env.EXPO_PUBLIC_WEB_URL?.trim();

  if (configuredWebUrl) {
    return `${normalizeBaseUrl(configuredWebUrl)}/shared/level-test`;
  }

  if (typeof window !== 'undefined' && window.location?.origin) {
    return `${normalizeBaseUrl(window.location.origin)}/shared/level-test`;
  }

  return null;
}

export function parseSharedEntryUrl(url: string | null | undefined): SharedEntryTarget | null {
  if (!url) return null;

  try {
    const parsed = new URL(url);
    const normalizedPath = parsed.pathname.replace(/\/+$/, '');
    const entry = parsed.searchParams.get('entry');

    if (entry === 'shared-level-test' || entry === 'level-test') {
      return 'level-test';
    }

    if (normalizedPath === '/shared/level-test' || normalizedPath.endsWith('/shared/level-test')) {
      return 'level-test';
    }

    return null;
  } catch {
    return null;
  }
}
