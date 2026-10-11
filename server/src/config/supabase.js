import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function supabaseConnection() {
  try {
    const { error, count } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true });

    if (error) {
      console.error("Connection failed:", error.message);
      return { success: false, error: error.message };
    }

    console.log(
      "Connected to Supabase successfully! Table is reachable. Total rows:",
      count,
    );
    return { success: true, count };
  } catch (err) {
    console.error("Unexpected error:", err);
    return { success: false, error: "An unexpected error occurred" };
  }
}

await supabaseConnection();
