// Thrown when a dish cannot be deleted because a meal in the history points to it
export class DishInUseError extends Error {}

// An AI Edge Function refused: the hourly cap for this user is reached
export class RateLimitedError extends Error {}

// The Edge Functions answer errors as { error: "<code>" } (server_config, upstream,
// invalid_input…): put that code in the log line instead of a bare "FunctionsHttpError".
export const functionErrorCode = async (error: unknown): Promise<string> => {
  if (!error) return "empty"
  const context = (error as { context?: Response }).context
  if (context instanceof Response) {
    const body = (await context.clone().json().catch(() => null)) as { error?: unknown } | null
    if (typeof body?.error === "string") return `${context.status} ${body.error}`
    return String(context.status)
  }
  return error instanceof Error ? error.name : "unknown"
}

// A pasted link couldn't be imported: the page was unreachable, or it has no recipe in it
export class RecipeImportError extends Error {
  readonly reason: "unreachable" | "no_recipe"
  constructor(reason: "unreachable" | "no_recipe") {
    super(reason)
    this.reason = reason
  }
}
