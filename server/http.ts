import "server-only";

/** An error with an HTTP status, thrown by services/controllers and turned into JSON by `handle`. */
export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: Record<string, string>
  ) {
    super(message);
  }
}

export const badRequest = (message: string, details?: Record<string, string>) =>
  new HttpError(400, message, details);
export const unauthorized = (message = "Please sign in.") => new HttpError(401, message);
export const forbidden = (message = "You don't have access to this.") => new HttpError(403, message);
export const notFound = (message = "Not found.") => new HttpError(404, message);
export const validationError = (errors: Record<string, string>) =>
  new HttpError(422, "Please fix the highlighted fields.", errors);

export function json<T>(data: T, init?: ResponseInit): Response {
  return Response.json(data, init);
}

/** Wraps a controller so thrown HttpErrors become JSON responses and anything else a 500. */
export function handle<Args extends unknown[]>(
  controller: (...args: Args) => Promise<Response>
): (...args: Args) => Promise<Response> {
  return async (...args) => {
    try {
      return await controller(...args);
    } catch (error) {
      if (error instanceof HttpError) {
        return json({ error: error.message, errors: error.details }, { status: error.status });
      }
      console.error(error);
      return json({ error: "Something went wrong. Please try again." }, { status: 500 });
    }
  };
}

export async function readJson(request: Request): Promise<Record<string, unknown>> {
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw badRequest("Expected a JSON object body.");
  }
  return body as Record<string, unknown>;
}
