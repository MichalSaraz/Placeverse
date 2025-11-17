import type { Database } from '~/types/supabase';

/**
 * Remove location by id with confirmation dialog and proper asset cleanup.
 * 
 * @param {string} id - Location id to delete
 * @param {string} title - Location title for confirmation dialog
 * @returns {Promise<{ success: boolean; error?: string }>} Result of deletion operation
 */
export const useLocationRemove = async (id: string, title: string): Promise<{ success: boolean; error?: string }> => {
    const confirmed = confirm(
      `Opravdu chcete odstranit lokaci "${title}"?\n\nAkci nelze vrátit zpět. Budou smazány i všechny související fotografie.`);

    if (!confirmed) {
        return { success: false };
    }

    try {
        const supabase = useSupabaseClient<Database>();
        const user = useSupabaseUser();
        
        if (!user.value) {
            return { success: false, error: 'Uživatel není přihlášen' };
        }

        const { error } = await supabase
            .from('location')
            .delete()
            .eq('id', id)
            .eq('user_id', user.value.id);

        if (error) {
            return { 
                success: false, 
                error: `Chyba při mazání lokality: ${error.message}` 
            };
        }

        return { success: true };

    } catch (error) {
        console.error('❌ Unexpected error during location deletion:', error);
        return { 
            success: false, 
            error: error instanceof Error ? error.message : 'Neočekávaná chyba při mazání lokality' 
        };
    }
}
