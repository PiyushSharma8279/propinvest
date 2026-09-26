"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ExternalLink, Eye, EyeOff, Loader2, Pencil, RotateCcw, Star, Trash2 } from "lucide-react";
import { api, ApiError } from "@/lib/api-client";
import type { Property } from "@/lib/types";
import { cn } from "@/lib/utils/cn";

type Action = "active" | "featured" | "delete" | "restore";

const actionClass =
  "inline-flex items-center gap-1 whitespace-nowrap rounded-control px-2 py-1.5 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50";

function ActionButton({
  label,
  title,
  icon,
  onClick,
  loading,
  className,
}: {
  label: string;
  title: string;
  icon: React.ReactNode;
  onClick: () => void;
  loading?: boolean;
  className?: string;
}) {
  return (
    <button type="button" onClick={onClick} disabled={loading} title={title} className={cn(actionClass, className)}>
      {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : icon}
      {label}
    </button>
  );
}

/** View / edit links plus toggle active / featured, soft delete and restore — all via the properties API. */
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
      <div className="flex justify-end">
        <ActionButton
          label="Restore"
          title="Restore this property"
          icon={<RotateCcw className="h-3.5 w-3.5" />}
          loading={busy === "restore"}
          onClick={() => run("restore")}
          className="border border-border bg-surface text-ink hover:border-primary hover:text-primary"
        />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-end gap-0.5">
      {property.isActive && (
        <Link
          href={`/projects/${property.slug}`}
          target="_blank"
          title="View on website"
          className={cn(actionClass, "text-muted hover:bg-surface-muted hover:text-ink")}
        >
          <ExternalLink className="h-3.5 w-3.5" /> View
        </Link>
      )}
      <Link
        href={`/admin/properties/${property.id}/edit`}
        title="Edit property"
        className={cn(actionClass, "text-primary hover:bg-primary-soft")}
      >
        <Pencil className="h-3.5 w-3.5" /> Edit
      </Link>
      <ActionButton
        label={property.isActive ? "Deactivate" : "Activate"}
        title={property.isActive ? "Hide from website" : "Show on website"}
        icon={property.isActive ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
        loading={busy === "active"}
        onClick={() => run("active")}
        className="text-muted hover:bg-surface-muted hover:text-ink"
      />
      <ActionButton
        label={property.isFeatured ? "Unfeature" : "Feature"}
        title={property.isFeatured ? "Remove from homepage" : "Feature on homepage"}
        icon={<Star className="h-3.5 w-3.5" fill={property.isFeatured ? "currentColor" : "none"} />}
        loading={busy === "featured"}
        onClick={() => run("featured")}
        className={cn(
          "hover:bg-highlight-soft",
          property.isFeatured ? "text-highlight" : "text-muted hover:text-ink"
        )}
      />
      <ActionButton
        label="Delete"
        title="Delete (can be restored later)"
        icon={<Trash2 className="h-3.5 w-3.5" />}
        loading={busy === "delete"}
        onClick={() => run("delete")}
        className="text-danger hover:bg-danger-soft"
      />
    </div>
  );
}
