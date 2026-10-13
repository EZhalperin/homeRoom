import { supabase } from "../config/supabase.js";
import { AppError } from "../utils/AppError.js";
import { logger } from "../utils/logger.js";

const TABLE = "users";
const PUBLIC_COLUMNS = "id, userId, email, role, firstName, lastName, isActive, passwordSet";

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

export async function findByEmail(email, { includePassword = false } = {}) {
  const columns = includePassword ? `${PUBLIC_COLUMNS}, password` : PUBLIC_COLUMNS;
  const { data, error } = await supabase
    .from(TABLE)
    .select(columns)
    .ilike("email", email.trim())
    .maybeSingle();
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
export async function findManyByUserIds(userIds) {
  if (!Array.isArray(userIds) || userIds.length === 0) return [];
  const unique = Array.from(new Set(userIds.filter(Boolean)));
  if (unique.length === 0) return [];
  const { data, error } = await supabase
    .from(TABLE)
    .select("userId, firstName, lastName")
    .in("userId", unique);
  throwIfSupabaseError(error);
  return data || [];
}
export async function countUserStats() {
  const [adminRes, teacherRes, parentRes, activeRes, suspendedRes] = await Promise.all([
    supabase.from(TABLE).select("*", { count: "exact", head: true }).eq("role", "admin"),
    supabase.from(TABLE).select("*", { count: "exact", head: true }).eq("role", "teacher"),
    supabase.from(TABLE).select("*", { count: "exact", head: true }).eq("role", "parent"),
    supabase.from(TABLE).select("*", { count: "exact", head: true }).eq("isActive", true),
    supabase.from(TABLE).select("*", { count: "exact", head: true }).eq("isActive", false),
  ]);

  if (adminRes.error) throwIfSupabaseError(adminRes.error);
  if (teacherRes.error) throwIfSupabaseError(teacherRes.error);
  if (parentRes.error) throwIfSupabaseError(parentRes.error);
  if (activeRes.error) throwIfSupabaseError(activeRes.error);
  if (suspendedRes.error) throwIfSupabaseError(suspendedRes.error);

  return {
    admin: adminRes.count || 0,
    teacher: teacherRes.count || 0,
    parent: parentRes.count || 0,
    active: activeRes.count || 0,
    suspended: suspendedRes.count || 0,
  };
}

export async function countAudienceStats() {
  const [parentRes, studentRes] = await Promise.all([
    supabase.from(TABLE).select("*", { count: "exact", head: true }).eq("role", "parent"),
    supabase.from(TABLE).select("*", { count: "exact", head: true }).eq("role", "student"),
  ]);

  if (parentRes.error) throwIfSupabaseError(parentRes.error);
  if (studentRes.error) throwIfSupabaseError(studentRes.error);

  return {
    parentsCount: parentRes.count || 0,
    studentsCount: studentRes.count || 0,
  };
}