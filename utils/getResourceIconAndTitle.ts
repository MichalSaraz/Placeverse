/**
 * Returns the icon and title for a given resource key.
 * @param key - The resource key (e.g., 'web', 'facebook', 'instagram', 'youtube', 'location', 'visited', 'map').
 * @returns An object containing the icon and title, or null if the key is not recognized.
 */
export function getResourceIconAndTitle(key: string) : { icon: string; title: string } | null {
    const mapping: Map<string, { icon: string; title: string }> = new Map([
    ['web', { icon: 'i-lucide-globe', title: 'Webová stránka' }],
    ['facebook', { icon: 'i-lucide-facebook', title: 'Facebook' }],
    ['instagram', { icon: 'i-lucide-instagram', title: 'Instagram' }],
    ['youtube', { icon: 'i-lucide-youtube', title: 'YouTube' }],
    ['location', { icon: 'i-lucide-pin', title: 'Lokace' }],
    ['visited', { icon: 'i-lucide-check-circle', title: 'Navštíveno' }],
    ['map', { icon: 'i-lucide-map', title: 'Mapa' }],
  ]);
    
  return mapping.get(key) || null;
}
