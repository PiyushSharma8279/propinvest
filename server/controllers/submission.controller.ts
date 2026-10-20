import "server-only";
import { after } from "next/server";
import { badRequest, handle, json, readJson } from "../http";
import { createLimiter } from "../rate-limit";
import { requireAdmin } from "../services/auth.service";
import * as submissionService from "../services/submission.service";
import { uploadFile, validateUpload } from "../services/upload.service";
import { validateReview, validateSubmissionInput } from "../validators/submission.validator";
import { clientIp } from "./lead.controller";

type IdContext = { params: Promise<{ id: string }> };

/** Hosts our uploads come back from; submitted photo URLs must be on one of these. */
export function imageHosts(): string[] {
  const hosts = ["ik.imagekit.io"];
  const endpoint = process.env.IMAGEKIT_URL_ENDPOINT ?? process.env.IMAGE_KIT_URL_ENDPOINT;
  if (endpoint) {
    try {
      hosts.push(new URL(endpoint).hostname);
    } catch {
      // ignore malformed endpoint
    }
  }
  return hosts;
}

const submissionLimit = createLimiter(3, 60 * 60 * 1000, "You've sent several properties already. Please try again in an hour or WhatsApp us.");
const uploadLimit = createLimiter(20, 60 * 60 * 1000, "Too many photo uploads. Please try again later.");

const PUBLIC_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

/** POST /api/submissions — public "List your property" form. Saved as pending; never published automatically. */
export const create = handle(async (request: Request) => {
  const input = validateSubmissionInput(await readJson(request), imageHosts());
  if (!input.isBot) submissionLimit(clientIp(request));
  const { id } = await submissionService.createSubmission(input);
  if (id) {
    after(() => submissionService.notifyNewSubmission(id).catch((e) => console.error("[notify] submission", e?.name)));
  }
  return json({ ok: true }, { status: 201 });
});

/** POST /api/submissions/upload — public, photos only (JPG / PNG / WebP, ≤ 4 MB), rate-limited per IP. */
export const upload = handle(async (request: Request) => {
  uploadLimit(clientIp(request));
  const form = await request.formData().catch(() => {
    throw badRequest("Send the photo as multipart/form-data.");
  });
  const file = validateUpload(form.get("file"));
  if (!PUBLIC_IMAGE_TYPES.includes(file.type)) throw badRequest("Only JPG, PNG or WebP photos are allowed.");
  const { url } = await uploadFile(file, "submissions");
  return json({ url }, { status: 201 });
});

/** POST /api/submissions/:id/review  { action, note } — admin. */
export const review = handle(async (request: Request, { params }: IdContext) => {
  const admin = await requireAdmin();
  const { action, note } = validateReview(await readJson(request));
  const result = await submissionService.reviewSubmission(Number((await params).id), action, note, admin.id);
  return json(result);
});
