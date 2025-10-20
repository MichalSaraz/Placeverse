/**
 * Returns the icon and title for a given resource key.
 * @param key - The resource key (e.g., 'web', 'facebook', 'instagram', 'youtube', 'location', 'visited', 'map').
 * @returns An object containing the icon and title, or null if the key is not recognized.
 */
export function getResourceIconAndTitle(key: string) : { icon: string; title: string } | null {
    const mapping: Map<string, { icon: string; title: string }> = new Map([
    ['web', { icon: 'i-heroicons-globe-alt', title: 'Webová stránka' }],
    ['facebook', { icon: 'i-simple-icons-facebook', title: 'Facebook' }],
    ['instagram', { icon: 'i-simple-icons-instagram', title: 'Instagram' }],
    ['youtube', { icon: 'i-simple-icons-youtube', title: 'YouTube' }],
    ['location', { icon: 'i-heroicons-map-pin', title: 'Lokace' }],
    ['visited', { icon: 'i-heroicons-check-circle', title: 'Navštíveno' }],
    ['map', { icon: 'i-heroicons-map', title: 'Mapa' }],
  ]);
    
  return mapping.get(key) || null;
}
