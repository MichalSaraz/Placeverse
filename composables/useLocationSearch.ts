import type { Database } from '~/types/supabase';

interface SearchSuggestion {
  id: string;
  name: string;
  location: string;
  displayText: string;
  main_photo_url: string | null;
  informationType: 'name' | 'location';
}

/**
 * Composable for location search functionality. 
 */
export const useLocationSearch = () => {
  const client = useSupabaseClient<Database>();

  /**
   * Search for location suggestions based on query matching name or location.
   * 
   * @param {string} query - Search query string
   * @param {number} limit - Maximum number of results to return
   * @returns {Promise<SearchSuggestion[]>} List of search suggestions
   */
  const searchSuggestions = async (query: string, limit: number = 5): Promise<SearchSuggestion[]> => {
    if (!query || query.trim().length < 2) {
      return [];
    }

    try {
      const { data, error } = await client
        .from('location')
        .select(`
          id,
          name,
          location,
          photos(photo_url, is_main)
        `)
        .or(`name.ilike.%${query.trim()}%,location.ilike.%${query.trim()}%`)
        .limit(limit);

      if (error) {
        console.error('Supabase error:', error);
        return [];
      }

      if (!data) return [];

      const results: SearchSuggestion[] = [];
      const seenDisplayTexts = new Set<string>();

      data.forEach((item) => {
        const main_photo_url = item.photos?.find((p) => p.is_main)?.photo_url ?? null;

        // Add name-based result if name matches
        if (item.name.toLowerCase().includes(query.toLowerCase())) {
          const suggestion = {
            id: item.id,
            name: item.name,
            location: item.location,
            displayText: item.name,
            main_photo_url,
            informationType: 'name' as const,
          };
          
          if (!seenDisplayTexts.has(suggestion.displayText.toLowerCase())) {
            results.push(suggestion);
            seenDisplayTexts.add(suggestion.displayText.toLowerCase());
          }
        }

        // Add location-based result if location matches and different from name
        if (
          item.location.toLowerCase().includes(query.toLowerCase()) &&
          item.location.toLowerCase() !== item.name.toLowerCase()
        ) {
          const suggestion = {
            id: item.id,
            name: item.name,
            location: item.location,
            displayText: item.location,
            main_photo_url,
            informationType: 'location' as const,
          };
          
          if (!seenDisplayTexts.has(suggestion.displayText.toLowerCase())) {
            results.push(suggestion);
            seenDisplayTexts.add(suggestion.displayText.toLowerCase());
          }
        }
      });

      return results.slice(0, limit);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      return [];
    }
  };

  return {
    searchSuggestions,
  };
};
