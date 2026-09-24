import "server-only";
import { revalidatePath } from "next/cache";

/** Refreshes every statically generated public page (home, about, sitemap…) after a listing changes. */
export function revalidatePublicPages(): void {
  revalidatePath("/", "layout");
}
