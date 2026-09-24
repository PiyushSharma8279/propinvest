import "server-only";
import { badRequest, handle, json } from "../http";
import { requireAdmin } from "../services/auth.service";
import { uploadFile, validateUpload } from "../services/upload.service";

/**
 * POST /api/upload — admin. multipart/form-data with `file` (and optional `folder`).
 * Returns { url, fileId, name, thumbnailUrl, width, height }.
 */
export const upload = handle(async (request: Request) => {
  await requireAdmin();
  const form = await request.formData().catch(() => {
    throw badRequest("Send the file as multipart/form-data.");
  });
  const file = validateUpload(form.get("file"));
  const folder = typeof form.get("folder") === "string" ? String(form.get("folder")) : undefined;
  return json(await uploadFile(file, folder), { status: 201 });
});
