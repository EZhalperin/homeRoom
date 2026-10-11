import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function testSupabaseConnection() {
  try {
    const { data, error } = await supabase.from("users").select("*").limit(1);

    if (error) {
      console.error("Connection failed:", error.message);
      return { success: false, error: error.message };
    }

    console.log("Connected to Supabase successfully!", data);
    return { success: true, data };
  } catch (err) {
    console.error("Unexpected error:", err);
    return { success: false, error: "An unexpected error occurred" };
  }
}

await testSupabaseConnection();
