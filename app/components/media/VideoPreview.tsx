'use client';

import { useEffect, useRef, useState } from 'react';
import { Play } from 'lucide-react';

interface VideoPreviewProps {
  src: string;
  poster?: string | null;
  className?: string;
  mediaClassName?: string;
  showOverlay?: boolean;
  enableHover?: boolean;
  allowClick?: boolean;
  stopClickPropagation?: boolean;
  openOnClick?: boolean;
  onOpen?: () => void;
  muted?: boolean;
  loop?: boolean;
  ariaLabel?: string;
}

const canAutoplayOnHover = () => {
  if (typeof window === 'undefined') return false;
  const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
  const connection = (navigator as any)?.connection;
  const saveData = Boolean(connection?.saveData);
  const effectiveType = typeof connection?.effectiveType === 'string' ? connection.effectiveType : '';
  const slowConnection = effectiveType.includes('2g') || effectiveType.includes('slow-2g');
  return !(reduceMotion || saveData || slowConnection);
};

export function VideoPreview({
  src,
  poster,
  className = '',
  mediaClassName = '',
  showOverlay = true,
  enableHover = true,
  allowClick = true,
  stopClickPropagation = false,
  openOnClick = true,
  onOpen,
  muted = true,
  loop = true,
  ariaLabel = 'Video abspielen',
}: VideoPreviewProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [active, setActive] = useState(false);
  const [hoverEnabled, setHoverEnabled] = useState(enableHover);

  useEffect(() => {
    setHoverEnabled(enableHover && !onOpen && canAutoplayOnHover());
  }, [enableHover, onOpen]);

  useEffect(() => {
    if (!active) return;
    const video = videoRef.current;
    if (!video) return;
    const playPromise = video.play();
    if (playPromise?.catch) playPromise.catch(() => {});
  }, [active]);

  const deactivate = () => {
    const video = videoRef.current;
    if (video) {
      video.pause();
      video.currentTime = 0;
    }
    setActive(false);
  };

  const activate = () => setActive(true);

  const toggle = (event?: React.SyntheticEvent) => {
    if (stopClickPropagation) {
      event?.stopPropagation();
    }
    if (active) {
      deactivate();
    } else {
      activate();
    }
  };

  const handleOpen = (event?: React.SyntheticEvent) => {
    if (stopClickPropagation) {
      event?.stopPropagation();
    }
    if (onOpen) {
      onOpen();
      return;
    }
    if (!allowClick) return;
    toggle(event);
  };

  const canActivate = Boolean(onOpen ? openOnClick : allowClick);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!canActivate) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleOpen(event);
    }
  };

  return (
    <div
      className={`relative ${className}`}
      onMouseEnter={hoverEnabled ? activate : undefined}
      onMouseLeave={hoverEnabled ? deactivate : undefined}
      onClick={canActivate ? handleOpen : undefined}
      onKeyDown={handleKeyDown}
      role={canActivate ? 'button' : undefined}
      tabIndex={canActivate ? 0 : -1}
      aria-label={canActivate ? ariaLabel : undefined}
    >
      {active ? (
        <video
          ref={videoRef}
          src={src}
          className={mediaClassName}
          muted={muted}
          loop={loop}
          playsInline
          preload="metadata"
          onEnded={deactivate}
        />
      ) : poster ? (
        <img
          src={poster}
          alt=""
          className={mediaClassName}
          loading="lazy"
          decoding="async"
        />
      ) : (
        <div className={`flex h-full w-full items-center justify-center bg-gradient-to-br from-black/40 to-black/80 ${mediaClassName}`}>
          <Play className="h-8 w-8 text-white/70" />
        </div>
      )}

      {showOverlay && !active && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              handleOpen(event);
            }}
            className="pointer-events-auto flex h-12 w-12 items-center justify-center rounded-full border border-white/40 bg-black/50"
            aria-label={ariaLabel}
          >
            <Play className="h-5 w-5 text-white" />
          </button>
        </div>
      )}
    </div>
  );
}
