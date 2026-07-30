"use client";

interface ImageLightboxProps {
  imageUrl: string;
  index: number;
  total: number;
  onClose: () => void;
  onPrevious: () => void;
  onNext: () => void;
}

export default function ImageLightbox({
  imageUrl,
  index,
  total,
  onClose,
  onPrevious,
  onNext,
}: ImageLightboxProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
      <button
        onClick={onClose}
        className="absolute right-5 top-5 rounded-full bg-white/10 px-4 py-2 text-white"
      >
        ✕
      </button>

      <button
        onClick={onPrevious}
        className="absolute left-5 rounded-full bg-white/10 px-4 py-3 text-2xl text-white"
      >
        ‹
      </button>

      <img
        src={imageUrl}
        alt="Photo"
        className="max-h-[90vh] max-w-[95vw] rounded-3xl object-contain"
      />

      <button
        onClick={onNext}
        className="absolute right-5 rounded-full bg-white/10 px-4 py-3 text-2xl text-white"
      >
        ›
      </button>

      <div className="absolute bottom-5 rounded-full bg-black/60 px-4 py-2 text-sm text-white">
        {index + 1} / {total}
      </div>
    </div>
  );
}

