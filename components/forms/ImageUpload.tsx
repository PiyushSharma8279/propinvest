"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ArrowLeft, ArrowRight, ImagePlus, Loader2, X } from "lucide-react";
import { MAX_UPLOAD_MB, uploadFile } from "@/lib/api-client";
import { cn } from "@/lib/utils/cn";

interface ImageUploadProps {
  /** Current image URLs, in order. */
  value: string[];
  onChange: (urls: string[]) => void;
  /** Allow more than one image (default true). With false, a new upload replaces the old one. */
  multiple?: boolean;
  /** Maximum number of images when `multiple` (default 20). */
  max?: number;
  /** ImageKit sub-folder, e.g. "properties" or "banners". */
  folder?: string;
  /** Show the "Cover" badge on the first image. */
  showCover?: boolean;
  error?: string;
  /** Lets a parent form disable "Save" while uploads are in flight. */
  onBusyChange?: (busy: boolean) => void;
  className?: string;
}

/**
 * Reusable image picker: uploads each file to POST /api/upload (ImageKit) and reports the
 * resulting URLs through onChange. Controlled — the parent owns the list of URLs.
 */
export default function ImageUpload({
  value,
  onChange,
  multiple = true,
  max = 20,
  folder = "properties",
  showCover = multiple,
  error,
  onBusyChange,
  className,
}: ImageUploadProps) {
  const [pending, setPending] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const pendingRef = useRef(0);
  // Uploads finish out of order; keep the latest list so none are lost.
  const valueRef = useRef(value);
  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  const limit = multiple ? max : 1;
  const canAddMore = multiple ? value.length + pending < limit : true;

  async function handleFiles(fileList: FileList | null) {
    if (!fileList?.length) return;
    setUploadError(null);
    const room = multiple ? limit - value.length - pendingRef.current : 1;
    const files = Array.from(fileList).slice(0, Math.max(0, room));
    if (files.length < fileList.length) setUploadError(`You can add up to ${limit} images.`);
    if (!files.length) return;

    pendingRef.current += files.length;
    setPending(pendingRef.current);
    onBusyChange?.(true);

    await Promise.all(
      files.map(async (file) => {
        try {
          const { url } = await uploadFile(file, folder);
          const next = multiple ? [...valueRef.current, url] : [url];
          valueRef.current = next;
          onChange(next);
        } catch (err) {
          setUploadError(err instanceof Error ? err.message : "Upload failed.");
        } finally {
          pendingRef.current -= 1;
          setPending(pendingRef.current);
          if (pendingRef.current === 0) onBusyChange?.(false);
        }
      })
    );
    if (inputRef.current) inputRef.current.value = "";
  }

  function move(index: number, delta: number) {
    const target = index + delta;
    if (target < 0 || target >= value.length) return;
    const next = [...value];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  function remove(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  const message = uploadError ?? error;

  return (
    <div className={className}>
      <div className={cn("grid gap-3", multiple ? "grid-cols-2 sm:grid-cols-4" : "max-w-xs")}>
        {value.map((url, index) => (
          <div
            key={url}
            className="relative aspect-[4/3] overflow-hidden rounded-md border border-border bg-surface-muted"
          >
            <Image src={url} alt={`Image ${index + 1}`} fill sizes="240px" className="object-cover" />
            {showCover && index === 0 && (
              <span className="absolute left-2 top-2 rounded bg-highlight px-1.5 py-0.5 text-[11px] font-semibold uppercase text-ink">
                Cover
              </span>
            )}
            <div className="absolute inset-x-0 bottom-0 flex justify-between bg-ink/60 p-1">
              {multiple ? (
                <div className="flex gap-1">
                  <IconButton label="Move left" onClick={() => move(index, -1)} disabled={index === 0}>
                    <ArrowLeft className="h-4 w-4" />
                  </IconButton>
                  <IconButton
                    label="Move right"
                    onClick={() => move(index, 1)}
                    disabled={index === value.length - 1}
                  >
                    <ArrowRight className="h-4 w-4" />
                  </IconButton>
                </div>
              ) : (
                <span />
              )}
              <IconButton label="Remove image" onClick={() => remove(index)} danger>
                <X className="h-4 w-4" />
              </IconButton>
            </div>
          </div>
        ))}

        {Array.from({ length: pending }).map((_, i) => (
          <div
            key={`pending-${i}`}
            className="grid aspect-[4/3] place-items-center rounded-md border border-border bg-surface-muted"
          >
            <Loader2 className="h-5 w-5 animate-spin text-muted" aria-label="Uploading" />
          </div>
        ))}

        {canAddMore && (multiple || (value.length === 0 && pending === 0)) && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex aspect-[4/3] flex-col items-center justify-center gap-1 rounded-md border-2 border-dashed border-border bg-surface text-sm text-muted transition hover:border-primary hover:text-primary"
          >
            <ImagePlus className="h-6 w-6" aria-hidden="true" />
            {multiple ? "Add images" : "Upload image"}
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        multiple={multiple}
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      <p className="mt-2 text-xs text-muted">
        JPG, PNG or WebP, up to {MAX_UPLOAD_MB} MB each.
        {showCover && " The first image is the cover photo."}
      </p>
      {message && <p className="mt-1 text-sm text-danger">{message}</p>}
    </div>
  );
}

function IconButton({
  label,
  danger,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { label: string; danger?: boolean }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cn(
        "grid h-7 w-7 place-items-center rounded text-on-primary disabled:opacity-30",
        danger ? "hover:bg-danger" : "hover:bg-white/20"
      )}
      {...props}
    />
  );
}
