"use client";

import Image from "next/image";
import { useState } from "react";

type GalleryImage = {
  id: string;
  url: string;
};

export function ProductGallery({
  mainImageUrl,
  name,
  images,
}: {
  mainImageUrl: string;
  name: string;
  images: GalleryImage[];
}) {
  const allImages = [{ key: "main", url: mainImageUrl }, ...images.map((image) => ({ key: image.id, url: image.url }))];
  const [activeUrl, setActiveUrl] = useState(mainImageUrl);

  return (
    <div className="flex flex-col gap-4">
      <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-gray-100">
        <Image
          src={activeUrl}
          alt={name}
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover"
          priority
        />
      </div>

      {allImages.length > 1 && (
        <div className="flex flex-wrap gap-3">
          {allImages.map((image) => {
            const isActive = image.url === activeUrl;
            return (
              <button
                key={image.key}
                type="button"
                onClick={() => setActiveUrl(image.url)}
                aria-label={`View ${name} image`}
                aria-pressed={isActive}
                className={`relative h-20 w-20 overflow-hidden rounded-xl bg-gray-100 ${
                  isActive
                    ? "ring-2 ring-persian-blue"
                    : "ring-1 ring-gray-200 hover:ring-gray-300"
                }`}
              >
                <Image
                  src={image.url}
                  alt=""
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
