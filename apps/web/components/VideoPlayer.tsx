"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import Hls from "hls.js";
import { Settings } from "lucide-react";

interface QualityLevel {
  index: number;
  height: number;
  label: string;
}

interface VideoPlayerProps {
  src: string;
  poster?: string;
  autoPlay?: boolean;
  onPlay?: () => void;
}

export default function VideoPlayer({
  src,
  poster,
  autoPlay = false,
  onPlay,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [qualities, setQualities] = useState<QualityLevel[]>([]);
  const [currentQuality, setCurrentQuality] = useState(-1); // -1 = Auto
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [autoLabel, setAutoLabel] = useState("Auto");

  // Close menu on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowQualityMenu(false);
      }
    }
    if (showQualityMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showQualityMenu]);

  const onLevelChange = useCallback(() => {
    const hls = hlsRef.current;
    if (!hls) return;
    const actual = hls.currentLevel;
    if (actual >= 0 && hls.levels[actual]) {
      setAutoLabel(`Auto (${hls.levels[actual].height}p)`);
    }
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;

    setError(null);
    setQualities([]);
    setCurrentQuality(-1);
    setAutoLabel("Auto");

    const streamUrl = src.startsWith("http")
      ? src
      : `${process.env.NEXT_PUBLIC_STREAM_URL || ""}${src}`;

    const isHls =
      streamUrl.includes(".m3u8") ||
      streamUrl.includes("/hls/") ||
      streamUrl.includes("/stream/");

    if (isHls && Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false,
        startLevel: -1,
        capLevelToPlayerSize: true,
        maxBufferLength: 30,
        maxMaxBufferLength: 60,
      });

      hls.loadSource(streamUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, (_event, data) => {
        const levels: QualityLevel[] = data.levels.map((level, index) => ({
          index,
          height: level.height,
          label: `${level.height}p`,
        }));
        // Sort by height ascending
        levels.sort((a, b) => a.height - b.height);
        setQualities(levels);

        if (autoPlay) {
          video.play().catch(() => {});
        }
      });

      hls.on(Hls.Events.LEVEL_SWITCHED, onLevelChange);

      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.error("HLS network error, attempting recovery...");
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.error("HLS media error, attempting recovery...");
              hls.recoverMediaError();
              break;
            default:
              setError("Failed to load video stream.");
              hls.destroy();
              break;
          }
        }
      });

      hlsRef.current = hls;
    } else if (isHls && video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = streamUrl;
      if (autoPlay) {
        video.play().catch(() => {});
      }
    } else {
      video.src = streamUrl;
      if (autoPlay) {
        video.play().catch(() => {});
      }
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.off(Hls.Events.LEVEL_SWITCHED, onLevelChange);
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [src, autoPlay, onLevelChange]);

  const handleQualityChange = (levelIndex: number) => {
    const hls = hlsRef.current;
    if (!hls) return;

    hls.currentLevel = levelIndex; // -1 for auto
    setCurrentQuality(levelIndex);
    setShowQualityMenu(false);
  };

  const handlePlay = () => {
    if (onPlay) {
      onPlay();
    }
  };

  const posterUrl = poster
    ? poster.startsWith("http")
      ? poster
      : `${process.env.NEXT_PUBLIC_STREAM_URL || ""}${poster}`
    : undefined;

  if (error) {
    return (
      <div className="relative aspect-video bg-black rounded-xl flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 text-sm mb-2">{error}</p>
          <button
            onClick={() => setError(null)}
            className="text-sm text-gray-400 hover:text-white underline"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative group aspect-video bg-black rounded-xl overflow-hidden">
      <video
        ref={videoRef}
        poster={posterUrl}
        controls
        playsInline
        onPlay={handlePlay}
        className="w-full h-full object-contain"
        style={{ backgroundColor: "#000" }}
      >
        Your browser does not support the video element.
      </video>

      {/* Quality Selector */}
      {qualities.length > 1 && (
        <div ref={menuRef} className="absolute top-3 right-3 z-10">
          <button
            onClick={() => setShowQualityMenu((prev) => !prev)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-black/70 text-white text-xs font-medium backdrop-blur-sm hover:bg-black/90 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
            title="Video quality"
          >
            <Settings className="w-3.5 h-3.5" />
            {currentQuality === -1
              ? autoLabel
              : `${qualities.find((q) => q.index === currentQuality)?.label ?? ""}`}
          </button>

          {showQualityMenu && (
            <div className="absolute top-full right-0 mt-1 min-w-[140px] bg-surface-dark/95 backdrop-blur-md border border-surface-border rounded-lg shadow-xl overflow-hidden">
              {/* Auto option */}
              <button
                onClick={() => handleQualityChange(-1)}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs transition-colors ${
                  currentQuality === -1
                    ? "bg-brand/20 text-brand font-semibold"
                    : "text-gray-300 hover:bg-surface-hover"
                }`}
              >
                <span>{autoLabel}</span>
                {currentQuality === -1 && (
                  <span className="w-1.5 h-1.5 rounded-full bg-brand" />
                )}
              </button>

              <div className="border-t border-surface-border" />

              {/* Quality levels — highest first */}
              {[...qualities].reverse().map((q) => (
                <button
                  key={q.index}
                  onClick={() => handleQualityChange(q.index)}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs transition-colors ${
                    currentQuality === q.index
                      ? "bg-brand/20 text-brand font-semibold"
                      : "text-gray-300 hover:bg-surface-hover"
                  }`}
                >
                  <span>{q.label}</span>
                  {currentQuality === q.index && (
                    <span className="w-1.5 h-1.5 rounded-full bg-brand" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
