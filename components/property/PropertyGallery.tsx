import Image from "next/image";

/** Two large photos side by side, plus a strip of the rest. */
export default function PropertyGallery({ images, alt }: { images: string[]; alt: string }) {
  const [first, second, ...rest] = images;
  if (!first) return null;

  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <div className="relative h-72 overflow-hidden rounded-lg sm:h-96">
          <Image
            src={first}
            alt={`${alt} - photo 1`}
            fill
            sizes="(max-width: 640px) 100vw, 50vw"
            className="object-cover"
            priority
          />
        </div>
        {second && (
          <div className="relative hidden h-96 overflow-hidden rounded-lg sm:block">
            <Image src={second} alt={`${alt} - photo 2`} fill sizes="50vw" className="object-cover" />
          </div>
        )}
      </div>
      {rest.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {rest.map((src, i) => (
            <div key={src} className="relative h-24 w-36 shrink-0 overflow-hidden rounded-md">
              <Image src={src} alt={`${alt} - photo ${i + 3}`} fill sizes="144px" className="object-cover" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
