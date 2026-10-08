import React, { useState } from 'react';
import { getGoogleDriveImageUrl } from '../utils/drive';

interface DriveImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  driveIdOrUrl?: string;
  size?: number;
  fallbackText?: string;
}

export const DriveImage: React.FC<DriveImageProps> = ({
  driveIdOrUrl,
  size = 1000,
  fallbackText = 'Produk Jastip',
  className = '',
  alt = '',
  ...props
}) => {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const resolvedUrl = driveIdOrUrl
    ? getGoogleDriveImageUrl(driveIdOrUrl, size)
    : 'https://placehold.co/600x600/f1f5f9/475569?text=' + encodeURIComponent(fallbackText);

  return (
    <div className={`relative overflow-hidden bg-slate-100 ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 bg-slate-200 animate-pulse flex items-center justify-center">
          <span className="text-slate-400 text-xs">Memuat...</span>
        </div>
      )}
      <img
        src={hasError ? 'https://placehold.co/600x600/f1f5f9/475569?text=' + encodeURIComponent(fallbackText) : resolvedUrl}
        alt={alt || fallbackText}
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          isLoading ? 'opacity-0' : 'opacity-100'
        }`}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false);
          setHasError(true);
        }}
        loading="lazy"
        {...props}
      />
    </div>
  );
};
