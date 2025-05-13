// src/lib/recipeChannel.ts
import { supabase } from '@/integrations/supabase/client';

export const getRecipeChannel = (recipeId: string) =>
    supabase.channel(`recipe:${recipeId}`);
