import { supabase } from "../config/supabase.js";
import { AppError } from "../utils/AppError.js";
import { logger } from "../utils/logger.js";

const TABLE = "users";
const PUBLIC_COLUMNS = "id, userId, email, role, firstName, lastName, isActive";

/**
 * Maps PostgREST / Postgres errors to AppError. Never returns the raw driver error.
 * @param {object|null|undefined} error
 * @param {{ notFound?: boolean, notFoundMessage?: string }} [opts]
 */
export function throwIfSupabaseError(error, { notFound = false, notFoundMessage = "User not found" } = {}) {
  if (!error) return;

  if (error.code === "PGRST116" || notFound) {
    throw new AppError(notFoundMessage, 404);
  }

  if (error.code === "23505") {
    const text = `${error.message || ""} ${error.details || ""} ${error.hint || ""}`;
    if (/email/i.test(text)) {
      throw new AppError("Email already in use", 409);
    }
    throw new AppError("User already exists", 409);
  }

  logger.error(error);
  throw new AppError("Internal server error", 500);
}

function firstRow(data) {
  if (!data) return null;
  return Array.isArray(data) ? data[0] ?? null : data;
}

export async function findByUserId(userId, { includePassword = false } = {}) {
  const columns = includePassword ? `${PUBLIC_COLUMNS}, password` : PUBLIC_COLUMNS;
  const { data, error } = await supabase
    .from(TABLE)
    .select(columns)
    .eq("userId", userId)
    .maybeSingle();
  throwIfSupabaseError(error);
  return data;
}

export async function findById(id, { includePassword = false } = {}) {
  const columns = includePassword ? `${PUBLIC_COLUMNS}, password` : PUBLIC_COLUMNS;
  const { data, error } = await supabase.from(TABLE).select(columns).eq("id", id).maybeSingle();
  throwIfSupabaseError(error);
  return data;
}

export async function list() {
  const { data, error } = await supabase.from(TABLE).select(PUBLIC_COLUMNS);
  throwIfSupabaseError(error);
  return data || [];
}

export async function insert(payload) {
  const { data, error } = await supabase.from(TABLE).insert(payload).select(PUBLIC_COLUMNS);
  throwIfSupabaseError(error);
  const row = firstRow(data);
  if (!row) throw new AppError("Internal server error", 500);
  return row;
}

export async function updateByUserId(userId, payload) {
  const { data, error } = await supabase
    .from(TABLE)
    .update(payload)
    .eq("userId", userId)
    .select(PUBLIC_COLUMNS);
  throwIfSupabaseError(error);
  const row = firstRow(data);
  if (!row) throw new AppError("User not found", 404);
  return row;
}

export async function updateById(id, payload) {
  const { data, error } = await supabase
    .from(TABLE)
    .update(payload)
    .eq("id", id)
    .select(PUBLIC_COLUMNS);
  throwIfSupabaseError(error);
  const row = firstRow(data);
  if (!row) throw new AppError("User not found", 404);
  return row;
}
