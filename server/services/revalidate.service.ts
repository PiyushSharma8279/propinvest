import "server-only";
import { revalidatePath, revalidateTag } from "next/cache";
import { PUBLIC_PROPERTIES_TAG } from "./property.service";

/**
 * Called after any listing is created, edited, hidden, featured, deleted or restored.
 * Expires the cached public data right away and rebuilds every pre-rendered public page
 * (home, property pages, sitemap…) on its next visit, so the website never shows stale data.
 */
export function revalidatePublicPages(): void {
  revalidateTag(PUBLIC_PROPERTIES_TAG, { expire: 0 });
  revalidatePath("/", "layout");
}
