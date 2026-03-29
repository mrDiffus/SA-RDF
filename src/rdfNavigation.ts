export type AppTab = 'home' | 'rules' | 'races' | 'archetypes' | 'spells' | 'equipment' | 'general-features' | 'lore';

export type AppRoute = {
  tab: AppTab;
  resourceId?: string;
};

export type ParsedBrowserRoute = {
  collectionTab: AppTab | null;
  resourceId: string | null;
};

const collectionPaths: Record<AppTab, string> = {
  home: '/',
  rules: '/rules',
  races: '/races',
  archetypes: '/archetypes',
  spells: '/spells',
  equipment: '/equipment',
  'general-features': '/general-features',
  lore: '/lore'
};

export function getCollectionHref(tab: AppTab): string {
  return collectionPaths[tab];
}

export function getCollectionTab(pathname: string): AppTab | null {
  const normalizedPath = pathname || '/';
  return (
    (Object.entries(collectionPaths).find(([, path]) => path === normalizedPath)?.[0] as AppTab | undefined) ?? null
  );
}

export function curieToRelativeIri(resourceId: string): string | null {
  if (resourceId.startsWith('spell:')) {
    return `/spell#${encodeURIComponent(resourceId.slice('spell:'.length))}`;
  }

  if (resourceId.startsWith('equipment:')) {
    return `/equipment/${encodeURIComponent(resourceId.slice('equipment:'.length))}`;
  }

  if (resourceId.startsWith('archetype:')) {
    return `/archetype/${encodeURIComponent(resourceId.slice('archetype:'.length))}`;
  }

  if (resourceId.startsWith('sa:')) {
    return `/${encodeURI(resourceId.slice('sa:'.length))}`;
  }

  return null;
}

export function relativeIriToCurie(relativeIri: string): string | null {
  if (!relativeIri || relativeIri === '/') {
    return null;
  }

  if (relativeIri.startsWith('/spell#')) {
    return `spell:${decodeURIComponent(relativeIri.slice('/spell#'.length))}`;
  }

  if (relativeIri.startsWith('/equipment#')) {
    return `equipment:${decodeURIComponent(relativeIri.slice('/equipment#'.length))}`;
  }

  if (relativeIri.startsWith('/equipment/')) {
    return `equipment:${decodeURIComponent(relativeIri.slice('/equipment/'.length))}`;
  }

  if (relativeIri.startsWith('/archetype/')) {
    return `archetype:${decodeURIComponent(relativeIri.slice('/archetype/'.length))}`;
  }

  return `sa:${decodeURI(relativeIri.slice(1))}`;
}

export function getCurrentRelativeIri(location: Location): string {
  return `${location.pathname}${location.hash}`;
}

export function parseBrowserRoute(pathname: string, hash = ''): ParsedBrowserRoute {
  const collectionTab = getCollectionTab(pathname);

  if (pathname.startsWith('/equipment/') && pathname.length > '/equipment/'.length) {
    return {
      collectionTab: 'equipment',
      resourceId: relativeIriToCurie(pathname)
    };
  }

  if (collectionTab && !hash) {
    return { collectionTab, resourceId: null };
  }

  return {
    collectionTab,
    resourceId: relativeIriToCurie(`${pathname}${hash}`)
  };
}