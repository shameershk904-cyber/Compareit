"use client";

import { useState } from "react";
import Image from "next/image";
import { type Phone } from "@/types";
import { getSupabaseImageUrl } from "@/lib/utils";

export function ProductGallery({ phone }: { phone: Phone }) {
  const images = phone.images && phone.images.length > 0 ? phone.images : [phone.image];
  const [activeImage, setActiveImage] = useState(images[0]);

  return (
    <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm sticky top-24">
      {/* Main Image */}
      <div className="relative w-full aspect-square mb-6 rounded-2xl overflow-hidden bg-gray-50 flex items-center justify-center p-4">
        <Image
          src={getSupabaseImageUrl(activeImage)}
          alt={`${phone.brand} ${phone.model}`}
          fill
          className="object-contain transition-opacity duration-300"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          priority
        />
      </div>

      {/* Thumbnails */}
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {images.map((img, idx) => (
          <button
            key={idx}
            onClick={() => setActiveImage(img)}
            className={`relative w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 border-2 transition-all ${
              activeImage === img ? "border-primary opacity-100" : "border-transparent opacity-60 hover:opacity-100 bg-gray-50"
            }`}
          >
            <Image
              src={getSupabaseImageUrl(img)}
              alt={`${phone.brand} thumbnail ${idx + 1}`}
              fill
              className="object-contain p-2"
              sizes="80px"
            />
          </button>
        ))}
      </div>
    </div>
  );
}
