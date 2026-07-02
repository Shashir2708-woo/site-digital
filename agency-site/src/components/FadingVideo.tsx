import { useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';

interface FadingVideoProps {
  src: string | string[];
  className?: string;
  style?: CSSProperties;
}

const FADE_IN_MS = 500;
const FADE_OUT_MS = 550;
const FADE_OUT_THRESHOLD = 0.55;

export default function FadingVideo({ src, className, style }: FadingVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [opacity, setOpacity] = useState(0);
  const opacityRef = useRef(0);
  const fadingOutRef = useRef(false);
  const indexRef = useRef(0);
  const [currentSrc, setCurrentSrc] = useState<string>(
    Array.isArray(src) ? src[0] : src
  );

  useEffect(() => {
    opacityRef.current = 0;
    setOpacity(0);
    fadingOutRef.current = false;
    indexRef.current = 0;
    setCurrentSrc(Array.isArray(src) ? src[0] : src);
  }, [src]);

  const animateOpacity = (from: number, to: number, duration: number) => {
    const start = performance.now();
    const step = (now: number) => {
      const elapsed = now - start;
      const t = Math.min(elapsed / duration, 1);
      const value = from + (to - from) * t;
      opacityRef.current = value;
      setOpacity(value);
      if (t < 1) {
        requestAnimationFrame(step);
      }
    };
    requestAnimationFrame(step);
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedData = () => {
      fadingOutRef.current = false;
      animateOpacity(opacityRef.current, 1, FADE_IN_MS);
    };

    const handleTimeUpdate = () => {
      if (!video.duration || Number.isNaN(video.duration)) return;
      const remaining = video.duration - video.currentTime;
      if (remaining <= FADE_OUT_THRESHOLD && !fadingOutRef.current) {
        fadingOutRef.current = true;
        animateOpacity(opacityRef.current, 0, FADE_OUT_MS);
      }
    };

    const handleEnded = () => {
      if (Array.isArray(src) && src.length > 1) {
        indexRef.current = (indexRef.current + 1) % src.length;
        setCurrentSrc(src[indexRef.current]);
      } else {
        video.currentTime = 0;
        video.play().catch(() => {});
        fadingOutRef.current = false;
        animateOpacity(opacityRef.current, 1, FADE_IN_MS);
      }
    };

    video.addEventListener('loadeddata', handleLoadedData);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('loadeddata', handleLoadedData);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('ended', handleEnded);
    };
  }, [src, currentSrc]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.load();
    video.play().catch(() => {});
  }, [currentSrc]);

  return (
    <video
      ref={videoRef}
      className={className}
      style={{ ...style, opacity, transition: 'none' }}
      src={currentSrc}
      autoPlay
      muted
      playsInline
      preload="auto"
    />
  );
}
