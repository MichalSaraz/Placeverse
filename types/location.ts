/**
 * Represents a location entity retrieved from the database.
 */
export type LocationFromDB = {
  id: string;
  name: string;
  location: string;
  category_id: string;
  map_url: string | null;
  web_url: string | null;
  instagram_url: string | null;
  facebook_url: string | null;
  youtube_url: string | null;
  visited: boolean;
  categories: { name: string } | null;
  photos: Array<{ photo_url: string; is_main: boolean | null }> | null;
};

/**
 * Represents a processed location entity with additional derived properties.
 */
export type ProcessedLocation = Omit<LocationFromDB, 'photos'> & {
  category_name: string;
  main_photo_url: string | null;
  photos?: Array<{ photo_url: string; is_main: boolean }>;
};

/**
 * Represents a row in the table with methods to access values.
 */
export type TableRow = {
  getValue: (key: string) => unknown;
  original: ProcessedLocation;
};
