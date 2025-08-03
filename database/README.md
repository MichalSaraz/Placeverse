# Database Scripts

Tato složka obsahuje SQL skripty pro správu databáze.

## Soubory:

### `cascade_delete_photos.sql`

Triggery pro automatické mazání fotek ze Supabase Storage při smazání lokality nebo fotky.

**Instalace:**

1. Otevřít Supabase Dashboard → SQL Editor
2. Zkopírovat a spustit celý obsah souboru
3. Ověřit instalaci pomocí:

```sql
SELECT trigger_name, event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND trigger_name LIKE '%delete%photo%';
```

**Funkce:**

- `trigger_delete_location_photos` - maže všechny fotky při smazání lokality
- `trigger_delete_photo_file` - maže jednotlivou fotku ze storage při smazání z tabulky photos
