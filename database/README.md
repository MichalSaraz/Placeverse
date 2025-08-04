# Database Scripts

This folder contains SQL scripts for database management.

## Files:

### `cascade_delete_photos.sql`

Triggers for automatic deletion of photos from Supabase Storage when deleting a location or photo.

**Installation:**

1. Open Supabase Dashboard → SQL Editor
2. Copy and execute the entire file content
3. Verify installation using:

```sql
SELECT trigger_name, event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND trigger_name LIKE '%delete%photo%';
```

**Functions:**

- `trigger_delete_location_photos` - deletes all photos when a location is deleted
- `trigger_delete_photo_file` - deletes individual photo from storage when deleted from photos table
