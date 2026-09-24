"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, RotateCcw, Star, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { api, ApiError } from "@/lib/api-client";
import type { Property } from "@/lib/types";

type Action = "active" | "featured" | "delete" | "restore";

/** Toggle active / featured, soft delete and restore — all via the properties API. */
export default function PropertyRowActions({ property }: { property: Property }) {
  const router = useRouter();
  const [busy, setBusy] = useState<Action | null>(null);

  async function run(action: Action) {
    if (
      action === "delete" &&
      !window.confirm(`Delete "${property.title}"? It will be hidden from the website. You can restore it from the Deleted tab.`)
    ) {
      return;
    }
    setBusy(action);
    try {
      const url = `/api/properties/${property.id}`;
      if (action === "active") {
        await api(`${url}/status`, { method: "PATCH", body: { isActive: !property.isActive } });
      } else if (action === "featured") {
        await api(`${url}/status`, { method: "PATCH", body: { isFeatured: !property.isFeatured } });
      } else if (action === "delete") {
        await api(url, { method: "DELETE" });
      } else {
        await api(`${url}/restore`, { method: "POST" });
      }
      router.refresh();
    } catch (err) {
      window.alert(err instanceof ApiError ? err.message : "Something went wrong.");
    } finally {
      setBusy(null);
    }
  }

  if (property.isDeleted) {
    return (
      <Button variant="outline" size="sm" loading={busy === "restore"} onClick={() => run("restore")}>
        {busy !== "restore" && <RotateCcw className="h-4 w-4" />} Restore
      </Button>
    );
  }

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        loading={busy === "active"}
        onClick={() => run("active")}
        title={property.isActive ? "Hide from website" : "Show on website"}
      >
        {busy !== "active" && (property.isActive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />)}
        {property.isActive ? "Deactivate" : "Activate"}
      </Button>
      <Button
        variant="ghost"
        size="sm"
        loading={busy === "featured"}
        onClick={() => run("featured")}
        className={property.isFeatured ? "text-gold-600" : undefined}
        title={property.isFeatured ? "Remove from homepage" : "Feature on homepage"}
      >
        {busy !== "featured" && <Star className="h-4 w-4" fill={property.isFeatured ? "currentColor" : "none"} />}
        {property.isFeatured ? "Unfeature" : "Feature"}
      </Button>
      <Button variant="danger" size="sm" loading={busy === "delete"} onClick={() => run("delete")}>
        {busy !== "delete" && <Trash2 className="h-4 w-4" />} Delete
      </Button>
    </>
  );
}
