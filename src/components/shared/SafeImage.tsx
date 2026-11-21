import { useState } from 'react';
import { Leaf } from 'lucide-react';

interface SafeImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackTitle?: string;
}

export function SafeImage({ src, alt, className = '', fallbackTitle }: SafeImageProps) {
  const [failed, setFailed] = useState(false);

  if (failed || !src) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-[#F5E6EC] text-[#164A31] p-5 text-center border border-[#E5D5DA] ${className}`}
        role="img"
        aria-label={alt}
      >
        <Leaf className="w-7 h-7 text-[#D97706] mb-2 opacity-85" strokeWidth={1.5} />
        <span className="font-display text-xs sm:text-sm font-medium text-[#164A31] line-clamp-2">
          {fallbackTitle || alt}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
    />
  );
}
