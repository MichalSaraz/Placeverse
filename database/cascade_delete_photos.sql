-- =============================================================================
-- TRIGGER FOR AUTOMATIC DELETION OF PHOTOS FROM STORAGE WHEN DELETING A LOCATION
-- =============================================================================
-- 
-- INSTALLATION INSTRUCTIONS:
-- 1. Open Supabase SQL Editor
-- 2. Copy the content between /* */ and run as a SQL query
-- 3. Triggers will be active and automatically delete photos when a location is deleted
--
-- =============================================================================



-- 1. Create a function to delete photos from storage
CREATE OR REPLACE FUNCTION delete_location_photos
()
RETURNS TRIGGER AS $$
BEGIN
  -- Delete specific files from storage based on photo_url from the photos table
  DELETE FROM storage.objects 
  WHERE bucket_id = 'location-photos'
    AND name IN (
      SELECT REPLACE(photo_url, 'https://fwgvjbdkgmcxrtmkrcer.supabase.co/storage/v1/object/public/location-photos/', '')
    FROM photos
    WHERE location_id = OLD.id
    );

  -- Delete photo records from the photos table
  DELETE FROM photos WHERE location_id = OLD.id;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create a trigger on the location table
DROP TRIGGER IF EXISTS trigger_delete_location_photos
ON location;

CREATE TRIGGER trigger_delete_location_photos
  BEFORE
DELETE ON location
  FOR EACH
ROW
EXECUTE FUNCTION delete_location_photos
();

-- 3. Trigger to delete individual photo when removed from photos table
CREATE OR REPLACE FUNCTION delete_photo_file
()
RETURNS TRIGGER AS $$
BEGIN
  -- Delete file from storage based on photo_url
  DELETE FROM storage.objects 
  WHERE bucket_id = 'location-photos'
    AND name = REPLACE(OLD.photo_url, 'https://fwgvjbdkgmcxrtmkrcer.supabase.co/storage/v1/object/public/location-photos/', '');

  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_delete_photo_file
ON photos;

CREATE TRIGGER trigger_delete_photo_file
  BEFORE
DELETE ON photos
  FOR EACH
ROW
EXECUTE FUNCTION delete_photo_file
();

-- 4. If you need to manually cleanup existing orphaned photos
-- (Run only once for cleanup)
DELETE FROM storage.objects 
WHERE bucket_id = 'location-photos'
  AND name NOT IN (
    SELECT REPLACE(photo_url, 'https://fwgvjbdkgmcxrtmkrcer.supabase.co/storage/v1/object/public/location-photos/', '')
  FROM photos
  WHERE photo_url IS NOT NULL
  );
