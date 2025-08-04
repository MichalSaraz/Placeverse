/**
 * Map utilities for extracting coordinates from various map service URLs.
 * 
 * This module provides functionality to parse coordinates from popular
 * map services like mapy.cz, Google Maps, and other mapping platforms.
 */

/**
 * Coordinate object representing latitude and longitude values.
 */
export interface Coordinates {
  lat: number;
  lng: number;
}

/**
 * Extracts geographic coordinates from various map service URLs.
 * 
 * Supports multiple URL formats from different mapping services:
 * - mapy.cz: URLs with x= and y= parameters
 * - Google Maps: URLs with @lat,lng,zoom format
 * - Generic maps: URLs with q= or ll= parameters
 * 
 * @param url - The map URL to extract coordinates from
 * @returns Coordinate object with lat/lng properties, or null if extraction fails
 * 
 * @example
 * ```typescript
 * // mapy.cz URL
 * const coords1 = extractCoordinatesFromUrl('https://mapy.cz/zakladni?x=14.4378&y=50.0755');
 * // Result: { lat: 50.0755, lng: 14.4378 }
 * 
 * // Google Maps URL
 * const coords2 = extractCoordinatesFromUrl('https://maps.google.com/@50.0755,14.4378,15z');
 * // Result: { lat: 50.0755, lng: 14.4378 }
 * ```
 */
export function extractCoordinatesFromUrl(url: string): Coordinates | null {
  if (!url) return null;

  try {
    const patterns = [
      {
        regex: /[?&]x=(-?\d+\.?\d*)&y=(-?\d+\.?\d*)/,
        service: 'mapy.cz',
        format: 'x=lng, y=lat',
        reversed: true
      },
      {
        regex: /@(-?\d+\.?\d*),(-?\d+\.?\d*),(\d+\.?\d*)z/,
        service: 'Google Maps',
        format: '@lat,lng,zoom',
        reversed: false
      },
      {
        regex: /q=(-?\d+\.?\d*),(-?\d+\.?\d*)/,
        service: 'Generic',
        format: 'q=lat,lng',
        reversed: false
      },
      {
        regex: /ll=(-?\d+\.?\d*),(-?\d+\.?\d*)/,
        service: 'Generic',
        format: 'll=lat,lng',
        reversed: false
      }
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern.regex);
      
      if (match && match[1] && match[2]) {
        let lat: number, lng: number;

        if (pattern.reversed) {
          lng = parseFloat(match[1]);
          lat = parseFloat(match[2]);
        } else {
          lat = parseFloat(match[1]);
          lng = parseFloat(match[2]);
        }

        if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
          return { lat, lng };
        }
      }
    }

    return null;
  } catch (error) {
    if (import.meta.dev) {
      console.error('Error extracting coordinates from URL:', error);
    }
    return null;
  }
}
