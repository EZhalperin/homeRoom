import { supabase } from "../config/supabase.js";

export function createTableCrud(tableName) {
  return {
    getAll: async () => {
      const { data, error } = await supabase.from(tableName).select("*");
      if (error) throw error;
      return data;
    },

    getByUserId: async (userId) => {
      const { data, error } = await supabase
        .from(tableName)
        .select("*")
        .eq("userId", userId)
        .single();
      if (error) throw error;
      return data;
    },

    create: async (payload) => {
      const { data, error } = await supabase
        .from(tableName)
        .insert(payload)
        .select();
      if (error) throw error;
      return data;
    },

    update: async (userId, payload) => {
      const { data, error } = await supabase
        .from(tableName)
        .update(payload)
        .eq("userId", userId)
        .select();
      if (error) throw error;
      return data;
    },

    remove: async (userId) => {
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq("userId", userId);
      if (error) throw error;
      return true;
    },
  };
}
