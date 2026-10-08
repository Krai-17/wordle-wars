export function requestHeaders(key: string): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    apikey: key,
  };
  if (!key.startsWith("sb_publishable_")) {
    headers.Authorization = `Bearer ${key}`;
  }
  return headers;
}

export function roomRequestError(status: number, body: unknown): string {
  const error = body && typeof body === "object"
    ? body as { code?: unknown; message?: unknown }
    : {};
  if (error.code === "PGRST202") {
    return "Shared-room database functions are missing. Run the contents of supabase/schema.sql in this Supabase project's SQL Editor, then refresh its API schema cache.";
  }
  if (error.code === "42501") {
    return "Supabase denied access to the room functions. Check the function grants at the end of supabase/schema.sql.";
  }
  if (status === 401 || status === 403) {
    return `Supabase rejected the API credentials (HTTP ${status}). Check the project URL and public anon or publishable key in Vercel, then redeploy.`;
  }
  if (error.message === "Room not found") {
    return "This invite's room does not exist in the configured Supabase project. Use the original invite and check that all deployments use the same project.";
  }
  if (error.message === "Invalid room token") {
    return "The invite link is incomplete or invalid. Open the full private invite link.";
  }
  if (status === 409 || error.code === "23505") {
    return "A duel already exists for this puzzle or date. Refresh the scores and edit that duel instead.";
  }
  return `Room request failed (HTTP ${status}${typeof error.code === "string" && /^[A-Z0-9]{5,12}$/.test(error.code) ? `, ${error.code}` : ""}). Check Supabase's API logs for the underlying error; do not share room tokens or API keys.`;
}