/** Browser-side helpers for calling our own /api routes. */

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public errors: Record<string, string> = {}
  ) {
    super(message);
  }
}

async function parse<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(data.error ?? "Request failed.", res.status, data.errors ?? {});
  }
  return data as T;
}

export async function api<T>(
  url: string,
  options: { method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE"; body?: unknown } = {}
): Promise<T> {
  const res = await fetch(url, {
    method: options.method ?? "GET",
    headers: options.body !== undefined ? { "Content-Type": "application/json" } : undefined,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });
  return parse<T>(res);
}

export interface UploadResult {
  url: string;
  fileId: string;
  name: string;
  thumbnailUrl?: string;
}

export const MAX_UPLOAD_MB = 4;

/** Uploads one file through POST /api/upload (ImageKit) and returns its URL. */
export async function uploadFile(file: File, folder?: string): Promise<UploadResult> {
  if (file.size > MAX_UPLOAD_MB * 1024 * 1024) {
    throw new ApiError(`${file.name} is larger than ${MAX_UPLOAD_MB} MB.`, 400);
  }
  const body = new FormData();
  body.append("file", file);
  if (folder) body.append("folder", folder);
  const res = await fetch("/api/upload", { method: "POST", body });
  return parse<UploadResult>(res);
}
