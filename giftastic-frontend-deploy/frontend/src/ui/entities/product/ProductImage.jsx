import { useState } from 'react';

export default function ProductImage({ src, alt, className = '' }) {
  const [failedSrc, setFailedSrc] = useState(null);
  const unavailable = !src || failedSrc === src;

  if (unavailable) {
    return (
      <div
        role="img"
        aria-label={`${alt || 'Product'} image unavailable`}
        className={`flex items-center justify-center bg-stone-100 text-on-surface-variant ${className}`}
      >
        <span className="material-symbols-outlined text-3xl" aria-hidden="true">image_not_supported</span>
        <span className="sr-only">No image available</span>
      </div>
    );
  }

  return <img src={src} alt={alt} onError={() => setFailedSrc(src)} className={className} />;
}
